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
           contentSnippet: post.content.substring(0, 1500) + (post.content.length > 1500 ? '...' : ''),
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
  let articlesForReference = [];

  try {
    const isNewsQuery = trimmedMessage.toLowerCase().includes("news") ||
                        trimmedMessage.toLowerCase().includes("latest") ||
                        trimmedMessage.toLowerCase().includes("update") ||
                        trimmedMessage.toLowerCase().includes("newest");

    const localContentFromDB = await findRelevantLocalContent(trimmedMessage);
    articlesForReference = localContentFromDB || [];

    if (isNewsQuery) {
        const newsKeyword = extractKeywordsForNews(trimmedMessage);
        const newsItems = await getLatestTechNews(newsKeyword);
        if (newsItems && newsItems.length > 0) {
            source = "rss_feeds";
            botReplyText = "Here are some recent headlines I found from external tech feeds:\n\n";
            newsItems.forEach(item => {
                botReplyText += `- ${item.title} (${item.link})\n`;
            });
            articlesForReference = articlesForReference.concat(newsItems.map(n => ({ title: n.title, url: n.link, source: 'rss_feed' })));
        }
    }

    if (geminiModel && (!botReplyText || (isNewsQuery && (!newsItems || newsItems.length === 0) && localContentFromDB.length > 0) )) {
        let contextForGemini = "";
        if (localContentFromDB.length > 0) {
            contextForGemini = "Based on the following content from KubeCloudAI blog articles, please answer the user's question. Focus on extracting relevant information and presenting it directly. If the articles provide steps, list them. If they explain a concept, summarize it. Only use the provided context. If the context is insufficient to answer the question directly, state that and you can optionally mention the titles of the articles that might contain more details.\n\n";
            localContentFromDB.forEach(ctx => {
                contextForGemini += `--- ARTICLE START: "${ctx.title}" (Category: ${ctx.category}) ---\n${ctx.contentSnippet}\n--- ARTICLE END ---\n\n`;
            });
        } else {
            contextForGemini = "There is no specific context from KubeCloudAI blog articles for this query. Please answer using your general knowledge if the question is about AI, Cloud, Kubernetes, DevOps, or Virtualization. If not, state that it's outside your scope.\n\n";
        }
        
        const prompt = `${contextForGemini}User Question: ${trimmedMessage}\n\nAnswer:`;

        try {
            const result = await geminiModel.generateContentStream([prompt], { safetySettings });
            let accumulatedText = "";
            for await (const chunk of result.stream) {
                accumulatedText += chunk.text();
            }
            const geminiGeneratedText = accumulatedText.trim();

            if (geminiGeneratedText) {
                botReplyText = geminiGeneratedText;
                source = localContentFromDB.length > 0 ? "gemini_with_local_context" : "gemini_general_knowledge";
            }
        } catch (geminiError) {
            // Fall through to Hugging Face or other fallbacks
        }
    }
    
    if (!botReplyText && process.env.HF_API_TOKEN) {
        const hfAnswer = await getAnswerFromHuggingFace(trimmedMessage);
        if (hfAnswer && !hfAnswer.toLowerCase().includes("error") && !hfAnswer.toLowerCase().includes("issue")) {
            botReplyText = hfAnswer;
            source = "huggingface_ai";
        }
    }
    
    if (!botReplyText || botReplyText.trim() === "") {
        if (articlesForReference.filter(a => a.source === 'local_article').length > 0 && !isNewsQuery) {
            botReplyText = "I couldn't extract a direct answer, but I found these articles on KubeCloudAI that might contain the information you're looking for:\n\n";
            articlesForReference.filter(a => a.source === 'local_article').forEach(ctx => {
                botReplyText += `- ${ctx.title} (${ctx.url})\n`;
            });
            source = "local_articles_list_fallback";
        } else if (articlesForReference.filter(a => a.source === 'rss_feed').length > 0 && isNewsQuery && (!botReplyText || botReplyText.trim() === "")){
            // This case should ideally be handled by the initial RSS check, but as a safety net
            botReplyText = "Here are some recent headlines I found from external tech feeds:\n\n";
             articlesForReference.filter(a => a.source === 'rss_feed').forEach(item => {
                botReplyText += `- ${item.title} (${item.url})\n`;
            });
            source = "rss_feeds_fallback_display";
        }
        else {
            botReplyText = "I'm sorry, I couldn't find a specific answer or enough information to help with that. Please try rephrasing your question, or ask me about topics like AI, Cloud, Kubernetes, or DevOps.";
            source = "fallback_final";
        }
    }

    res.status(200).json({ reply: botReplyText.trim(), articles: articlesForReference, source: source });

  } catch (error) {
    next(errorHandler(500, "An error occurred while processing your chat request."));
  }
};

module.exports = { handleChatMessage };