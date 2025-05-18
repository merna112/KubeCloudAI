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
    geminiAI = null; geminiModel = null;
  }
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
           .limit(2);
       return results.map(post => ({
           title: post.title,
           slug: post.slug,
           url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/post/${post.slug}`,
           contentSnippet: post.content.substring(0, 300) + (post.content.length > 300 ? '...' : ''),
           category: post.category,
           source: 'local_article'
       }));
   } catch (error) {
       return [];
   }
}

function extractKeywordsForNews(message) {
    const commonWords = /\b(what|is|the|a|an|about|latest|newest|news|updates|update|for|tell|me|give|some|info|information|on|related to|regarding|of|in|show)\b/gi;
    let keywords = message.toLowerCase().replace(commonWords, '').replace(/[?.,!]/g, '').trim();
    keywords = keywords.replace(/\s\s+/g, ' ');
    if (!keywords.trim() && message.toLowerCase().includes("devops")) return "devops";
    if (!keywords.trim() && message.toLowerCase().includes("ai")) return "ai";
    if (!keywords.trim() && message.toLowerCase().includes("kubernetes")) return "kubernetes";
    if (!keywords.trim() && message.toLowerCase().includes("cloud")) return "cloud";
    return keywords.trim() || null;
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
    const isNewsQuery = trimmedMessage.toLowerCase().includes("news") ||
                        trimmedMessage.toLowerCase().includes("latest") ||
                        trimmedMessage.toLowerCase().includes("update") ||
                        trimmedMessage.toLowerCase().includes("newest");

    const localContentPromise = findRelevantLocalContent(trimmedMessage);
    const newsPromise = isNewsQuery ? getLatestTechNews(extractKeywordsForNews(trimmedMessage)) : Promise.resolve([]);
    
    const [localContentResults, newsResults] = await Promise.all([localContentPromise, newsPromise]);

    retrievedArticles = localContentResults || [];

    if (isNewsQuery && newsResults && newsResults.length > 0) {
        source = "rss_feeds";
        botReplyText = "Here are some recent headlines I found from external tech feeds:\n\n";
        newsResults.forEach(item => {
            botReplyText += `- ${item.title} (${item.link})\n`;
        });
        retrievedArticles = retrievedArticles.concat(newsResults.map(n => ({ title: n.title, url: n.link, source: 'rss_feed' })));
    }

    if (!botReplyText && retrievedArticles.length > 0 && !isNewsQuery) {
        source = "local_articles";
        botReplyText = "I found these articles on KubeCloudAI that might be relevant:\n\n";
        retrievedArticles.forEach(ctx => {
            if (ctx.source === 'local_article') {
                botReplyText += `- ${ctx.title} (${ctx.url})\n`;
            }
        });
    }

    if (geminiModel && (!botReplyText || (isNewsQuery && newsResults.length === 0 && retrievedArticles.filter(a=>a.source === 'local_article').length > 0 ))) {
        let promptContext = "No specific blog context found for this query.";
        const localContextForLLM = retrievedArticles.filter(a => a.source === 'local_article');
        if (localContextForLLM.length > 0) {
            promptContext = "Context from KubeCloudAI blog:\n";
            localContextForLLM.forEach(ctx => {
                promptContext += `Article: "${ctx.title}" (Category: ${ctx.category})\nSnippet: ${ctx.contentSnippet}\n\n`;
            });
        }
        
        const prompt = `You are KubeCloudAI Assistant, a helpful expert for the KubeCloudAI blog (topics: Cloud, Virtualization, Kubernetes, AI, DevOps). Your goal is to answer the user's question.
        Instructions:
        - Primarily use the "Context from KubeCloudAI blog" (if provided) to answer the "User Question".
        - If the context doesn't answer, or if there's no context, use your general knowledge for questions within the blog's topics.
        - If the question is about very recent news not covered by context, and you have general knowledge, you can use it.
        - If the question is outside the blog's topics, politely state that it's outside your scope.
        - Keep answers concise. Do not make up information.
        ${promptContext}
        User Question: ${trimmedMessage}`;

        try {
            const result = await geminiModel.generateContentStream([prompt], { safetySettings });
            let accumulatedText = "";
            for await (const chunk of result.stream) {
                accumulatedText += chunk.text();
            }
            if (accumulatedText.trim()) {
                botReplyText = accumulatedText.trim();
                source = "gemini_ai";
            } else if (!botReplyText) {
                // botReplyText = "Sorry, I couldn't generate a detailed response from Gemini at this moment.";
            }
        } catch (geminiError) {
            if (!botReplyText && process.env.HF_API_TOKEN) {
                 const hfAnswer = await getAnswerFromHuggingFace(trimmedMessage);
                 if (hfAnswer && !hfAnswer.toLowerCase().includes("error") && !hfAnswer.toLowerCase().includes("issue")) {
                     botReplyText = hfAnswer;
                     source = "huggingface_ai_fallback";
                 }
            }
             if (!botReplyText) {
                // botReplyText = "I encountered an issue with the primary AI assistant. Please try again later.";
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
        if (retrievedArticles.filter(a=>a.source === 'local_article').length > 0 && !isNewsQuery && source !== "local_articles") {
            botReplyText = "I found these articles that might be relevant to your query:\n\n";
            retrievedArticles.filter(a=>a.source === 'local_article').forEach(ctx => {
                botReplyText += `- ${ctx.title} (${ctx.url})\n`;
            });
            source = "local_articles_fallback_display";
        } else {
            botReplyText = "I'm sorry, I couldn't find a specific answer. Please try rephrasing or asking about AI, Cloud, Kubernetes, or DevOps.";
            source = "fallback_final";
        }
    }

    res.status(200).json({ reply: botReplyText.trim(), articles: retrievedArticles, source: source });

  } catch (error) {
    next(errorHandler(500, "An error occurred while processing your chat request."));
  }
};

module.exports = { handleChatMessage };