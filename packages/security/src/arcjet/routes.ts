import arcjet, {
  tokenBucket,
  slidingWindow,
  shield,
  detectBot,
} from "@arcjet/next";

const apiKey = process.env.ARCJET_KEY ?? "";

// Auth routes protection (sign-in, sign-up, etc.)
export const authProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Rate limit: 10 requests per minute
    slidingWindow({
      mode: "LIVE",
      max: 10,
      interval: "1m",
    }),
    // Bot protection
    detectBot({
      mode: "LIVE",
      allow: [], // Block all bots
    }),
    // Shield against common attacks
    shield({
      mode: "LIVE",
    }),
  ],
});

// Payment routes protection
export const paymentProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Strict rate limit: 5 requests per minute
    slidingWindow({
      mode: "LIVE",
      max: 5,
      interval: "1m",
    }),
    // Shield WAF
    shield({
      mode: "LIVE",
    }),
    // Bot protection
    detectBot({
      mode: "LIVE",
      allow: [], // Block all bots
    }),
  ],
});

// API routes protection
export const apiProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Standard rate limit: 100 requests per minute
    slidingWindow({
      mode: "LIVE",
      max: 100,
      interval: "1m",
    }),
    // Shield WAF
    shield({
      mode: "LIVE",
    }),
  ],
});

// Message sending protection
export const messageProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Rate limit: 20 messages per minute
    slidingWindow({
      mode: "LIVE",
      max: 20,
      interval: "1m",
    }),
    // Shield WAF
    shield({
      mode: "LIVE",
    }),
  ],
});

// AI endpoints protection
export const aiProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Token bucket: allows bursts but limits sustained use
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: "1m",
      capacity: 30,
    }),
    // Shield WAF
    shield({
      mode: "LIVE",
    }),
  ],
});

// Pay portal protection (client-facing payment page)
export const payPortalProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Rate limit: 10 requests per minute
    slidingWindow({
      mode: "LIVE",
      max: 10,
      interval: "1m",
    }),
    // Bot protection
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE"], // Allow search engines
    }),
    // Shield WAF
    shield({
      mode: "LIVE",
    }),
  ],
});

// Webhook protection (verify source, not rate limited)
export const webhookProtection = arcjet({
  key: apiKey,
  characteristics: ["ip.src"],
  rules: [
    // Shield WAF only - webhooks shouldn't be rate limited
    shield({
      mode: "LIVE",
    }),
  ],
});
