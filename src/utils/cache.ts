/**
 * Simple in-memory cache with TTL (Time To Live)
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private ttl: number; // milliseconds

  constructor(ttlMinutes: number = 60) {
    this.ttl = ttlMinutes * 60 * 1000;
  }

  set(key: string, data: T): void {
    this.store.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.store.clear();
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

// Create cache instances for different data types
export const briefingCache = new Cache<string>(60); // 1 hour
export const feedCache = new Cache<string[]>(120); // 2 hours
export const translationCache = new Cache<string>(120); // 2 hours
export const entityCache = new Cache<{ text: string; sources: any[] }>(240); // 4 hours

// Generate cache keys
export const getCacheKey = (...parts: string[]): string => {
  return parts.join('::').toLowerCase();
};
