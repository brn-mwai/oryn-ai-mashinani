import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyArcWebhook,
  parseArcWebhook,
  extractArcTransactionInfo,
  extractArcWalletInfo,
  evaluatePaymentPolicy,
  autoForwardPayment,
  getAgentWalletConfig,
  isAgentWalletConfigured,
  getArcTransactionUrl,
  type ArcTransaction,
  type ArcWebhookEvent,
} from "@oryn/payments";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Match incoming payment to a claim based on amount and metadata
async function matchPaymentToClaim(
  transaction: ArcTransaction
): Promise<{
  claimId: Id<"claims">;
  userId: Id<"users">;
  userWalletId: Id<"wallets">;
  userWalletAddress: string;
  expectedAmount: number;
} | null> {
  // Try to find a payment link that matches this transaction
  // Payment links store the agent wallet address as the destination
  const paymentLinks = await convex.query(api.paymentLinks.getByAmount, {
    amount: parseFloat(transaction.amount),
    status: "active",
  });

  if (paymentLinks && paymentLinks.length > 0) {
    // Find the most recent matching payment link
    const link = paymentLinks[0];

    // Get the user's wallet
    const wallet = await convex.query(api.wallets.getByUser, {
      userId: link.userId,
    });

    if (wallet && wallet.arcAddress) {
      return {
        claimId: link.claimId,
        userId: link.userId,
        userWalletId: wallet._id,
        userWalletAddress: wallet.arcAddress,
        expectedAmount: link.amount,
      };
    }
  }

  return null;
}

// Process finalized transaction - validate, apply policies, and forward
async function processArcPayment(transaction: ArcTransaction) {
  if (!isAgentWalletConfigured()) {
    console.error("Agent wallet not configured, cannot process payment");
    return { action: "error", reason: "agent_wallet_not_configured" };
  }

  const agentWallet = getAgentWalletConfig();

  // Only process payments TO the agent wallet
  if (transaction.to.toLowerCase() !== agentWallet.address.toLowerCase()) {
    return { action: "ignored", reason: "not_to_agent_wallet" };
  }

  // Try to match this payment to a claim
  const match = await matchPaymentToClaim(transaction);

  // Evaluate payment against policies
  const decision = evaluatePaymentPolicy({
    fromAddress: transaction.from,
    toAddress: transaction.to,
    amount: parseFloat(transaction.amount),
    token: transaction.token,
    transactionHash: transaction.hash,
    claimId: match?.claimId as string | undefined,
    expectedAmount: match?.expectedAmount,
    userId: match?.userId as string | undefined,
  });

  // Record the incoming transaction
  if (match) {
    await convex.mutation(api.transactions.create, {
      walletId: match.userWalletId,
      userId: match.userId,
      claimId: match.claimId,
      type: "payment_received",
      amount: parseFloat(transaction.amount),
      fee: decision.fee ?? 0,
      netAmount: decision.netAmount ?? parseFloat(transaction.amount),
      currency: "USDC",
      status: decision.action === "forward" ? "processing" : "pending",
      transactionHash: transaction.hash,
      chain: "arc",
      fromAddress: transaction.from,
      toAddress: transaction.to,
      arcTransactionId: transaction.id,
    });
  }

  // Handle based on policy decision
  if (decision.action === "forward" && match) {
    // Auto-forward to user wallet
    try {
      const forwardTx = await autoForwardPayment({
        toWalletId: match.userWalletId as string,
        toAddress: match.userWalletAddress,
        amount: decision.netAmount!,
        token: transaction.token,
        originalTxHash: transaction.hash,
        claimId: match.claimId as string,
      });

      // Update claim status
      await convex.mutation(api.claims.markPaymentReceived, {
        id: match.claimId,
        paymentAmount: parseFloat(transaction.amount),
        transactionHash: transaction.hash,
        forwardTransactionHash: forwardTx.hash,
      });

      // Update user wallet balance
      await convex.mutation(api.wallets.addBalance, {
        id: match.userWalletId,
        amount: decision.netAmount!,
      });

      return {
        action: "forwarded",
        originalTx: transaction.hash,
        forwardTx: forwardTx.hash,
        amount: decision.netAmount,
        fee: decision.fee,
      };
    } catch (error) {
      console.error("Failed to auto-forward payment:", error);
      return {
        action: "forward_failed",
        reason: error instanceof Error ? error.message : "unknown_error",
      };
    }
  } else if (decision.action === "hold") {
    // Record as held for manual review
    if (match) {
      await convex.mutation(api.claims.flagForReview, {
        id: match.claimId,
        reason: decision.reason,
        metadata: decision.metadata,
      });
    }

    return {
      action: "held",
      reason: decision.reason,
    };
  } else if (decision.action === "reject") {
    return {
      action: "rejected",
      reason: decision.reason,
    };
  }

  return { action: "no_match", reason: "could_not_match_to_claim" };
}

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-arc-signature") ?? "";

  // Verify webhook signature
  if (!verifyArcWebhook(payload, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const event = parseArcWebhook(payload);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "arc",
      eventType: event.type,
      eventId: event.id,
      payload: event.data,
    });

    // Handle transaction events
    if (
      event.type === "transaction.finalized" ||
      event.type === "transaction.confirmed"
    ) {
      const transaction = extractArcTransactionInfo(event);

      if (transaction) {
        // Only process finalized transactions
        if (event.type === "transaction.finalized") {
          const result = await processArcPayment(transaction);

          await convex.mutation(api.webhookEvents.updateStatus, {
            id: webhookEventId,
            status: "processed",
            metadata: result,
          });

          return NextResponse.json({
            success: true,
            action: "transaction_processed",
            result,
            explorerUrl: getArcTransactionUrl(transaction.hash),
          });
        } else {
          // Confirmed but not finalized - just log
          await convex.mutation(api.webhookEvents.updateStatus, {
            id: webhookEventId,
            status: "processed",
            metadata: { status: "awaiting_finality" },
          });

          return NextResponse.json({
            success: true,
            action: "transaction_confirmed",
            status: "awaiting_finality",
          });
        }
      }
    }

    // Handle failed transactions
    if (event.type === "transaction.failed") {
      const transaction = extractArcTransactionInfo(event);

      if (transaction) {
        console.error("Arc transaction failed:", transaction);

        // If this was a forward transaction, mark it as failed
        // The original payment would need manual intervention
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
        metadata: { failed: true },
      });

      return NextResponse.json({
        success: true,
        action: "transaction_failed",
      });
    }

    // Handle wallet creation events
    if (event.type === "wallet.created") {
      const wallet = extractArcWalletInfo(event);

      if (wallet) {
        console.log("Arc wallet created:", wallet);
        // Update user's wallet record with Arc details
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({
        success: true,
        action: "wallet_created",
      });
    }

    // Unhandled event type
    await convex.mutation(api.webhookEvents.updateStatus, {
      id: webhookEventId,
      status: "ignored",
    });

    return NextResponse.json({ success: true, action: "ignored" });
  } catch (error) {
    console.error("Arc webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
