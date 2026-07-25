// Stripe client
export { stripe, getStripe, isStripeConfigured } from "./client";

// Payment functions
export {
  createPaymentIntent,
  getPaymentIntent,
  cancelPaymentIntent,
  createPaymentLink,
  createRefund,
  getPaymentIntentWithCharge,
  extractRiskScore,
} from "./payments";
export type {
  PaymentMethod,
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
} from "./payments";

// Connect functions (payouts)
export {
  createConnectAccount,
  getConnectAccountStatus,
  createOnboardingLink,
  createLoginLink,
  createPayout,
  getPayoutStatus,
  listPayouts,
  getAccountBalance,
  deleteConnectAccount,
} from "./connect";

// Webhook utilities
export {
  verifyStripeWebhook,
  createStripeWebhookHandler,
  extractPaymentMetadata,
  extractPayoutInfo,
  extractFraudWarning,
} from "./webhook";
export type { StripeWebhookEventType, StripeWebhookHandler } from "./webhook";

// Re-export Stripe types
export type { Stripe } from "stripe";
