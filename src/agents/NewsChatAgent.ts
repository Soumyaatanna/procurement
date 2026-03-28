import { ai, withRetry, FALLBACK_MODEL } from "./BaseAgent";

export const chatWithNews = async (message: string, history: { role: string, parts: { text: string }[] }[]) => {
  const systemInstruction = `You are a helpful business news assistant. 
  You can answer questions about current events, business trends, and financial news.
  Always use the Google Search tool to find the latest information if the user asks about recent events.
  Keep your answers concise, professional, and insightful.
  If you provide information from search, try to include the source URLs if available in the grounding metadata.`;

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
};
