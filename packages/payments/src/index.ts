// Stripe exports
export * from "./stripe";

// Circle exports
export * from "./circle";

// Check if any payment provider is configured
export function isPaymentsConfigured(): boolean {
  const { isStripeConfigured } = require("./stripe");
  const { isCircleConfigured } = require("./circle");
  return isStripeConfigured() || isCircleConfigured();
}

// Payment method types
export type FiatPaymentMethod = "card" | "bank_transfer" | "ach" | "apple_pay" | "google_pay" | "link";
export type CryptoPaymentMethod = "usdc";
export type PaymentMethod = FiatPaymentMethod | CryptoPaymentMethod;

// Payment status (unified across providers)
export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "disputed"
  | "cancelled";

// Map Stripe status to unified status
export function mapStripeStatus(status: string): PaymentStatus {
  switch (status) {
    case "requires_payment_method":
    case "requires_confirmation":
    case "requires_action":
      return "pending";
    case "processing":
      return "processing";
    case "succeeded":
      return "completed";
    case "canceled":
      return "cancelled";
    default:
      return "failed";
  }
}

// Map Circle transfer state to unified status
export function mapCircleStatus(state: string): PaymentStatus {
  switch (state) {
    case "INITIATED":
    case "PENDING_RISK_SCREENING":
    case "QUEUED":
      return "pending";
    case "SENT":
    case "CONFIRMED":
      return "processing";
    case "COMPLETE":
      return "completed";
    case "DENIED":
    case "FAILED":
      return "failed";
    case "CANCELLED":
      return "cancelled";
    default:
      return "pending";
  }
}
