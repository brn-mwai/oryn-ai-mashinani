import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redisUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client
export const redis =
  redisUrl && redisToken
    ? new Redis({
        url: redisUrl,
        token: redisToken,
      })
    : null;

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis/KV not configured");
  }
  return redis;
}

export function isRedisConfigured(): boolean {
  return !!redis;
}

// Pre-configured rate limiters
export const rateLimiters = {
  // API rate limiter: 100 requests per minute
  api: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1m"),
        analytics: true,
        prefix: "ratelimit:api",
      })
    : null,

  // Auth rate limiter: 10 requests per minute
  auth: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10, "1m"),
        analytics: true,
        prefix: "ratelimit:auth",
      })
    : null,

  // Payment rate limiter: 5 requests per minute
  payment: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1m"),
        analytics: true,
        prefix: "ratelimit:payment",
      })
    : null,

  // Message rate limiter: 20 requests per minute
  message: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "1m"),
        analytics: true,
        prefix: "ratelimit:message",
      })
    : null,

  // AI rate limiter: 30 requests per minute (token bucket for bursts)
  ai: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.tokenBucket(30, "1m", 10),
        analytics: true,
        prefix: "ratelimit:ai",
      })
    : null,

  // Webhook rate limiter: 1000 requests per minute (high limit)
  webhook: redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1000, "1m"),
        analytics: true,
        prefix: "ratelimit:webhook",
      })
    : null,
};

export type RateLimiterType = keyof typeof rateLimiters;

// Get a rate limiter by type
export function getRateLimiter(type: RateLimiterType): Ratelimit {
  const limiter = rateLimiters[type];
  if (!limiter) {
    throw new Error(`Rate limiter "${type}" not configured`);
  }
  return limiter;
}

// Create a custom rate limiter
export function createRateLimiter(config: {
  prefix: string;
  requests: number;
  window: "1s" | "10s" | "1m" | "5m" | "10m" | "1h" | "1d";
  type?: "sliding" | "fixed" | "token";
  refillRate?: number;
}): Ratelimit {
  const client = getRedis();

  let limiter;
  switch (config.type ?? "sliding") {
    case "fixed":
      limiter = Ratelimit.fixedWindow(config.requests, config.window);
      break;
    case "token":
      limiter = Ratelimit.tokenBucket(
        config.requests,
        config.window,
        config.refillRate ?? Math.ceil(config.requests / 6)
      );
      break;
    case "sliding":
    default:
      limiter = Ratelimit.slidingWindow(config.requests, config.window);
      break;
  }

  return new Ratelimit({
    redis: client,
    limiter,
    analytics: true,
    prefix: `ratelimit:${config.prefix}`,
  });
}
