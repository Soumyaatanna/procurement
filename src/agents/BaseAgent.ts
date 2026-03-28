import { GoogleGenAI, Type, Modality } from "@google/genai";

// Robust API key detection for both local and cloud environments
const getApiKey = () => {
  // 1. Check for standard GEMINI_API_KEY (usually injected by Vite define)
  if (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // 2. Check for VITE_ prefixed key (standard Vite way for local .env)
  const viteKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (viteKey) {
    return viteKey;
  }

  // 3. Fallback to any other potential environment variable
  return "";
};

const apiKey = getApiKey();

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is missing. Please ensure it is set in your .env file as GEMINI_API_KEY or VITE_GEMINI_API_KEY.");
}

export const ai = new GoogleGenAI({ apiKey });

export const PRIMARY_MODEL = "gemini-3.1-pro-preview";
export const FALLBACK_MODEL = "gemini-3-flash-preview";

export const withRetry = async <T>(fn: (model: string) => Promise<T>, maxRetries = 7): Promise<T> => {
  let lastError: any;
  let currentModel = PRIMARY_MODEL;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(currentModel);
    } catch (error: any) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        if (currentModel === PRIMARY_MODEL) {
          currentModel = FALLBACK_MODEL;
          console.warn(`Quota exceeded for ${PRIMARY_MODEL}, falling back to ${FALLBACK_MODEL}. (Attempt ${i + 1}/${maxRetries})`);
          continue;
        }

        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.log(`Quota exceeded for ${currentModel}. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      console.error(`Gemini API Error (${currentModel}):`, errorStr);
      throw error;
    }
  }
  throw lastError;
};

export { Type, Modality };
