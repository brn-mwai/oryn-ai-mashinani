// Arcjet client and rule builders
export {
  aj,
  isArcjetConfigured,
  tokenBucket,
  slidingWindow,
  shield,
  detectBot,
  validateEmail,
  RULE_CONFIGS,
} from "./client";
export type { ArcjetDecision, ArcjetRuleResult } from "./client";

// Route protections
export {
  authProtection,
  paymentProtection,
  apiProtection,
  messageProtection,
  aiProtection,
  payPortalProtection,
  webhookProtection,
} from "./routes";

// Middleware utilities
export {
  parseArcjetDecision,
  createBlockedResponse,
  shouldAllowRequest,
  logSecurityDecision,
  getUserIdentifier,
} from "./middleware";
export type { SecurityDecision } from "./middleware";
