/**
 * Simple in-memory cache implementation with TTL support
 */

type CacheEntry<T> = {
  value: T;
  expiry: number;
};

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return undefined;
    }
    
    // Check if the entry has expired
    if (entry.expiry < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }
  
  /**
   * Set a value in the cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttlMs Time to live in milliseconds (default: 5 minutes)
   */
  set<T>(key: string, value: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }
  
  /**
   * Remove a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get a value from the cache or compute it if not found
   * @param key Cache key
   * @param fn Function to compute the value if not in cache
   * @param ttlMs Time to live in milliseconds
   * @returns The cached or computed value
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttlMs: number = 5 * 60 * 1000
  ): Promise<T> {
    const cachedValue = this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }
}

// Export a singleton instance
export const cache = new Cache();
