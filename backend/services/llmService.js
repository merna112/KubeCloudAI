const fetch = require('node-fetch');

async function queryHuggingFaceModel(payload, modelId = "google/flan-t5-small") {
    const API_TOKEN = process.env.HF_API_TOKEN;
    if (!API_TOKEN) {
        return null;
    }
    try {
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${modelId}`,
            {
                headers: { 
                    Authorization: `Bearer ${API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                method: "POST",
                body: JSON.stringify(payload),
                timeout: 10000 
            }
        );
        if (!response.ok) {
            const errorBody = await response.text();
            if (response.status === 503 && errorBody.includes("currently loading")) {
                 return { error: "Model is currently loading, please try again in a moment.", estimated_time: JSON.parse(errorBody).estimated_time || 30 };
            }
            return { error: `API request failed: ${response.statusText}` };
        }
        const result = await response.json();
        return result;
    } catch (error) {
        return { error: "Failed to connect to Hugging Face API."};
    }
}

async function getAnswerFromLLM(question) {
    const result = await queryHuggingFaceModel({ inputs: question });

    if (result && result.error) {
        if (result.error.includes("currently loading")) {
            return `The AI model is currently loading (est. ${result.estimated_time || 20}s). Please try asking again shortly.`;
        }
        return `I encountered an issue with my extended knowledge base: ${result.error}`;
    }
    
    if (result && Array.isArray(result) && result[0] && result[0].generated_text) {
        return result[0].generated_text.trim();
    }
    
    return null;
}
module.exports = { getAnswerFromLLM };