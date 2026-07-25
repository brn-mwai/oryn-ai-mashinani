import Stripe from "stripe";

// Initialize Stripe client
const apiKey = process.env.STRIPE_SECRET_KEY;

if (!apiKey && process.env.NODE_ENV === "production") {
  console.warn("STRIPE_SECRET_KEY not configured");
}

export const stripe = apiKey
  ? new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia",
      typescript: true,
    })
  : null;

export function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }
  return stripe;
}

export function isStripeConfigured(): boolean {
  return !!stripe;
}
