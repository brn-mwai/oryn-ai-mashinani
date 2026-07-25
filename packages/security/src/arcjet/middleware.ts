import { NextRequest, NextResponse } from "next/server";
import type { ArcjetDecision } from "@arcjet/next";

// Decision result for logging
export interface SecurityDecision {
  allowed: boolean;
  reason?: string;
  ruleResults: Array<{
    rule: string;
    conclusion: string;
    reason?: string;
  }>;
  ip: string;
  path: string;
  timestamp: Date;
}

// Convert Arcjet decision to our format
export function parseArcjetDecision(
  decision: ArcjetDecision,
  request: NextRequest
): SecurityDecision {
  return {
    allowed: decision.isDenied() === false,
    reason: decision.isDenied() ? decision.reason.message : undefined,
    ruleResults: decision.results.map((result) => ({
      rule: result.rule?.type ?? "unknown",
      conclusion: result.conclusion,
      reason: result.reason?.message,
    })),
    ip: request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown",
    path: request.nextUrl.pathname,
    timestamp: new Date(),
  };
}

// Create response for blocked request
export function createBlockedResponse(
  decision: ArcjetDecision,
  options?: {
    statusCode?: number;
    message?: string;
    redirectUrl?: string;
  }
): NextResponse {
  // If redirect URL provided, redirect there
  if (options?.redirectUrl) {
    return NextResponse.redirect(options.redirectUrl);
  }

  // Return error response
  const statusCode = options?.statusCode ?? 429;
  const message = options?.message ?? "Too many requests. Please try again later.";

  return NextResponse.json(
    {
      error: message,
      retryAfter: 60, // Default retry after 60 seconds
    },
    {
      status: statusCode,
      headers: {
        "Retry-After": "60",
      },
    }
  );
}

// Helper to check if request should be allowed
export function shouldAllowRequest(decision: ArcjetDecision): boolean {
  // Allow if not denied
  if (!decision.isDenied()) {
    return true;
  }

  // Check specific denial reasons
  const reason = decision.reason;

  // Rate limit exceeded
  if (reason.isRateLimit()) {
    return false;
  }

  // Bot detected
  if (reason.isBot()) {
    return false;
  }

  // Shield blocked (attack detected)
  if (reason.isShield()) {
    return false;
  }

  return false;
}

// Log security decision for monitoring
export function logSecurityDecision(
  decision: SecurityDecision,
  context?: Record<string, unknown>
): void {
  const logData = {
    ...decision,
    ...context,
  };

  if (decision.allowed) {
    // Debug level for allowed requests
    console.debug("[Security] Request allowed:", logData);
  } else {
    // Warn level for blocked requests
    console.warn("[Security] Request blocked:", logData);
  }
}

// Extract user identifier for rate limiting
export function getUserIdentifier(request: NextRequest): string {
  // Try to get user ID from auth header or cookie
  const authHeader = request.headers.get("authorization");
  const userIdCookie = request.cookies.get("userId");

  if (authHeader) {
    // Extract user ID from JWT if possible
    try {
      const token = authHeader.replace("Bearer ", "");
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.sub) {
        return `user:${payload.sub}`;
      }
    } catch {
      // Ignore parsing errors
    }
  }

  if (userIdCookie?.value) {
    return `user:${userIdCookie.value}`;
  }

  // Fall back to IP address
  return `ip:${request.ip ?? request.headers.get("x-forwarded-for") ?? "unknown"}`;
}
