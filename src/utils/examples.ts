/**
 * Example: How to use Firebase AI + Smart Router
 * Demonstrates best practices for reducing 429 errors
 */

import * as smartRouter from '../utils/smartApiRouter';
import * as firebaseAI from '../utils/firebaseAI';

/**
 * Example 1: Generate a briefing using smart routing
 * Automatically chooses between Firestore, Firebase AI, or Cloud Functions
 */
export const generateBriefingExample = async (persona: string, topic: string) => {
  try {
    console.log(`📝 Generating briefing for ${persona} about ${topic}...`);
    
    const { briefing, route } = await smartRouter.smartGenerateBriefing(persona, topic);
    
    console.log(`✅ Got response from ${route.source} in ${route.duration}ms`);
    console.log(`   Cached: ${route.cached}`);
    console.log(`   Briefing: ${briefing.substring(0, 100)}...`);
    
    return { briefing, route };
  } catch (error) {
    console.error('❌ Failed to generate briefing:', error);
    throw error;
  }
};

/**
 * Example 2: Get entity details using smart routing
 */
export const getEntityDetailsExample = async (entity: string) => {
  try {
    console.log(`🏢 Getting details for ${entity}...`);
    
    const { text, route } = await smartRouter.smartGetEntityDetails(entity);
    
    console.log(`✅ Got response from ${route.source} in ${route.duration}ms`);
    console.log(`   Details: ${text.substring(0, 100)}...`);
    
    return { text, route };
  } catch (error) {
    console.error('❌ Failed to get entity details:', error);
    throw error;
  }
};

/**
 * Example 3: Generate feed using smart routing
 */
export const generateFeedExample = async (persona: string, interests: string[]) => {
  try {
    console.log(`📰 Generating feed for ${persona} interested in ${interests.join(', ')}...`);
    
    const { feed, route } = await smartRouter.smartGenerateFeed(persona, interests);
    
    console.log(`✅ Got ${feed.length} headlines from ${route.source} in ${route.duration}ms`);
    
    return { feed, route };
  } catch (error) {
    console.error('❌ Failed to generate feed:', error);
    throw error;
  }
};

/**
 * Example 4: Using Firebase AI directly for faster responses
 */
export const analyzementExample = async (text: string) => {
  try {
    console.log(`🔍 Analyzing sentiment...`);
    
    // Check if already cached before making API call
    const cacheKey = `Analyze the sentiment of this business news. Respond with ONLY one word: positive, negative, or neutral\\n\\n${text}`;
    if (firebaseAI.isCached(cacheKey)) {
      console.log('✓ Using cached sentiment analysis');
    }
    
    const sentiment = await firebaseAI.analyzeSentiment(text);
    
    console.log(`✅ Sentiment: ${sentiment}`);
    
    return sentiment;
  } catch (error) {
    console.error('❌ Failed to analyze sentiment:', error);
    return 'neutral';
  }
};

/**
 * Example 5: Batch operations to reduce API calls
 * Process multiple requests efficiently
 */
export const batchGenerateBriefingsExample = async (
  persona: string,
  topics: string[]
) => {
  try {
    console.log(`📚 Batch generating ${topics.length} briefings for ${persona}...`);
    
    const results = await Promise.all(
      topics.map(topic => smartRouter.smartGenerateBriefing(persona, topic))
    );
    
    const fromCache = results.filter(r => r.route.cached).length;
    const totalTime = results.reduce((sum, r) => sum + r.route.duration, 0);
    
    console.log(`✅ Generated ${results.length} briefings`);
    console.log(`   From cache: ${fromCache}`);
    console.log(`   From Firebase AI: ${results.filter(r => r.route.source === 'firebase-ai').length}`);
    console.log(`   From Cloud Functions: ${results.filter(r => r.route.source === 'cloud-function').length}`);
    console.log(`   Total time: ${totalTime}ms`);
    
    return results;
  } catch (error) {
    console.error('❌ Failed to batch generate briefings:', error);
    throw error;
  }
};

/**
 * Example 6: View API statistics to optimize caching
 */
export const viewApiStatsExample = async () => {
  try {
    const stats = await smartRouter.getApiStats();
    
    console.log('📊 API Statistics:');
    console.log(`   Total cached items: ${stats.totalCached}`);
    console.log(`   Cache size: ${(stats.cacheSize / 1024).toFixed(2)} KB`);
    console.log(`   API calls today: ${stats.apiUsageToday}`);
    
    return stats;
  } catch (error) {
    console.error('❌ Failed to get API stats:', error);
  }
};

/**
 * Example 7: Clear caches when needed
 */
export const clearCachesExample = async () => {
  try {
    await smartRouter.clearAllCaches();
    console.log('✓ All caches cleared');
  } catch (error) {
    console.error('Failed to clear caches:', error);
  }
};

/**
 * Example 8: Advanced - Direct Firebase AI usage for specific operations
 */
export const advancedFirebaseAIExample = async () => {
  try {
    // Extract entities from text
    const entities = await firebaseAI.extractEntities(
      'Apple Inc announced record earnings. Tesla CEO Elon Musk discussed new initiatives.Microsoft expanded cloud services.'
    );
    console.log('Extracted entities:', entities);

    // Generate follow-up questions
    const questions = await firebaseAI.generateFollowUpQuestions(
      'AI and machine learning trends in 2026'
    );
    console.log('Follow-up questions:', questions);

    // Summarize a long article
    const summary = await firebaseAI.summarizeText(
      'Long article text here...' // Replace with actual text
    );
    console.log('Summary:', summary);

  } catch (error) {
    console.error('Failed in advanced Firebase AI example:', error);
  }
};

/**
 * BEST PRACTICES FOR REDUCING 429 ERRORS
 * ========================================
 * 
 * 1. ✅ Use smartRouter functions instead of calling Cloud Functions directly
 *    - Automatically uses best strategy (cache first, then Firebase AI, then Cloud Function)
 * 
 * 2. ✅ Check cache before making requests
 *    - Use firebaseAI.isCached() to avoid unnecessary API calls
 * 
 * 3. ✅ Batch similar requests together
 *    - Use Promise.all() to parallelize non-blocking operations
 * 
 * 4. ✅ Use client-side Firebase AI for simple operations
 *    - Sentiment analysis, entity extraction, text summarization
 *    - Saves backend load and reduces quota pressure
 * 
 * 5. ✅ Use Cloud Functions only for complex operations
 *    - URL scraping (requires Cloud Function)
 *    - Advanced analysis with web context
 * 
 * 6. ✅ Let scheduled pre-generation populate cache
 *    - Runs daily at midnight UTC automatically
 *    - Popular content cached before peak usage
 * 
 * 7. ✅ Monitor cache hit rates
 *    - High cache hits = lower 429 risk
 *    - Low cache hits = need more diverse pre-generation
 * 
 * 8. ✅ Clear cache periodically
 *    - stale.getOldEntriesExample() to manage storage
 *    - Or use Firestore TTL to auto-delete expired entries
 */

export default {
  generateBriefingExample,
  getEntityDetailsExample,
  generateFeedExample,
  analyzementExample,
  batchGenerateBriefingsExample,
  viewApiStatsExample,
  clearCachesExample,
  advancedFirebaseAIExample,
};
