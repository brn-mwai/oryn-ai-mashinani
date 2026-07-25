import Stripe from "stripe";
import { getStripe } from "./client";

// Create a Stripe Connect Express account for payouts
export async function createConnectAccount(input: {
  email: string;
  country?: string;
  metadata?: Record<string, string>;
}): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    email: input.email,
    country: input.country ?? "US",
    capabilities: {
      transfers: { requested: true },
    },
    metadata: input.metadata,
  });

  // Create account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    type: "account_onboarding",
  });

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  };
}

// Get Connect account status
export async function getConnectAccountStatus(
  accountId: string
): Promise<{
  id: string;
  status: "pending" | "enabled" | "restricted" | "disabled";
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirements: string[];
}> {
  const stripe = getStripe();
  const account = await stripe.accounts.retrieve(accountId);

  let status: "pending" | "enabled" | "restricted" | "disabled" = "pending";

  if (account.charges_enabled && account.payouts_enabled) {
    status = "enabled";
  } else if (account.requirements?.disabled_reason) {
    status = "disabled";
  } else if (
    account.requirements?.currently_due &&
    account.requirements.currently_due.length > 0
  ) {
    status = "restricted";
  }

  return {
    id: account.id,
    status,
    chargesEnabled: account.charges_enabled ?? false,
    payoutsEnabled: account.payouts_enabled ?? false,
    requirements: account.requirements?.currently_due ?? [],
  };
}

// Create a new onboarding link (if user needs to complete setup)
export async function createOnboardingLink(
  accountId: string
): Promise<string> {
  const stripe = getStripe();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?refresh=true`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing?success=true`,
    type: "account_onboarding",
  });

  return accountLink.url;
}

// Create a login link for Express dashboard
export async function createLoginLink(accountId: string): Promise<string> {
  const stripe = getStripe();
  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return loginLink.url;
}

// Create a payout to connected account
export async function createPayout(input: {
  accountId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Payout> {
  const stripe = getStripe();

  // First, transfer funds to the connected account
  const transfer = await stripe.transfers.create({
    amount: Math.round(input.amount * 100),
    currency: input.currency.toLowerCase(),
    destination: input.accountId,
    description: input.description,
    metadata: input.metadata,
  });

  // Then create a payout from the connected account's balance
  const payout = await stripe.payouts.create(
    {
      amount: Math.round(input.amount * 100),
      currency: input.currency.toLowerCase(),
      description: input.description,
      metadata: {
        ...input.metadata,
        transferId: transfer.id,
      },
    },
    {
      stripeAccount: input.accountId,
    }
  );

  return payout;
}

// Get payout status
export async function getPayoutStatus(
  payoutId: string,
  accountId: string
): Promise<Stripe.Payout> {
  const stripe = getStripe();
  return stripe.payouts.retrieve(payoutId, {
    stripeAccount: accountId,
  });
}

// List payouts for a connected account
export async function listPayouts(
  accountId: string,
  limit = 10
): Promise<Stripe.Payout[]> {
  const stripe = getStripe();
  const payouts = await stripe.payouts.list(
    { limit },
    { stripeAccount: accountId }
  );
  return payouts.data;
}

// Get account balance
export async function getAccountBalance(
  accountId: string
): Promise<{
  available: number;
  pending: number;
  currency: string;
}> {
  const stripe = getStripe();
  const balance = await stripe.balance.retrieve({
    stripeAccount: accountId,
  });

  const available = balance.available[0];
  const pending = balance.pending[0];

  return {
    available: (available?.amount ?? 0) / 100,
    pending: (pending?.amount ?? 0) / 100,
    currency: available?.currency?.toUpperCase() ?? "USD",
  };
}

// Delete a connected account (careful!)
export async function deleteConnectAccount(accountId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.accounts.del(accountId);
}
