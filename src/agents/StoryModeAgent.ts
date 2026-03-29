import { ai, withRetry, PRIMARY_MODEL, Type } from "./BaseAgent";
import firebaseAI from "../utils/firebaseAI";
import { getMockStorySegment } from "../utils/mockData";

export const generateStorySegment = async (
  persona: string,
  topic: string
) => {
  const systemInstruction = `You are a professional news storyteller. 
  Convert the business news about "${topic}" into a short, engaging story for a ${persona}.
  
  Guidelines:
  1. Start with a strong hook (1 line that grabs attention).
  2. Use simple, conversational language.
  3. Keep it under 80–100 words total.
  4. Break it into 3–4 short lines/paragraphs (like story slides).
  5. Focus on the main event (no unnecessary details).
  6. End with a single line: "Why it matters: [One sentence explanation]".
  7. Keep it factual but slightly dramatic.
  8. Provide a descriptive "imagePrompt" for a vibrant, professional 3D cartoon style illustration related to this story.
  9. Format the output as JSON: { "story": "...", "imagePrompt": "..." }`;

  try {
    // Use client-side Firebase AI (distributed quota)
    const result = await firebaseAI.generateText(
      `Create a story about: ${topic}\n\n${systemInstruction}`,
      false // Use flash model only (free tier)
    );
    
    try {
      return firebaseAI.parseJsonResponse(result);
    } catch {
      // If JSON parsing fails, structure the response
      return {
        story: result,
        imagePrompt: `News story illustration about ${topic}, 3D cartoon style, vibrant colors`
      };
    }
  } catch (error) {
    console.warn('Story generation failed, using mock data:', error);
    
    // Use mock story as graceful fallback
    const mockStory = getMockStorySegment(topic);
    return {
      ...mockStory,
      _isMockData: true
    };
  }
};
