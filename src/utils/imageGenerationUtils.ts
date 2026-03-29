/**
 * Image Generation Utilities
 * Handles image loading, caching, and fallback strategies
 */

import { generateImage } from '../agents/ImageGenerationAgent';

interface CachedImage {
  url: string;
  timestamp: number;
  attempts: number;
}

const imageCache = new Map<string, CachedImage>();
const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MAX_GENERATION_ATTEMPTS = 2;

/**
 * Get a cached image URL if available and valid
 */
export const getCachedImageUrl = (topic: string): string | null => {
  const cacheKey = `img:${topic}`;
  const cached = imageCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < IMAGE_CACHE_TTL) {
    console.log(`✓ Image Cache HIT for: ${topic}`);
    return cached.url;
  }
  
  if (cached) {
    imageCache.delete(cacheKey);
  }
  
  return null;
};

/**
 * Cache an image URL
 */
const setCachedImageUrl = (topic: string, url: string): void => {
  const cacheKey = `img:${topic}`;
  imageCache.set(cacheKey, {
    url,
    timestamp: Date.now(),
    attempts: 1,
  });
  console.log(`✓ Image cached for: ${topic}`);
};

/**
 * Generate and cache image with retry logic
 */
export const generateAndCacheImage = async (topic: string): Promise<string | null> => {
  // Check cache first
  const cached = getCachedImageUrl(topic);
  if (cached) return cached;

  console.log(`🎨 Generating image for: ${topic}`);
  
  let lastError: any;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const imageUrl = await generateImage(topic);
      
      if (imageUrl) {
        // Verify URL format
        if (imageUrl.includes('pollinations.ai') || imageUrl.startsWith('http')) {
          setCachedImageUrl(topic, imageUrl);
          console.log(`✓ Image generated successfully (Attempt ${attempt}/${MAX_GENERATION_ATTEMPTS})`);
          return imageUrl;
        }
      }
    } catch (error: any) {
      lastError = error;
      console.warn(`⚠️  Image generation attempt ${attempt} failed:`, error.message);
      
      // Don't retry on quota errors
      if (error.message?.includes('quota') || error.message?.includes('Quota')) {
        break;
      }
      
      // Wait before retry
      if (attempt < MAX_GENERATION_ATTEMPTS) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.error(`❌ Failed to generate image after ${MAX_GENERATION_ATTEMPTS} attempts`);
  return getDefaultImage(topic);
};

/**
 * Get a default/fallback image based on topic
 */
export const getDefaultImage = (topic: string): string => {
  const topicLower = topic.toLowerCase();
  const baseUrl = import.meta.env.VITE_UNSPLASH_BASE_URL || 'https://images.unsplash.com';
  
  // Use Unsplash as fallback with topic-based queries
  const defaultImages: Record<string, string> = {
    'ai': `${baseUrl}/photo-1677442d019cecf8730f17a10a3de47b5affd70d?w=800&h=500&fit=crop`,
    'market': `${baseUrl}/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop`,
    'energy': `${baseUrl}/photo-1513364776144-60967b0f800f?w=800&h=500&fit=crop`,
    'tech': `${baseUrl}/photo-1667372335033-c42b63f543f4?w=800&h=500&fit=crop`,
    'supply': `${baseUrl}/photo-1586282391129-76a47df1d6b3?w=800&h=500&fit=crop`,
    'defense': `${baseUrl}/photo-1633356122544-f134324ef6db?w=800&h=500&fit=crop`,
    'trade': `${baseUrl}/photo-1556075798-4825dfaaf498?w=800&h=500&fit=crop`,
    'finance': `${baseUrl}/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop`,
  };

  // Find best match
  for (const [key, imageUrl] of Object.entries(defaultImages)) {
    if (topicLower.includes(key)) {
      return imageUrl;
    }
  }

  // Ultimate fallback - generic business image
  return `${baseUrl}/photo-1552664730-d307ca884978?w=800&h=500&fit=crop`;
};

/**
 * Validate if an image URL is accessible
 */
export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
    return response.ok || response.status === 0; // 0 for CORS no-cors requests
  } catch (error) {
    console.warn(`Image URL validation failed for: ${url}`);
    return false;
  }
};

/**
 * Clear image cache (useful for testing or manual refresh)
 */
export const clearImageCache = (): void => {
  imageCache.clear();
  console.log('✓ Image cache cleared');
};
