import arcjet, {
  tokenBucket,
  slidingWindow,
  shield,
  detectBot,
  validateEmail,
  ArcjetDecision,
  ArcjetRuleResult,
} from "@arcjet/next";

const apiKey = process.env.ARCJET_KEY;

// Check if Arcjet is configured
export function isArcjetConfigured(): boolean {
  return !!apiKey;
}

// Base Arcjet client
export const aj = arcjet({
  key: apiKey!,
  characteristics: ["ip.src"], // Track by IP address
  rules: [],
});

// Export types
export type { ArcjetDecision, ArcjetRuleResult };

// Re-export rule builders
export { tokenBucket, slidingWindow, shield, detectBot, validateEmail };

// Common rule configurations
export const RULE_CONFIGS = {
  // Rate limiting configs
  rateLimit: {
    auth: { max: 10, interval: "1m" as const },
    payments: { max: 5, interval: "1m" as const },
    api: { max: 100, interval: "1m" as const },
    messages: { max: 20, interval: "1m" as const },
    ai: { max: 30, interval: "1m" as const },
  },

  // Bot detection modes
  botDetection: {
    strict: "LIVE" as const,
    moderate: "DRY_RUN" as const,
  },

  // Shield modes
  shield: {
    active: "LIVE" as const,
    monitor: "DRY_RUN" as const,
  },
};
