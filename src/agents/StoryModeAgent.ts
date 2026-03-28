import { ai, withRetry, PRIMARY_MODEL, Type } from "./BaseAgent";

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
  9. Format the output as JSON.`;

  const response = await withRetry((model) => ai.models.generateContent({
    model: PRIMARY_MODEL,
    contents: [
      { role: 'user', parts: [{ text: `Create a story about: ${topic}` }] }
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          story: { type: Type.STRING, description: "The short story text broken into lines" },
          imagePrompt: { type: Type.STRING, description: "A prompt for generating a cartoon image" }
        },
        required: ["story", "imagePrompt"]
      }
    }
  }));

  return JSON.parse(response.text);
};
