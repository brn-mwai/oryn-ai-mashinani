import Stripe from "stripe";
import { getStripe } from "./client";

export type PaymentMethod = "card" | "us_bank_account" | "link";

export interface CreatePaymentIntentInput {
  amount: number;
  currency: string;
  metadata: {
    claimId: string;
    userId: string;
    clientId: string;
  };
  customerId?: string;
  paymentMethods?: PaymentMethod[];
  description?: string;
  statementDescriptor?: string;
}

export interface CreatePaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
}

// Create a payment intent for collecting payment
export async function createPaymentIntent(
  input: CreatePaymentIntentInput
): Promise<CreatePaymentIntentResult> {
  const stripe = getStripe();

  const paymentMethods = input.paymentMethods ?? ["card", "us_bank_account", "link"];

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(input.amount * 100), // Convert to cents
    currency: input.currency.toLowerCase(),
    payment_method_types: paymentMethods,
    metadata: input.metadata,
    customer: input.customerId,
    description: input.description,
    statement_descriptor: input.statementDescriptor?.slice(0, 22),
    automatic_payment_methods: {
      enabled: false,
    },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret!,
    amount: input.amount,
    currency: input.currency,
  };
}

// Retrieve a payment intent
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// Cancel a payment intent
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.cancel(paymentIntentId);
}

// Create a payment link (no-code checkout)
export async function createPaymentLink(input: {
  amount: number;
  currency: string;
  productName: string;
  description?: string;
  metadata: {
    claimId: string;
    userId: string;
    clientId: string;
  };
  successUrl: string;
  cancelUrl?: string;
}): Promise<{ url: string; id: string }> {
  const stripe = getStripe();

  // Create a product first (description is set on product, not price)
  const product = await stripe.products.create({
    name: input.productName,
    description: input.description,
  });

  // Create a price for the product
  const price = await stripe.prices.create({
    unit_amount: Math.round(input.amount * 100),
    currency: input.currency.toLowerCase(),
    product: product.id,
  });

  // Create the payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    metadata: input.metadata,
    after_completion: {
      type: "redirect",
      redirect: {
        url: input.successUrl,
      },
    },
  });

  return {
    url: paymentLink.url,
    id: paymentLink.id,
  };
}

// Process a refund
export async function createRefund(input: {
  paymentIntentId: string;
  amount?: number; // Partial refund amount in dollars
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
}): Promise<Stripe.Refund> {
  const stripe = getStripe();

  return stripe.refunds.create({
    payment_intent: input.paymentIntentId,
    amount: input.amount ? Math.round(input.amount * 100) : undefined,
    reason: input.reason,
  });
}

// Get payment intent with expanded charge data (for fraud info)
export async function getPaymentIntentWithCharge(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const stripe = getStripe();
  return stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge", "latest_charge.balance_transaction"],
  });
}

// Extract risk score from Stripe Radar
export function extractRiskScore(charge: Stripe.Charge): {
  riskScore: number;
  riskLevel: string;
  fraudFlags: string[];
} {
  const outcome = charge.outcome;
  const fraudFlags: string[] = [];

  if (!outcome) {
    return { riskScore: 0, riskLevel: "unknown", fraudFlags };
  }

  // Risk score is 0-100
  const riskScore = outcome.risk_score ?? 0;
  const riskLevel = outcome.risk_level ?? "unknown";

  // Collect fraud flags
  if (outcome.type === "blocked") {
    fraudFlags.push("blocked");
  }
  if (outcome.seller_message) {
    fraudFlags.push(outcome.seller_message);
  }
  if (riskLevel === "elevated" || riskLevel === "highest") {
    fraudFlags.push(`risk_level_${riskLevel}`);
  }

  return { riskScore, riskLevel, fraudFlags };
}
