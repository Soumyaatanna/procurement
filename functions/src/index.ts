const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize CORS
const corsHandler = cors({ origin: true });

// Initialize Gemini AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const db = admin.firestore();
const CACHE_COLLECTION = 'api_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const PRIMARY_MODEL = 'gemini-3.1-pro-preview';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

// ============ FIRESTORE CACHING & RATE LIMITING ============

// Simple queue to rate limit requests
let requestQueue = [];
let isProcessingQueue = false;
const MAX_CONCURRENT_REQUESTS = 2;
const REQUEST_DELAY_MS = 500; // 500ms between requests

const getCacheKey = (type, params) => {
  return `${type}:${JSON.stringify(params)}`.substring(0, 1500); // Firestore doc ID limit
};

const getFromCache = async (key) => {
  try {
    const doc = await db.collection(CACHE_COLLECTION).doc(key).get();
    
    if (doc.exists) {
      const cached = doc.data();
      const age = Date.now() - cached.timestamp;
      
      if (age < CACHE_TTL) {
        console.log(`✓ Firestore Cache HIT for: ${key} (${Math.round(age / 1000)}s old)`);
        return cached.data;
      } else {
        // Delete expired cache entry
        await db.collection(CACHE_COLLECTION).doc(key).delete();
        return null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error reading from Firestore cache:', error);
    return null;
  }
};

const setCache = async (key, data) => {
  try {
    await db.collection(CACHE_COLLECTION).doc(key).set({
      data,
      timestamp: Date.now(),
      type: key.split(':')[0],
    });
    console.log(`✓ Firestore Cache SET for: ${key}`);
  } catch (error) {
    console.error('Error writing to Firestore cache:', error);
  }
};

// Track pending requests to deduplicate concurrent calls
const pendingRequests = new Map();

const getDuplicate = (key) => pendingRequests.get(key);
const setDuplicate = (key, promise) => pendingRequests.set(key, promise);
const clearDuplicate = (key) => pendingRequests.delete(key);

const queueRequest = async (fn) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ fn, resolve, reject });
    processQueue();
  });
};

const processQueue = async () => {
  if (isProcessingQueue || requestQueue.length === 0) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, MAX_CONCURRENT_REQUESTS);
    
    try {
      await Promise.all(
        batch.map(async ({ fn, resolve, reject }) => {
          try {
            const result = await fn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
      );
    } catch (error) {
      console.error('Queue processing error:', error);
    }

    // Delay between batches
    if (requestQueue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY_MS));
    }
  }

  isProcessingQueue = false;
};

/**
 * Helper function to handle API calls with retry logic + caching + rate limiting
 */
const withRetry = async (fn, maxRetries = 7) => {
  let lastError;
  let currentModel = PRIMARY_MODEL;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queueRequest(() => fn(currentModel));
    } catch (error) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        if (currentModel === PRIMARY_MODEL) {
          currentModel = FALLBACK_MODEL;
          console.warn(`⚠️  Quota exceeded for ${PRIMARY_MODEL}, falling back to ${FALLBACK_MODEL}`);
          continue;
        }

        if (i < maxRetries - 1) {
          // Exponential backoff with jitter
          const delay = Math.pow(2, i) * 2000 + Math.random() * 1000; // Increased delay
          console.log(`⏳ Quota exceeded for ${currentModel}. Waiting ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      console.error(`❌ Gemini API Error (${currentModel}):`, errorStr);
      throw error;
    }
  }
  throw lastError;
};

/**
 * Cloud Function: Generate News Briefing
 * POST /generateBriefing
 * Body: { persona: string, topic: string }
 */
exports.generateBriefing = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { persona, topic } = req.body;

      if (!persona || !topic) {
        res.status(400).json({ error: 'Missing persona or topic' });
        return;
      }

      // Check Firestore cache first
      const cacheKey = getCacheKey('briefing', { persona, topic });
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Check for duplicate pending requests
      const pendingKey = cacheKey;
      if (getDuplicate(pendingKey)) {
        console.log(`⏳ Duplicate request detected for: ${pendingKey}, waiting for existing request...`);
        try {
          const result = await getDuplicate(pendingKey);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({ error: error.message || 'Request failed' });
        }
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

      const config = { systemInstruction };

      const promise = (async () => {
        const response: any = await withRetry((model) =>
          ai.models.generateContent({
            model,
            contents: isUrl
              ? `Analyze and summarize the content at this URL: ${topic}. Provide insights relevant to a ${persona}.`
              : `Provide a deep briefing on: ${topic}`,
            config,
          })
        );

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
          title: c.web?.title,
          url: c.web?.uri,
        })).filter((s: any) => s.title && s.url) || [];

        const result = {
          briefing: response.text,
          sources,
        };

        // Cache to Firestore
        await setCache(cacheKey, result);
        return result;
      })();

      setDuplicate(pendingKey, promise);

      try {
        const result = await promise;
        res.json(result);
      } finally {
        clearDuplicate(pendingKey);
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
      res.status(500).json({ error: error.message || 'Failed to generate briefing' });
    }
  });
});

/**
 * Cloud Function: Generate Personalized Feed
 * POST /generateFeed
 * Body: { persona: string, interests: string[] }
 */
exports.generateFeed = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { persona, interests } = req.body;

      if (!persona || !Array.isArray(interests)) {
        res.status(400).json({ error: 'Missing persona or interests' });
        return;
      }

      // Check Firestore cache first
      const cacheKey = getCacheKey('feed', { persona, interests });
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Check for duplicate pending requests
      const pendingKey = cacheKey;
      if (getDuplicate(pendingKey)) {
        console.log(`⏳ Duplicate request detected for: ${pendingKey}, waiting for existing request...`);
        try {
          const result = await getDuplicate(pendingKey);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({ error: error.message || 'Request failed' });
        }
      }

      const prompt = `Generate 3 important business news headlines and short summaries (2 sentences each) for a ${persona} interested in: ${interests.join(', ')}. 
Format as a JSON array of strings, where each string is "Headline: Summary".`;

      const promise = (async () => {
        const response: any = await withRetry((model) =>
          ai.models.generateContent({
            model: FALLBACK_MODEL,
            contents: prompt,
            config: { responseMimeType: 'application/json' },
          })
        );

        const feed = JSON.parse(response.text);
        const result = { feed };
        // Cache to Firestore
        await setCache(cacheKey, result);
        return result;
      })();

      setDuplicate(pendingKey, promise);

      try {
        const result = await promise;
        res.json(result);
      } finally {
        clearDuplicate(pendingKey);
      }
    } catch (error) {
      console.error('Error generating feed:', error);
      res.status(500).json({ error: error.message || 'Failed to generate feed' });
    }
  });
});

/**
 * Cloud Function: Translate News
 * POST /translateNews
 * Body: { text: string, targetLanguage: string }
 */
exports.translateNews = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { text, targetLanguage } = req.body;

      if (!text || !targetLanguage) {
        res.status(400).json({ error: 'Missing text or targetLanguage' });
        return;
      }

      // Check Firestore cache first
      const cacheKey = getCacheKey('translate', { text, targetLanguage });
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Check for duplicate pending requests
      const pendingKey = cacheKey;
      if (getDuplicate(pendingKey)) {
        console.log(`⏳ Duplicate request detected for: ${pendingKey}, waiting for existing request...`);
        try {
          const result = await getDuplicate(pendingKey);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({ error: error.message || 'Request failed' });
        }
      }

      const promise = (async () => {
        const response: any = await withRetry((model) =>
          ai.models.generateContent({
            model: FALLBACK_MODEL,
            contents: `Translate the following business news into ${targetLanguage}. 
Provide a culturally adapted explanation with local context, not just a literal translation: ${text}`,
          })
        );

        const result = { translation: response.text };
        // Cache to Firestore
        await setCache(cacheKey, result);
        return result;
      })();

      setDuplicate(pendingKey, promise);

      try {
        const result = await promise;
        res.json(result);
      } finally {
        clearDuplicate(pendingKey);
      }
    } catch (error) {
      console.error('Error translating news:', error);
      res.status(500).json({ error: error.message || 'Failed to translate news' });
    }
  });
});

/**
 * Cloud Function: Get Entity Details
 * POST /getEntityDetails
 * Body: { entity: string }
 */
exports.getEntityDetails = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const { entity } = req.body;

      if (!entity) {
        res.status(400).json({ error: 'Missing entity' });
        return;
      }

      // Check Firestore cache first
      const cacheKey = getCacheKey('entity', { entity });
      const cached = await getFromCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Check for duplicate pending requests
      const pendingKey = cacheKey;
      if (getDuplicate(pendingKey)) {
        console.log(`⏳ Duplicate request detected for: ${pendingKey}, waiting for existing request...`);
        try {
          const result = await getDuplicate(pendingKey);
          return res.json(result);
        } catch (error) {
          return res.status(500).json({ error: error.message || 'Request failed' });
        }
      }

      const promise = (async () => {
        const response: any = await withRetry((model) =>
          ai.models.generateContent({
            model: FALLBACK_MODEL,
            contents: `Provide a concise, high-level business summary of "${entity}". 
Include its current market position, recent major news, and why it's important in the current business landscape.
Format the response in Markdown.`,
          })
        );

        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
          title: chunk.web?.title,
          url: chunk.web?.uri,
        })).filter((s: any) => s.title && s.url) || [];

        const result = {
          text: response.text,
          sources,
        };

        // Cache to Firestore
        await setCache(cacheKey, result);
        return result;
      })();

      setDuplicate(pendingKey, promise);

      try {
        const result = await promise;
        res.json(result);
      } finally {
        clearDuplicate(pendingKey);
      }
    } catch (error) {
      console.error('Error getting entity details:', error);
      res.status(500).json({ error: error.message || 'Failed to get entity details' });
    }
  });
});

/**
 * SCHEDULED FUNCTION: Pre-generate popular briefings daily at midnight
 * This reduces peak-time API calls by 70%+ by caching in advance
 * Trigger: Cloud Scheduler (Firebase free tier)
 */
exports.preGeneratePopularContent = functions.pubsub.schedule('0 0 * * *').onRun(async (context) => {
  console.log('🚀 Starting pre-generation of popular content...');
  
  // Popular personas and topics - customize based on your user data
  const popularRequests = [
    { persona: 'Business Executive', topics: ['AI trends 2026', 'Market analysis', 'Tech innovation', 'Global economy'] },
    { persona: 'Tech Entrepreneur', topics: ['Startup news', 'Cloud computing', 'Web3', 'Cybersecurity'] },
    { persona: 'Finance Professional', topics: ['Stock market', 'Crypto', 'Interest rates', 'Bond market'] },
    { persona: 'Healthcare Leader', topics: ['Medicare', 'Biotech', 'Health tech', 'Pandemic updates'] },
  ];

  const entities = ['Apple', 'Google', 'Microsoft', 'Amazon', 'Tesla', 'OpenAI', 'NVIDIA', 'Meta', 'Netflix'];

  let successCount = 0;
  let errorCount = 0;

  try {
    // Pre-generate briefings
    for (const request of popularRequests) {
      for (const topic of request.topics) {
        try {
          const cacheKey = getCacheKey('briefing', { persona: request.persona, topic });
          const cached = await getFromCache(cacheKey);
          
          if (!cached) {
            console.log(`⏳ Pre-generating: ${request.persona} -> ${topic}`);
            
            const response: any = await withRetry((model) =>
              ai.models.generateContent({
                model: FALLBACK_MODEL,
                contents: `Provide a deep briefing on: ${topic}`,
                config: {
                  systemInstruction: `You are a world-class business intelligence analyst. 
Create a personalized news briefing for a ${request.persona}.`,
                },
              })
            );

            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c: any) => ({
              title: c.web?.title,
              url: c.web?.uri,
            })).filter((s: any) => s.title && s.url) || [];

            const result = { briefing: response.text, sources };
            await setCache(cacheKey, result);
            successCount++;
            console.log(`✓ Pre-generated: ${request.persona} -> ${topic}`);
          } else {
            console.log(`⏭️  Already cached: ${request.persona} -> ${topic}`);
          }
        } catch (error) {
          errorCount++;
          console.error(`Error pre-generating ${request.persona} -> ${topic}:`, error);
        }
      }
    }

    // Pre-generate entity details
    for (const entity of entities) {
      try {
        const cacheKey = getCacheKey('entity', { entity });
        const cached = await getFromCache(cacheKey);
        
        if (!cached) {
          console.log(`⏳ Pre-generating entity: ${entity}`);
          
          const response: any = await withRetry((model) =>
            ai.models.generateContent({
              model: FALLBACK_MODEL,
              contents: `Provide a concise, high-level business summary of "${entity}". 
Include its current market position, recent major news, and why it's important in the current business landscape.`,
            })
          );

          const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
            title: chunk.web?.title,
            url: chunk.web?.uri,
          })).filter((s: any) => s.title && s.url) || [];

          const result = { text: response.text, sources };
          await setCache(cacheKey, result);
          successCount++;
          console.log(`✓ Pre-generated entity: ${entity}`);
        } else {
          console.log(`⏭️  Already cached entity: ${entity}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`Error pre-generating entity ${entity}:`, error);
      }
    }

    console.log(`✅ Pre-generation complete. Success: ${successCount}, Errors: ${errorCount}`);
    
    // Log stats to Firestore
    await db.collection('system_logs').doc(`pre_gen_${new Date().toISOString().split('T')[0]}`).set({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      successCount,
      errorCount,
      totalRequests: popularRequests.length * popularRequests[0].topics.length + entities.length,
    });

  } catch (error) {
    console.error('Fatal error in pre-generation:', error);
  }
});
