
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
  
  Structure your response in markdown. Start with a level 1 heading "# Product Requirements Document (PRD)" followed by the PRD content. Then, use another level 1 heading "# Development Plan" followed by the development plan content. Do not include any other text before or after these sections.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
            thinkingConfig: { thinkingBudget: 32768 },
        },
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const responseText = response.text;
    
    const devPlanMarker = '# Development Plan';
    const prdMarker = '# Product Requirements Document (PRD)';
    
    const parts = responseText.split(devPlanMarker);

    if (parts.length < 2) {
        // Fallback if the marker is not found or the response is not as expected
        const prdContent = responseText.replace(prdMarker, '').trim();
        return { prd: prdContent, devPlan: "Could not generate a separate development plan.", sources };
    }
    
    const prdContent = parts[0].replace(prdMarker, '').trim();
    const devPlanContent = parts.slice(1).join(devPlanMarker).trim();

    return {
        prd: prdContent,
        devPlan: devPlanContent,
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
