/**
 * Firebase Cloud Function Client
 * Helper utilities to call Cloud Functions securely from the client
 * 
 * Caching Strategy:
 * 1. Browser Cache (15 min) - Instant responses
 * 2. Firestore Cache (24 hrs) - Server persists across restarts
 * 3. Scheduled Pre-generation - Popular content cached at midnight (off-peak)
 * 4. Firebase Client AI - Takes load off backend, reduces 429 errors
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const FUNCTION_BASE_URL = import.meta.env.VITE_FUNCTIONS_URL || 
  'http://localhost:5001/aura-news-13e0a/us-central1';

// Client-side cache - shorter TTL since server has persistent cache
const clientCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

// Track pending requests to avoid duplicates
const pendingRequests = new Map<string, Promise<any>>();

const getCacheKey = (functionName: string, data: any): string => {
  return `${functionName}:${JSON.stringify(data)}`;
};

const getFromCache = (key: string): any | null => {
  const cached = clientCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`✓ Browser Cache HIT: ${key}`);
    return cached.data;
  }
  if (cached) clientCache.delete(key);
  return null;
};

const setCache = (key: string, data: any): void => {
  clientCache.set(key, { data, timestamp: Date.now() });
  console.log(`✓ Browser Cache SET: ${key}`);
};

/**
 * Query Firestore cache directly for instant responses
 * Bypasses Cloud Functions entirely for cached content
 */
const getFromFirestoreCache = async (functionName: string, data: any): Promise<any | null> => {
  try {
    const cacheKey = `${functionName}:${JSON.stringify(data)}`.substring(0, 1500);
    const docRef = doc(db, 'api_cache', cacheKey);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const cached = docSnap.data();
      const age = Date.now() - cached.timestamp;
      const TTL = 24 * 60 * 60 * 1000; // 24 hours
      
      if (age < TTL) {
        console.log(`✓ Firestore Cache HIT: ${functionName} (${Math.round(age / 1000)}s old)`);
        return cached.data;
      }
    }
  } catch (error) {
    console.warn('Firestore cache query failed (this is OK):', error);
  }
  return null;
};

export const callCloudFunction = async <T>(
  functionName: string,
  data: any
): Promise<T> => {
  const cacheKey = getCacheKey(functionName, data);
  
  // Check browser cache first (fastest)
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Check for pending duplicate request
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Waiting for existing request: ${cacheKey}`);
    return pendingRequests.get(cacheKey)!;
  }

  // Try Firestore cache directly (bypasses Cloud Function)
  try {
    const firestoreCached = await getFromFirestoreCache(functionName, data);
    if (firestoreCached) {
      setCache(cacheKey, firestoreCached);
      return firestoreCached;
    }
  } catch (error) {
    // Firestore cache query failed, will fall back to Cloud Function
    console.warn('Firestore cache check failed, using Cloud Function:', error);
  }

  const url = `${FUNCTION_BASE_URL}/${functionName}`;
  
  // Create the promise and store it
  const requestPromise = (async () => {
    let lastError: any;
    const maxRetries = 5;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const error = await response.json();
          lastError = error;
          
          // If it's a 429, server is rate limiting - wait longer
          if (response.status === 429) {
            const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
            console.warn(`⚠️  Server rate limited (429). Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(error.error || `Cloud Function ${functionName} failed`);
        }

        const result = await response.json() as T;
        
        // Cache successful response locally
        setCache(cacheKey, result);
        
        return result;
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 500 + Math.random() * 500;
          console.warn(`❌ Error calling ${functionName}. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
    }
    
    throw lastError || new Error(`Failed to call ${functionName} after ${maxRetries} attempts`);
  })();

  pendingRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    pendingRequests.delete(cacheKey);
  }
};

// Specific function callers
export const callGenerateBriefing = (persona: string, topic: string) =>
  callCloudFunction<{ briefing: string; sources: Array<{ title: string; url: string }> }>(
    'generateBriefing',
    { persona, topic }
  );

export const callGenerateFeed = (persona: string, interests: string[]) =>
  callCloudFunction<{ feed: string[] }>(
    'generateFeed',
    { persona, interests }
  );

export const callTranslateNews = (text: string, targetLanguage: string) =>
  callCloudFunction<{ translation: string }>(
    'translateNews',
    { text, targetLanguage }
  );

export const callGetEntityDetails = (entity: string) =>
  callCloudFunction<{ text: string; sources: Array<{ title: string; url: string }> }>(
    'getEntityDetails',
    { entity }
  );
