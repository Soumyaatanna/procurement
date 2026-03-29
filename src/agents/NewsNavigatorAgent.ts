import { ai, withRetry, FALLBACK_MODEL, Type } from "./BaseAgent";
import { briefingCache, feedCache, translationCache, entityCache, getCacheKey } from "../utils/cache";
import { 
  smartGenerateBriefing, 
  smartGenerateFeed, 
  smartGetEntityDetails 
} from "../utils/smartApiRouter";
import firebaseAI from "../utils/firebaseAI";

export const generateBriefingStream = async (
  persona: string, 
  topic: string, 
  onChunk: (chunk: string) => void,
  onSources?: (sources: { title: string, url: string }[]) => void
) => {
  const cacheKey = getCacheKey('briefing', persona, topic);
  
  // Check browser cache first
  const cachedBriefing = briefingCache.get(cacheKey);
  if (cachedBriefing) {
    console.log('Using browser-cached briefing for:', topic);
    onChunk(cachedBriefing);
    return;
  }

  try {
    // Try multi-layer caching (Firestore cache → Cloud Functions with persistence)
    const { briefing, route } = await smartGenerateBriefing(persona, topic);
    if (briefing) {
      console.log(`Using briefing from ${route.source} (${route.duration}ms)`);
      // Stream cached data by chunking it
      const chunkSize = 100;
      for (let i = 0; i < briefing.length; i += chunkSize) {
        onChunk(briefing.substring(i, i + chunkSize));
      }
      briefingCache.set(cacheKey, briefing);
      return;
    }
  } catch (error) {    const errorMsg = error.message || String(error);
    if (errorMsg.includes('Quota')) {
      onChunk('⏳ **API Quota Limit Reached**\n\nThe Gemini API free tier quota has been exceeded. This is a limitation of the free tier. To continue using the app:\n\n1. **Wait** for the quota to reset (daily reset at midnight UTC)\n2. **Upgrade** to a paid Google Cloud plan\n3. Try cached content by refreshing the page\n\nWe apologize for the inconvenience!');
      return;
    }    console.warn('Smart briefing failed, using client-side Firebase AI:', error);
  }

  // Fallback: Use client-side Firebase AI (distributed quota, no backend calls)
  const systemInstruction = `You are a world-class business intelligence analyst. 
  Create a personalized news briefing for a ${persona}. 
  Synthesize multiple perspectives and provide actionable insights. 
  Format the output in Markdown with clear headings and bullet points.
  
  INTERACTIVE FEATURE: 
  Identify 3-5 key business terms, companies, or people mentioned in the briefing.
  Wrap them in a Markdown link format like this: [Term](entity:Term).
  Example: "The recent [NVIDIA](entity:NVIDIA) earnings report..."
  Only link the first occurrence of each major entity.`;

  const isUrl = topic.trim().startsWith('http://') || topic.trim().startsWith('https://');
  const prompt = isUrl 
    ? `Analyze and summarize the content at this URL: ${topic}. Provide insights relevant to a ${persona}.` 
    : `Provide a deep briefing on: ${topic}`;

  try {
    // Use client-side Firebase AI (no quota impact on backend)
    const fullText = await firebaseAI.generateText(prompt, true); // Use pro model for quality
    
    // Stream the response by chunking
    const chunkSize = 100;
    for (let i = 0; i < fullText.length; i += chunkSize) {
      onChunk(fullText.substring(i, i + chunkSize));
    }
    
    briefingCache.set(cacheKey, fullText);
  } catch (error) {
    console.error('Client-side briefing failed, last resort retry...', error);
    // Last resort: Try direct Gemini API
    let fullText = '';
    const response = await withRetry((model) => ai.models.generateContentStream({
      model,
      contents: prompt,
      config: { systemInstruction },
    }));

    for await (const chunk of response) {
      if (chunk.text) {
        fullText += chunk.text;
        onChunk(chunk.text);
      }
    }
    
    briefingCache.set(cacheKey, fullText);
  }
};

export const generatePersonalizedFeed = async (persona: string, interests: string[]) => {
  const cacheKey = getCacheKey('feed', persona, ...interests);
  
  // Check browser cache first
  const cachedFeed = feedCache.get(cacheKey);
  if (cachedFeed) {
    console.log('Using browser-cached feed for:', persona);
    return cachedFeed;
  }

  // Use smart router (checks Firestore cache → Firebase AI → Cloud Functions)
  const { feed, route } = await smartGenerateFeed(persona, interests);
  console.log(`Generated feed via ${route.source} in ${route.duration}ms`);
  
  // Cache in browser
  feedCache.set(cacheKey, feed);
  return feed;
};

export const translateNews = async (text: string, targetLanguage: string) => {
  const cacheKey = getCacheKey('translation', targetLanguage, text.substring(0, 50));
  
  // Check browser cache first
  const cachedTranslation = translationCache.get(cacheKey);
  if (cachedTranslation) {
    console.log('Using browser-cached translation for:', targetLanguage);
    return cachedTranslation;
  }

  try {
    // Use client-side Firebase AI for translation (distributed quota)
    const result = await firebaseAI.generateText(
      `Translate the following business news into ${targetLanguage}. 
      Provide a culturally adapted explanation with local context, not just a literal translation: ${text}`,
      false // use flash model for faster, lower-quota translation
    );
    
    translationCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Translation failed:', error);
    // Fallback to direct retry
    const response = await withRetry((model) => ai.models.generateContent({
      model: FALLBACK_MODEL,
      contents: `Translate the following business news into ${targetLanguage}. 
      Provide a culturally adapted explanation with local context, not just a literal translation: ${text}`,
    }));
    
    const result = response.text;
    translationCache.set(cacheKey, result);
    return result;
  }
};

export const getEntityDetails = async (entity: string) => {
  const cacheKey = getCacheKey('entity', entity);
  
  // Check browser cache first
  const cachedEntity = entityCache.get(cacheKey);
  if (cachedEntity) {
    console.log('Using browser-cached entity details for:', entity);
    return cachedEntity;
  }

  // Use smart router (checks Firestore cache → Firebase AI → Cloud Functions)
  const { text, sources, route } = await smartGetEntityDetails(entity);
  console.log(`Retrieved entity details via ${route.source} in ${route.duration}ms`);
  
  const result = {
    text,
    sources: sources || []
  };
  entityCache.set(cacheKey, result);
  return result;
};
