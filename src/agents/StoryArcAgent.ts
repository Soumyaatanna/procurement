import { ai, withRetry, Type } from "./BaseAgent";

export const generateStoryArc = async (topic: string) => {
  const response = await withRetry((model) => ai.models.generateContent({
    model,
    contents: `Analyze the business story arc for: ${topic}. 
    Provide a detailed timeline of events, key players, and future predictions.
    For each timeline event, provide a simulated stock price or valuation index (0-1000) that reflects the market impact of that event.`,
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The title of the story arc" },
          timeline: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "The date of the event (e.g. Jan 2024)" },
                event: { type: Type.STRING, description: "Short description of what happened" },
                sentiment: { type: Type.NUMBER, description: "Sentiment score from -1 to 1" },
                price: { type: Type.NUMBER, description: "Simulated stock price or valuation index (0-1000)" }
              },
              required: ["date", "event", "sentiment", "price"]
            }
          },
          keyPlayers: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          predictions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["title", "timeline", "keyPlayers", "predictions"]
      }
    },
  }));

  return JSON.parse(response.text);
};
