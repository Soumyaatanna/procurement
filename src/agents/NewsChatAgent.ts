import { ai, withRetry, FALLBACK_MODEL } from "./BaseAgent";
import firebaseAI from "../utils/firebaseAI";

export const chatWithNews = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const systemInstruction = `You are a helpful business news assistant. 
  You can answer questions about current events, business trends, and financial news.
  Always provide the latest information if the user asks about recent events.
  Keep your answers concise, professional, and insightful.`;

  try {
    // Use client-side Firebase AI first (distributed quota, no backend overhead)
    const text = await firebaseAI.generateText(
      `History: ${history.map(h => h.parts[0].text).join('\n')}\n\nUser: ${message}`,
      false // use flash model for faster chat
    );
    
    return {
      text,
      sources: [] // Firebase AI doesn't support grounding yet
    };
  } catch (error) {
    console.warn('Client Firebase AI failed, using fallback with search:', error);
    // Fallback to direct API with google search
    const response = await withRetry((model) => ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    }));

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title,
        url: chunk.web?.uri
      })).filter((s: any) => s.title && s.url) || []
    };
  }
};
