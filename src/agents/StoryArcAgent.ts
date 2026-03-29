import { ai, withRetry, Type } from "./BaseAgent";
import firebaseAI from "../utils/firebaseAI";
import { getMockStoryArc } from "../utils/mockData";

export const generateStoryArc = async (topic: string) => {
  const prompt = `Analyze the business story arc for: ${topic}. 
  Provide a detailed timeline of events, key players, and future predictions.
  For each timeline event, provide a simulated stock price or valuation index (0-1000) that reflects the market impact of that event.
  Format the output as JSON: { "title": "...", "timeline": [...], "keyPlayers": [...], "predictions": [...] }`;

  try {
    // Use client-side Firebase AI first (distributed quota)
    const result = await firebaseAI.generateText(prompt, false); // Flash model only
    
    try {
      const parsed = firebaseAI.parseJsonResponse(result);
      // Ensure keyPlayers is always an array of strings
      if (parsed.keyPlayers) {
        parsed.keyPlayers = parsed.keyPlayers.map((player: any) => 
          typeof player === 'string' ? player : (player.name || JSON.stringify(player))
        );
      }
      // Ensure predictions is always an array of strings
      if (parsed.predictions) {
        parsed.predictions = parsed.predictions.map((pred: any) => 
          typeof pred === 'string' ? pred : JSON.stringify(pred)
        );
      }
      return parsed;
    } catch {
      // Parse error, return structured response
      return {
        title: topic,
        timeline: [],
        keyPlayers: [],
        predictions: [result]
      };
    }
  } catch (error) {
    console.warn('Story arc generation failed, using mock data:', error);
    
    // Use mock story arc as graceful fallback
    const mockArc = getMockStoryArc(topic);
    return {
      ...mockArc,
      _isMockData: true
    };
  }
};
