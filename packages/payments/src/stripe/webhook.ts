import Stripe from "stripe";
import { getStripe } from "./client";

// Verify Stripe webhook signature
export function verifyStripeWebhook(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// Stripe webhook event types we handle
export type StripeWebhookEventType =
  // Payment Intent events
  | "payment_intent.succeeded"
  | "payment_intent.payment_failed"
  | "payment_intent.canceled"
  | "payment_intent.processing"
  | "payment_intent.requires_action"
  // Charge events
  | "charge.succeeded"
  | "charge.failed"
  | "charge.refunded"
  | "charge.dispute.created"
  | "charge.dispute.closed"
  // Payout events
  | "payout.paid"
  | "payout.failed"
  | "payout.canceled"
  // Account events (Connect)
  | "account.updated"
  | "account.application.authorized"
  | "account.application.deauthorized"
  // Radar events
  | "radar.early_fraud_warning.created";

// Handler type for webhook events
export type StripeWebhookHandler = {
  [K in StripeWebhookEventType]?: (event: Stripe.Event) => Promise<void>;
};

// Create webhook handler with typed handlers
export function createStripeWebhookHandler(handlers: StripeWebhookHandler) {
  return async (event: Stripe.Event) => {
    const handler = handlers[event.type as StripeWebhookEventType];
    if (handler) {
      await handler(event);
    }
  };
}

// Extract payment metadata from a Stripe event
export function extractPaymentMetadata(event: Stripe.Event): {
  claimId?: string;
  userId?: string;
  clientId?: string;
} | null {
  let metadata: Record<string, string> | undefined;

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled":
      metadata = (event.data.object as Stripe.PaymentIntent).metadata;
      break;
    case "charge.succeeded":
    case "charge.failed":
    case "charge.refunded":
      metadata = (event.data.object as Stripe.Charge).metadata;
      break;
    default:
      return null;
  }

  if (!metadata) return null;

  return {
    claimId: metadata.claimId,
    userId: metadata.userId,
    clientId: metadata.clientId,
  };
}

// Extract payout info from a payout event
export function extractPayoutInfo(event: Stripe.Event): {
  payoutId: string;
  amount: number;
  currency: string;
  status: string;
  arrivalDate: number;
  metadata: Record<string, string>;
} | null {
  if (
    event.type !== "payout.paid" &&
    event.type !== "payout.failed" &&
    event.type !== "payout.canceled"
  ) {
    return null;
  }

  const payout = event.data.object as Stripe.Payout;

  return {
    payoutId: payout.id,
    amount: payout.amount / 100,
    currency: payout.currency.toUpperCase(),
    status: payout.status,
    arrivalDate: payout.arrival_date,
    metadata: (payout.metadata as Record<string, string>) ?? {},
  };
}

// Extract fraud warning info
export function extractFraudWarning(event: Stripe.Event): {
  chargeId: string;
  paymentIntentId?: string;
  riskLevel: string;
  riskScore: number;
  actionable: boolean;
} | null {
  if (event.type !== "radar.early_fraud_warning.created") {
    return null;
  }

  const warning = event.data.object as Stripe.Radar.EarlyFraudWarning;

  return {
    chargeId: typeof warning.charge === "string" ? warning.charge : warning.charge.id,
    paymentIntentId:
      typeof warning.payment_intent === "string"
        ? warning.payment_intent
        : warning.payment_intent?.id,
    riskLevel: warning.fraud_type,
    riskScore: 100, // Early fraud warnings are high severity
    actionable: warning.actionable,
  };
}
