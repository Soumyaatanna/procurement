/**
 * Firebase AI Client-Side Integration
 * Uses Firebase's Gemini API directly from the client
 * Reduces backend load and 429 errors by distributing API calls
 */

import { getGenerativeModel } from 'firebase/ai';
import { ai } from './firebaseConfig';

// Create model instances
const flashModel = getGenerativeModel(ai, { model: 'gemini-3-flash-preview' });
const proModel = getGenerativeModel(ai, { model: 'gemini-3.1-pro-preview' });

// Simple in-memory cache for client-side AI responses
const aiCache = new Map<string, { data: string; timestamp: number }>();
const AI_CACHE_TTL = 15 * 60 * 1000; // 15 minutes

const getCacheKey = (prompt: string): string => {
  return `ai:${prompt}`.substring(0, 1500);
};

const getFromAICache = (key: string): string | null => {
  const cached = aiCache.get(key);
  if (cached && Date.now() - cached.timestamp < AI_CACHE_TTL) {
    console.log(`✓ AI Cache HIT: ${key.substring(0, 50)}...`);
    return cached.data;
  }
  if (cached) aiCache.delete(key);
  return null;
};

const setAICache = (key: string, data: string): void => {
  aiCache.set(key, { data, timestamp: Date.now() });
  console.log(`✓ AI Cache SET: ${key.substring(0, 50)}...`);
};

/**
 * Generate text with exponential backoff for rate limiting
 * Uses client-side Gemini API to reduce backend load
 */
export const generateText = async (
  prompt: string,
  useProModel = false
): Promise<string> => {
  const cacheKey = getCacheKey(prompt);
  
  // Check cache first
  const cached = getFromAICache(cacheKey);
  if (cached) return cached;

  // WARNING: Pro model exceeds free tier quota quickly
  // Always use flash model to stay within free tier
  const model = flashModel; // Ignore useProModel parameter - free tier only supports flash
  let lastError: any;
  const maxRetries = 2; // Reduce retries to avoid hitting quota again

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`⏳ Generating text (Attempt ${i + 1}/${maxRetries})...`);
      
      const startTime = Date.now();
      const result = await model.generateContent(prompt);
      const duration = Date.now() - startTime;
      
      const text = result.response.text();
      console.log(`✅ Generated text in ${duration}ms`);
      
      // Cache the result
      setAICache(cacheKey, text);
      return text;
    } catch (error: any) {
      lastError = error;
      const errorStr = error.message || JSON.stringify(error);
      
      // Check if it's a quota error
      const isQuotaError = errorStr.includes('429') || 
                          errorStr.includes('quota') ||
                          errorStr.includes('RESOURCE_EXHAUSTED') ||
                          errorStr.includes('free_tier');

      if (isQuotaError) {
        // Extract retry delay from error message if available
        const retryMatch = errorStr.match(/retry in (\d+\.?\d*)/i);
        const retryDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : 5000;
        
        console.warn(
          `⚠️  Quota exceeded. Please wait ${Math.round(retryDelay)}ms before trying again.`
        );
        throw new Error(`Quota limit reached. Please retry in ${Math.round(retryDelay / 1000)} seconds.`);
      }

      console.error(`❌ Error generating text:`, errorStr);
      throw error;
    }
  }

  throw lastError || new Error('Failed to generate text after max retries');
};

/**
 * Summarize text with retries
 * Great for condensing news articles
 */
export const summarizeText = async (text: string): Promise<string> => {
  const prompt = `Provide a concise 2-3 sentence summary of the following text. Keep it professional and factual:\n\n${text}`;
  return generateText(prompt, false);
};

/**
 * Extract entities from text
 * Identify companies, people, and important terms
 */
export const extractEntities = async (text: string): Promise<string[]> => {
  const prompt = `Extract the most important business entities (companies, people, concepts) from this text. Return as a JSON array of strings:\n\n${text}`;
  
  try {
    const result = await generateText(prompt, false);
    const parsed = parseJsonResponse(result);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn('Failed to parse entities, returning empty array');
    return [];
  }
};

/**
 * Generate insights from multiple data points
 * Use pro model for better quality analysis
 */
export const analyzeNews = async (headlines: string[]): Promise<string> => {
  const prompt = `Analyze these business news headlines and provide 3-4 key insights about market trends:\n${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}`;
  return generateText(prompt, false); // Flash model only
};

/**
 * Create a briefing from multiple sources
 * Synthesizes information for a specific persona
 */
export const createPersonalizedBriefing = async (
  persona: string,
  topics: string[]
): Promise<string> => {
  const prompt = `Create a personalized business briefing for a ${persona} covering these topics:\n${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n\nFormat as bullet points with key insights and actionable recommendations.`;
  return generateText(prompt, false); // Flash model only
};

/**
 * Detect sentiment of news
 * Useful for market sentiment analysis
 */
export const analyzeSentiment = async (text: string): Promise<'positive' | 'negative' | 'neutral'> => {
  const prompt = `Analyze the sentiment of this business news. Respond with ONLY one word: positive, negative, or neutral\n\n${text}`;
  
  try {
    const result = await generateText(prompt, false);
    const sentiment = result.toLowerCase().trim();
    if (['positive', 'negative', 'neutral'].includes(sentiment)) {
      return sentiment as 'positive' | 'negative' | 'neutral';
    }
    return 'neutral';
  } catch {
    return 'neutral';
  }
};

/**
 * Generate follow-up questions for deeper analysis
 */
export const generateFollowUpQuestions = async (topic: string): Promise<string[]> => {
  const prompt = `Generate 3-4 insightful follow-up questions for further analysis of this business topic. Return as JSON array:\n\n${topic}`;
  
  try {
    const result = await generateText(prompt, false);
    const parsed = parseJsonResponse(result);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Extract and parse JSON from markdown code blocks or raw JSON
 * Handles responses like: ```json\n[...]\n``` or raw JSON
 */
export const parseJsonResponse = (response: string): any => {
  try {
    // First try direct JSON parse
    return JSON.parse(response);
  } catch (e) {
    // Try extracting from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (parseError) {
        console.warn('Failed to parse JSON from code block:', parseError);
        throw parseError;
      }
    }
    throw e;
  }
};

/**
 * Check if content is cached without making API call
 */
export const isCached = (prompt: string): boolean => {
  const cacheKey = getCacheKey(prompt);
  const cached = aiCache.get(cacheKey);
  return cached ? Date.now() - cached.timestamp < AI_CACHE_TTL : false;
};

/**
 * Clear all AI cache
 */
export const clearAICache = (): void => {
  aiCache.clear();
  console.log('✓ AI cache cleared');
};

export default {
  generateText,
  summarizeText,
  extractEntities,
  analyzeNews,
  createPersonalizedBriefing,
  analyzeSentiment,
  generateFollowUpQuestions,
  isCached,
  clearAICache,
  parseJsonResponse,
};
