import { NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { getRateLimiter, RateLimiterType } from "./client";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
}

// Check rate limit for a request
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(type);
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}

// Check rate limit with custom limiter
export async function checkRateLimitCustom(
  identifier: string,
  limiter: Ratelimit
): Promise<RateLimitResult> {
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending,
  };
}

// Create rate limit headers
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", result.limit.toString());
  headers.set("X-RateLimit-Remaining", result.remaining.toString());
  headers.set("X-RateLimit-Reset", result.reset.toString());
  return headers;
}

// Create rate limited response
export function createRateLimitedResponse(
  result: RateLimitResult,
  options?: {
    message?: string;
    statusCode?: number;
  }
): NextResponse {
  const retryAfter = Math.ceil((result.reset - Date.now()) / 1000);

  return NextResponse.json(
    {
      error: options?.message ?? "Too many requests. Please try again later.",
      retryAfter,
    },
    {
      status: options?.statusCode ?? 429,
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": result.limit.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.reset.toString(),
      },
    }
  );
}

// Extract identifier from request
export function getIdentifier(
  request: NextRequest,
  options?: {
    useUserId?: boolean;
    useApiKey?: boolean;
    prefix?: string;
  }
): string {
  let identifier = "";

  // Try user ID first
  if (options?.useUserId) {
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.sub) {
          identifier = `user:${payload.sub}`;
        }
      } catch {
        // Ignore
      }
    }

    // Check for Clerk session
    const sessionId = request.cookies.get("__session")?.value;
    if (!identifier && sessionId) {
      identifier = `session:${sessionId}`;
    }
  }

  // Try API key
  if (options?.useApiKey && !identifier) {
    const apiKey = request.headers.get("x-api-key");
    if (apiKey) {
      identifier = `apikey:${apiKey.slice(0, 8)}`;
    }
  }

  // Fall back to IP
  if (!identifier) {
    const ip =
      request.ip ??
      request.headers.get("x-forwarded-for")?.split(",")[0] ??
      "unknown";
    identifier = `ip:${ip}`;
  }

  // Add prefix if provided
  if (options?.prefix) {
    identifier = `${options.prefix}:${identifier}`;
  }

  return identifier;
}

// Rate limit middleware factory
export function withRateLimit(
  type: RateLimiterType,
  options?: {
    getIdentifier?: (request: NextRequest) => string;
    onRateLimited?: (
      request: NextRequest,
      result: RateLimitResult
    ) => NextResponse | void;
  }
) {
  return async function rateLimit(
    request: NextRequest
  ): Promise<NextResponse | null> {
    const identifier =
      options?.getIdentifier?.(request) ?? getIdentifier(request);

    const result = await checkRateLimit(identifier, type);

    if (!result.success) {
      if (options?.onRateLimited) {
        const customResponse = options.onRateLimited(request, result);
        if (customResponse) {
          return customResponse;
        }
      }
      return createRateLimitedResponse(result);
    }

    return null; // Continue to handler
  };
}
