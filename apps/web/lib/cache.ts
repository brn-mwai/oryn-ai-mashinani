/**
 * Simple caching utilities for API responses
 * For production, use Redis or a distributed cache
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Clean up expired entries every minute
if (typeof window === "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache.entries()) {
      if (entry.expiresAt < now) {
        cache.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Get cached data
 */
export function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Set cached data
 */
export function setCache<T>(key: string, data: T, ttlSeconds: number): void {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Delete cached data
 */
export function deleteFromCache(key: string): void {
  cache.delete(key);
}

/**
 * Delete all cached data matching a pattern
 */
export function invalidateCache(pattern: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

/**
 * Cache key builders
 */
export const cacheKeys = {
  user: (userId: string) => `user:${userId}`,
  claims: (userId: string) => `claims:${userId}`,
  claim: (claimId: string) => `claim:${claimId}`,
  clients: (userId: string) => `clients:${userId}`,
  client: (clientId: string) => `client:${clientId}`,
  wallet: (userId: string) => `wallet:${userId}`,
  stats: (userId: string, period: string) => `stats:${userId}:${period}`,
};

/**
 * Cache TTL configurations (in seconds)
 */
export const cacheTTL = {
  /** User data - cache for 5 minutes */
  user: 5 * 60,

  /** Claims list - cache for 1 minute */
  claims: 60,

  /** Single claim - cache for 2 minutes */
  claim: 2 * 60,

  /** Clients list - cache for 1 minute */
  clients: 60,

  /** Stats - cache for 5 minutes */
  stats: 5 * 60,

  /** Wallet data - cache for 30 seconds */
  wallet: 30,
};

/**
 * Wrapper for caching async function results
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  const cached = getFromCache<T>(key);
  if (cached !== null) {
    return cached;
  }

  const result = await fn();
  setCache(key, result, ttlSeconds);
  return result;
}
