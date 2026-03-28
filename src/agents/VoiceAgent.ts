import { ai, withRetry, Modality } from "./BaseAgent";

export const generateSpeech = async (text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') => {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read this news briefing clearly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  } catch (e) {
    console.error("Speech generation failed:", e);
  }
  return null;
};

export const generatePodcastScript = async (topics: string[], persona: string, specificTopic?: string) => {
  const prompt = specificTopic 
    ? `Create a conversational podcast script for a ${persona} specifically about this topic: ${specificTopic}. 
       Include context from these general interests if relevant: ${topics.join(', ')}. 
       The script should have two hosts, Alex and Sam. 
       Alex is analytical and Sam is enthusiastic. 
       Keep it engaging and under 3 minutes.
       Format the output as a single string of text that can be read aloud.`
    : `Create a conversational podcast script for a ${persona} based on these topics: ${topics.join(', ')}. 
       The script should have two hosts, Alex and Sam. 
       Alex is analytical and Sam is enthusiastic. 
       Keep it engaging and under 3 minutes.
       Format the output as a single string of text that can be read aloud.`;

  const response = await withRetry((model) => ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  }));

  return response.text;
};

export const generateMultiSpeakerPodcast = async (script: string) => {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: 'Alex',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
              },
              {
                speaker: 'Sam',
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' }
                }
              }
            ]
          }
        }
      }
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
  } catch (e) {
    console.error("Multi-speaker podcast generation failed:", e);
  }
  return null;
};
