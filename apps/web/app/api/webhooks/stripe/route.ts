import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyStripeWebhook,
  extractPaymentMetadata,
  extractPayoutInfo,
  extractFraudWarning,
} from "@oryn/payments";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  try {
    // Verify webhook signature
    const event = verifyStripeWebhook(payload, signature);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "stripe",
      eventType: event.type,
      eventId: event.id,
      payload: event.data.object,
    });

    // Handle payment intent events
    if (
      event.type === "payment_intent.succeeded" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const metadata = extractPaymentMetadata(event);

      if (metadata?.claimId) {
        // Find the payment by Stripe payment intent ID
        const paymentIntentId = (event.data.object as { id: string }).id;
        const payment = await convex.query(api.payments.getByStripePaymentIntent, {
          paymentIntentId,
        });

        if (payment) {
          const status = event.type === "payment_intent.succeeded"
            ? "completed"
            : "failed";

          await convex.mutation(api.payments.updateStatus, {
            id: payment._id,
            status,
          });

          // Update webhook with payment reference
          await convex.mutation(api.webhookEvents.updateStatus, {
            id: webhookEventId,
            status: "processed",
            paymentId: payment._id,
          });
        } else {
          await convex.mutation(api.webhookEvents.updateStatus, {
            id: webhookEventId,
            status: "processed",
          });
        }
      } else {
        await convex.mutation(api.webhookEvents.updateStatus, {
          id: webhookEventId,
          status: "processed",
        });
      }

      return NextResponse.json({
        success: true,
        action: event.type === "payment_intent.succeeded"
          ? "payment_completed"
          : "payment_failed",
      });
    }

    // Handle payout events
    if (
      event.type === "payout.paid" ||
      event.type === "payout.failed" ||
      event.type === "payout.canceled"
    ) {
      const payoutInfo = extractPayoutInfo(event);

      if (payoutInfo) {
        // Find the transaction by reference (payout ID stored in metadata)
        const transactionId = payoutInfo.metadata.transactionId as Id<"transactions"> | undefined;

        if (transactionId) {
          await convex.mutation(api.wallets.completeWithdrawal, {
            transactionId,
            success: event.type === "payout.paid",
            reference: payoutInfo.payoutId,
            error: event.type !== "payout.paid" ? `Payout ${payoutInfo.status}` : undefined,
          });
        }
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "payout_processed" });
    }

    // Handle fraud warning events
    if (event.type === "radar.early_fraud_warning.created") {
      const warning = extractFraudWarning(event);

      if (warning) {
        // Log the fraud warning - could trigger alerts or hold payments
        console.warn("Fraud warning received:", warning);
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "fraud_warning_logged" });
    }

    // Handle account events (Connect)
    if (event.type === "account.updated") {
      const account = event.data.object as {
        id: string;
        charges_enabled: boolean;
        payouts_enabled: boolean;
        details_submitted: boolean;
      };

      // Could update user's wallet status based on account status
      console.log("Stripe Connect account updated:", account.id);

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "account_updated" });
    }

    // Handle charge dispute events
    if (event.type === "charge.dispute.created") {
      const metadata = extractPaymentMetadata(event);
      // Could trigger dispute handling workflow

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "dispute_created" });
    }

    // Unhandled event type
    await convex.mutation(api.webhookEvents.updateStatus, {
      id: webhookEventId,
      status: "ignored",
    });

    return NextResponse.json({ success: true, action: "ignored" });
  } catch (error) {
    console.error("Stripe webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
