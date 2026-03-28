import { ai, withRetry, FALLBACK_MODEL, Type } from "./BaseAgent";
import { briefingCache, feedCache, translationCache, entityCache, getCacheKey } from "../utils/cache";

export const generateBriefingStream = async (
  persona: string, 
  topic: string, 
  onChunk: (chunk: string) => void,
  onSources?: (sources: { title: string, url: string }[]) => void
) => {
  const cacheKey = getCacheKey('briefing', persona, topic);
  
  // Check cache first
  const cachedBriefing = briefingCache.get(cacheKey);
  if (cachedBriefing) {
    console.log('Using cached briefing for:', topic);
    onChunk(cachedBriefing);
    return;
  }

  const isUrl = topic.trim().startsWith('http://') || topic.trim().startsWith('https://');
  
  const systemInstruction = `You are a world-class business intelligence analyst. 
  Create a personalized news briefing for a ${persona}. 
  Synthesize multiple perspectives and provide actionable insights. 
  Format the output in Markdown with clear headings and bullet points.
  
  INTERACTIVE FEATURE: 
  Identify 3-5 key business terms, companies, or people mentioned in the briefing.
  Wrap them in a Markdown link format like this: [Term](entity:Term).
  Example: "The recent [NVIDIA](entity:NVIDIA) earnings report..."
  Only link the first occurrence of each major entity.`;

  const config: any = { systemInstruction };
  if (isUrl) {
    config.tools = [{ urlContext: {} }];
  } else {
    config.tools = [{ googleSearch: {} }];
  }

  let fullText = '';
  const response = await withRetry((model) => ai.models.generateContentStream({
    model,
    contents: isUrl 
      ? `Analyze and summarize the content at this URL: ${topic}. Provide insights relevant to a ${persona}.` 
      : `Provide a deep briefing on: ${topic}`,
    config,
  }));

  for await (const chunk of response) {
    if (chunk.text) {
      fullText += chunk.text;
      onChunk(chunk.text);
    }
    
    if (onSources && chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const sources = chunk.candidates[0].groundingMetadata.groundingChunks
        .map((c: any) => ({
          title: c.web?.title,
          url: c.web?.uri
        }))
        .filter((s: any) => s.title && s.url);
      
      if (sources.length > 0) {
        onSources(sources);
      }
    }
  }

  // Cache the full briefing after it's generated
  briefingCache.set(cacheKey, fullText);
};

export const generatePersonalizedFeed = async (persona: string, interests: string[]) => {
  const cacheKey = getCacheKey('feed', persona, ...interests);
  
  // Check cache first
  const cachedFeed = feedCache.get(cacheKey);
  if (cachedFeed) {
    console.log('Using cached feed for:', persona);
    return cachedFeed;
  }

  const prompt = `Generate 3 important business news headlines and short summaries (2 sentences each) for a ${persona} interested in: ${interests.join(', ')}. 
  Format as a JSON array of strings, where each string is "Headline: Summary".`;
  
  const response = await withRetry((model) => ai.models.generateContent({
    model: FALLBACK_MODEL,
    contents: prompt,
    config: { responseMimeType: "application/json" },
  }));

  const result = JSON.parse(response.text);
  feedCache.set(cacheKey, result);
  return result;
};

export const translateNews = async (text: string, targetLanguage: string) => {
  const cacheKey = getCacheKey('translation', targetLanguage, text.substring(0, 50));
  
  // Check cache first
  const cachedTranslation = translationCache.get(cacheKey);
  if (cachedTranslation) {
    console.log('Using cached translation for:', targetLanguage);
    return cachedTranslation;
  }

  const response = await withRetry((model) => ai.models.generateContent({
    model: FALLBACK_MODEL,
    contents: `Translate the following business news into ${targetLanguage}. 
    Provide a culturally adapted explanation with local context, not just a literal translation: ${text}`,
  }));

  const result = response.text;
  translationCache.set(cacheKey, result);
  return result;
};

export const getEntityDetails = async (entity: string) => {
  const cacheKey = getCacheKey('entity', entity);
  
  // Check cache first
  const cachedEntity = entityCache.get(cacheKey);
  if (cachedEntity) {
    console.log('Using cached entity details for:', entity);
    return cachedEntity;
  }

  const response = await withRetry((model) => ai.models.generateContent({
    model: FALLBACK_MODEL,
    contents: `Provide a concise, high-level business summary of "${entity}". 
    Include its current market position, recent major news, and why it's important in the current business landscape.
    Format the response in Markdown.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  }));

  const result = {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      url: chunk.web?.uri
    })).filter((s: any) => s.title && s.url) || []
  };
  entityCache.set(cacheKey, result);
  return result;
};
