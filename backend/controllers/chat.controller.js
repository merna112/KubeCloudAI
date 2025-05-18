const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const Post = require('../models/post.model.js');
const errorHandler = require('../utils/error.js');
const { getLatestTechNews } = require('../services/newsService.js');
const { getAnswerFromLLM: getAnswerFromHuggingFace } = require('../services/llmService.js'); 
require('dotenv').config();

let geminiAI, geminiModel;
if (process.env.GEMINI_API_KEY) {
  try {
    geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    geminiModel = geminiAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
  } catch (error) {
    console.error("ERROR initializing GoogleGenerativeAI:", error.message);
    geminiAI = null; geminiModel = null;
  }
} else {
  console.warn("GEMINI_API_KEY is not set. Gemini features will be unavailable.");
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function findRelevantLocalContent(query) {
   if (!query || typeof query !== 'string' || query.trim() === '') return [];
   try {
       const results = await Post.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
           .select('title slug content category')
           .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
           .limit(3);
       return results.map(post => ({
           title: post.title,
           slug: post.slug,
           url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/post/${post.slug}`,
           contentSnippet: post.content.substring(0, 500) + (post.content.length > 500 ? '...' : ''),
           category: post.category,
           source: 'local_article'
       }));
   } catch (error) {
        if (error.message && error.message.includes('text index required')) {
            console.warn("Text index not found for local content retrieval.");
        } else {
           console.error("Error during local content retrieval:", error.message);
        }
       return [];
   }
}

function extractKeywordsForNews(message) {
    const commonWords = /\b(what|is|the|a|an|about|latest|newest|news|updates|update|for|tell|me|give|some|info|information|on|related to|regarding|of|in)\b/gi;
    let keywords = message.toLowerCase().replace(commonWords, '').replace(/[?.,!]/g, '').trim();
    keywords = keywords.replace(/\s\s+/g, ' ');
    if (!keywords && message.toLowerCase().includes("devops")) return "devops";
    if (!keywords && message.toLowerCase().includes("ai")) return "ai";
    if (!keywords && message.toLowerCase().includes("kubernetes")) return "kubernetes";
    if (!keywords && message.toLowerCase().includes("cloud")) return "cloud";
    return keywords || null;
}

const handleChatMessage = async (req, res, next) => {
  const userMessage = req.body.message;

  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
    return next(errorHandler(400, 'Message cannot be empty.'));
  }

  const trimmedMessage = userMessage.trim();
  let botReplyText = "";
  let source = "unknown";
  let retrievedArticles = [];

  try {
    retrievedArticles = await findRelevantLocalContent(trimmedMessage);

    const isNewsQuery = trimmedMessage.toLowerCase().includes("news") ||
                        trimmedMessage.toLowerCase().includes("latest") ||
                        trimmedMessage.toLowerCase().includes("update") ||
                        trimmedMessage.toLowerCase().includes("newest");

    if (isNewsQuery) {
        const newsKeyword = extractKeywordsForNews(trimmedMessage);
        const newsItems = await getLatestTechNews(newsKeyword);
        if (newsItems && newsItems.length > 0) {
            source = "rss_feeds";
            botReplyText = "Here are some recent headlines I found from external tech feeds:\n\n";
            newsItems.forEach(item => {
                botReplyText += `- ${item.title} (${item.link})\n`;
            });
            retrievedArticles = retrievedArticles.concat(newsItems.map(n => ({ title: n.title, url: n.link, source: 'rss_feed' })));
        }
    }

    if (geminiModel && (!botReplyText || !isNewsQuery || (isNewsQuery && retrievedArticles.filter(a=>a.source === 'local_article').length > 0) )) {
        let promptContext = "No specific blog context found for this query.";
        if (retrievedArticles.filter(a=>a.source === 'local_article').length > 0) {
            promptContext = "Context from KubeCloudAI blog:\n";
            retrievedArticles.filter(a=>a.source === 'local_article').forEach(ctx => {
                promptContext += `Article: "${ctx.title}" (Category: ${ctx.category})\nSnippet: ${ctx.contentSnippet}\n\n`;
            });
        }
        
        const prompt = `You are KubeCloudAI Assistant, a helpful expert for the KubeCloudAI blog (topics: Cloud, Virtualization, Kubernetes, AI, DevOps). Your goal is to answer the user's question.
        
        Instructions:
        - Primarily use the "Context from KubeCloudAI blog" (if provided) to answer the "User Question".
        - If the context answers the question, use that information. You can mention article title(s).
        - If the context doesn't answer, or if there's no context, use your general knowledge for questions within the blog's topics (AI, Cloud, K8s, DevOps, Virtualization).
        - If the question is about very recent news or events not covered by the context, and you have general knowledge, you can use it.
        - If the question is outside the blog's topics, politely state that it's outside your scope.
        - Keep answers concise and helpful. Do not make up information.
        
        ${promptContext}
        User Question: ${trimmedMessage}`;

        try {
            const result = await geminiModel.generateContentStream([prompt], { safetySettings });
            let accumulatedText = "";
            for await (const chunk of result.stream) {
                accumulatedText += chunk.text();
            }
            botReplyText = accumulatedText.trim() || (isNewsQuery && botReplyText ? botReplyText : "Sorry, I couldn't generate a response using Gemini at this moment.");
            if (accumulatedText.trim()) source = "gemini_ai";

        } catch (geminiError) {
            console.error("Error calling Google Gemini API:", geminiError.message);
            if (!botReplyText && process.env.HF_API_TOKEN) {
                 const hfAnswer = await getAnswerFromHuggingFace(trimmedMessage);
                 if (hfAnswer && !hfAnswer.toLowerCase().includes("error") && !hfAnswer.toLowerCase().includes("issue")) {
                     botReplyText = hfAnswer;
                     source = "huggingface_ai_fallback";
                 }
            }
             if (!botReplyText && isNewsQuery) { /* Already handled by RSS or no news found */ }
             else if (!botReplyText) {
                botReplyText = "I encountered an issue with the primary AI assistant. Please try again later.";
             }
        }
    } else if (!botReplyText && process.env.HF_API_TOKEN) {
        const hfAnswer = await getAnswerFromHuggingFace(trimmedMessage);
        if (hfAnswer && !hfAnswer.toLowerCase().includes("error") && !hfAnswer.toLowerCase().includes("issue")) {
            botReplyText = hfAnswer;
            source = "huggingface_ai";
        }
    }
    
    if (!botReplyText || botReplyText.trim() === "") {
        if (retrievedArticles.filter(a=>a.source === 'local_article').length > 0 && !isNewsQuery) {
            botReplyText = "I found these articles that might be relevant to your query:\n\n";
            retrievedArticles.filter(a=>a.source === 'local_article').forEach(ctx => {
                botReplyText += `- ${ctx.title} (${ctx.url})\n`;
            });
            source = "local_articles_fallback_display";
        } else {
            botReplyText = "I'm sorry, I couldn't find a specific answer to your question at this moment. Please try rephrasing or asking about AI, Cloud, Kubernetes, or DevOps.";
            source = "fallback_final";
        }
    }

    res.status(200).json({ reply: botReplyText.trim(), articles: retrievedArticles, source: source });

  } catch (error) {
    console.error("Overall error in handleChatMessage:", error.message);
    let statusCode = 500;
    let message = "An error occurred while processing your chat request.";

    if (error.message) {
        if (error.message.includes('response was blocked due to safety') || error.message.includes('SAFETY')) {
             statusCode = 400;
             message = 'My response was blocked due to safety settings. Please rephrase your question.';
        } else if (error.message.includes('API key not valid')) {
             statusCode = 401;
             message = 'Invalid API Key for a chat service.';
        } else if (error.message.includes('429') || (error.status === 429)) {
             statusCode = 429;
             message = 'Chat service quota exceeded or rate limited. Please try again later.';
        } else if (error.message.includes('404') || error.message.includes('Not Found') || (error.status === 404)) {
             statusCode = 404;
             message = 'Chat service endpoint or model not found. Please check configuration.';
        }
    }
    next(errorHandler(statusCode, message));
  }
};

module.exports = { handleChatMessage };