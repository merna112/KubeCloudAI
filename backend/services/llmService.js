const fetch = require('node-fetch');

async function queryHuggingFaceModel(payload, modelId = "google/flan-t5-small") {
    const API_TOKEN = process.env.HF_API_TOKEN;
    if (!API_TOKEN) {
        console.error("Hugging Face API token not configured (HF_API_TOKEN).");
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
            }
        );
        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Hugging Face API request failed with status ${response.status}: ${errorBody}`);
            if (response.status === 503 && errorBody.includes("currently loading")) {
                 return { error: "Model is currently loading, please try again in a moment.", estimated_time: JSON.parse(errorBody).estimated_time || 30 };
            }
            return { error: `API request failed: ${response.statusText}` };
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error("Error querying Hugging Face model:", error);
        return { error: "Failed to connect to Hugging Face API."};
    }
}

async function getAnswerFromLLM(question) {
    const result = await queryHuggingFaceModel({ inputs: question });

    if (result && result.error) {
        console.warn("Hugging Face API error for LLM:", result.error);
        if (result.error.includes("currently loading")) {
            return `The AI model is currently loading (est. ${result.estimated_time || 20}s). Please try asking again shortly.`;
        }
        return `I encountered an issue with my extended knowledge base: ${result.error}`;
    }
    
    if (result && Array.isArray(result) && result[0] && result[0].generated_text) {
        return result[0].generated_text;
    }
    
    console.warn("Unexpected LLM response format:", result);
    return null;
}
module.exports = { getAnswerFromLLM };