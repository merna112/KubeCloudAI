// backend/controllers/chat.controller.js
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const Post = require('../models/post.model');
const errorHandler = require('../utils/error');
require('dotenv').config();

let genAI;
let model;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); 
 
  } catch (error) {
    console.error("FATAL ERROR: Failed to initialize GoogleGenerativeAI.", error);
    genAI = null; model = null;
  }
} else {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set.");
}

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

async function findRelevantContent(query) {
   if (!query) return [];
   try {
       const results = await Post.find({ $text: { $search: query } }, { score: { $meta: "textScore" } })
           .select('title slug content category')
           .limit(3)
           .sort({ score: { $meta: "textScore" } });
       return results.map(post => ({
           title: post.title,
           slug: post.slug,
           contentSnippet: post.content.substring(0, 500) + (post.content.length > 500 ? '...' : ''),
           category: post.category
       }));
   } catch (error) {
        if (error.message && error.message.includes('text index required')) {
            console.warn("Text index not found for RAG search.");
        } else {
           console.error("Error during RAG content retrieval:", error);
        }
       return [];
   }
}

const handleChatMessage = async (req, res, next) => {
  const userMessage = req.body.message;

  if (!genAI || !model) {
    return next(errorHandler(503, "Chat service is temporarily unavailable due to configuration issues."));
  }
  if (!userMessage || typeof userMessage !== 'string' || userMessage.trim() === '') {
    return next(errorHandler(400, 'Message cannot be empty.'));
  }

  const trimmedMessage = userMessage.trim();

  try {
    const relevantContent = await findRelevantContent(trimmedMessage);

    let prompt = `You are KubeCloudAI Assistant, a helpful expert for the KubeCloudAI blog (topics: Cloud, Virtualization, Kubernetes, AI, DevOps). Your goal is to answer the user's question based on the provided context from blog articles.

Instructions:
- Use the provided "Context from KubeCloudAI blog" below to answer the "User Question".
- If the context directly answers the question, use that information. You can mention the article title(s) if relevant.
- If the context doesn't answer the question, use your general knowledge ONLY if the question is within the blog's topics (AI, Cloud, K8s, etc.).
- If the question is outside the blog's topics, politely state that it's outside your scope.
- Keep answers concise and helpful.
- Do not make up information.

Context from KubeCloudAI blog:
`;

    if (relevantContent && relevantContent.length > 0) {
      relevantContent.forEach(ctx => {
        prompt += `Article: "${ctx.title}" (Category: ${ctx.category})\nSnippet: ${ctx.contentSnippet}\n\n`;
      });
    } else {
      prompt += "No specific blog context found for this query.\n\n";
    }

    prompt += `User Question: ${trimmedMessage}`;

    console.log(`Sending prompt to Gemini (${model.model}) for: "${trimmedMessage}"`); 

   
    const result = await model.generateContent(prompt, { safetySettings });
    const response = result.response;

    const botReplyText = response.text() || "Sorry, I couldn't generate a response at this moment.";

    console.log(`Received reply from Gemini: "${botReplyText}"`);

    res.status(200).json({ reply: botReplyText.trim() });

  } catch (error) {
    console.error("Error calling Google AI API or processing chat message:", error);
    let statusCode = 500;
    let message = "An error occurred while processing your chat request with the AI assistant.";

    if (error.message) {
        if (error.message.includes('response was blocked due to safety') || error.message.includes('SAFETY')) {
             statusCode = 400;
             message = 'My response was blocked due to safety settings. Please rephrase your question.';
        } else if (error.message.includes('API key not valid')) {
             statusCode = 401;
             message = 'Invalid API Key for chat service.';
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