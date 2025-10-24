
import { GoogleGenAI, Chat, Modality, GenerateContentResponse, Type } from "@google/genai";
import type { Note } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chatSession: Chat | null = null;

export const startChat = () => {
    chatSession = ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};

export const sendChatMessage = async (message: string): Promise<string> => {
    if (!chatSession) {
        startChat();
    }
    if (chatSession) {
        const response = await chatSession.sendMessage({ message });
        return response.text;
    }
    return "Chat session not initialized.";
};

export const generateIdeasFromQuery = async (query: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate a list of 5 innovative ideas based on this query: "${query}". Provide a brief description for each.`,
    });
    return response.text;
};

export const generateIdeasFromNote = async (noteContent: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the following note, generate a list of 5 actionable ideas or next steps:\n\n---\n\n${noteContent}`,
    });
    return response.text;
};

export const refineNote = async (noteContent: string): Promise<string> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: `Refine and improve the following text. Fix any grammatical errors, improve clarity, and make the tone more professional. Return only the improved text.\n\n---\n\n${noteContent}`,
    });
    return response.text;
};

export const generateDocuments = async (idea: string): Promise<{ prd: string; devPlan: string; sources: any[] }> => {
    const prompt = `Based on the following idea, generate a detailed Product Requirements Document (PRD) and a high-level Development Plan. Use web search to find relevant up-to-date information, market trends, and potential competitor details to make the documents comprehensive.
  
  Idea: "${idea}"
  
  Format the output strictly as a single JSON object with two keys: "prd" and "devPlan". The value for each key should be a markdown-formatted string.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 32768 },
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    prd: { type: Type.STRING },
                    devPlan: { type: Type.STRING },
                },
                required: ['prd', 'devPlan'],
            },
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const parsed = JSON.parse(response.text);
    
    return {
        prd: parsed.prd,
        devPlan: parsed.devPlan,
        sources: sources,
    };
};

export const generateWireframe = async (prompt: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A high-fidelity, professional UI wireframe for a web application. ${prompt}. Clean, modern, minimalist design.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: '16:9',
        },
    });

    return response.generatedImages[0].image.imageBytes;
};

export const analyzeImage = async (imageData: string, mimeType: string, prompt: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageData,
            mimeType: mimeType,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

export const editImage = async (imageData: string, mimeType: string, prompt: string): Promise<string> => {
    const imagePart = {
        inlineData: {
            data: imageData,
            mimeType: mimeType,
        },
    };
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const editedImagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (editedImagePart?.inlineData) {
        return editedImagePart.inlineData.data;
    }
    throw new Error("Could not edit image.");
};
