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

const PRIMARY_MODEL = 'gemini-3.1-pro-preview';
const FALLBACK_MODEL = 'gemini-3-flash-preview';

/**
 * Helper function to handle API calls with retry logic
 */
const withRetry = async (fn, maxRetries = 7) => {
  let lastError;
  let currentModel = PRIMARY_MODEL;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn(currentModel);
    } catch (error) {
      lastError = error;
      const errorStr = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
      const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        if (currentModel === PRIMARY_MODEL) {
          currentModel = FALLBACK_MODEL;
          console.warn(`Quota exceeded for ${PRIMARY_MODEL}, falling back to ${FALLBACK_MODEL}`);
          continue;
        }

        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          console.log(`Quota exceeded. Retrying in ${Math.round(delay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }

      console.error(`Gemini API Error:`, errorStr);
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

      const response = await withRetry((model) =>
        ai.models.generateContent({
          model,
          contents: isUrl
            ? `Analyze and summarize the content at this URL: ${topic}. Provide insights relevant to a ${persona}.`
            : `Provide a deep briefing on: ${topic}`,
          config,
        })
      );

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((c) => ({
        title: c.web?.title,
        url: c.web?.uri,
      })).filter((s) => s.title && s.url) || [];

      res.json({
        briefing: response.text,
        sources,
      });
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

      const prompt = `Generate 3 important business news headlines and short summaries (2 sentences each) for a ${persona} interested in: ${interests.join(', ')}. 
Format as a JSON array of strings, where each string is "Headline: Summary".`;

      const response = await withRetry((model) =>
        ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        })
      );

      const feed = JSON.parse(response.text);
      res.json({ feed });
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

      const response = await withRetry((model) =>
        ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: `Translate the following business news into ${targetLanguage}. 
Provide a culturally adapted explanation with local context, not just a literal translation: ${text}`,
        })
      );

      res.json({ translation: response.text });
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

      const response = await withRetry((model) =>
        ai.models.generateContent({
          model: FALLBACK_MODEL,
          contents: `Provide a concise, high-level business summary of "${entity}". 
Include its current market position, recent major news, and why it's important in the current business landscape.
Format the response in Markdown.`,
        })
      );

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk) => ({
        title: chunk.web?.title,
        url: chunk.web?.uri,
      })).filter((s) => s.title && s.url) || [];

      res.json({
        text: response.text,
        sources,
      });
    } catch (error) {
      console.error('Error getting entity details:', error);
      res.status(500).json({ error: error.message || 'Failed to get entity details' });
    }
  });
});
