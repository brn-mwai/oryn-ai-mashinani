import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyCircleWebhook,
  parseCircleWebhook,
  extractTransferInfo,
  extractWalletInfo,
} from "@oryn/payments";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-circle-signature") ?? "";

  // Verify webhook signature
  if (!verifyCircleWebhook(payload, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const event = parseCircleWebhook(payload);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "circle",
      eventType: event.notificationType,
      eventId: event.notificationId,
      payload: event.notification,
    });

    // Handle wallet creation events
    if (event.notificationType === "wallets.created") {
      const walletInfo = extractWalletInfo(event);

      if (walletInfo?.userId) {
        // The userId in Circle's webhook is our reference we passed during creation
        // Find the wallet by userId and update with Circle wallet ID
        const wallets = await convex.query(api.wallets.getByUser, {
          userId: walletInfo.userId as Id<"users">,
        });

        if (wallets && wallets.type === "usdc") {
          await convex.mutation(api.wallets.setCircleWalletId, {
            id: wallets._id,
            circleWalletId: walletInfo.walletId,
          });
        }
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "wallet_created" });
    }

    // Handle transfer completion events
    if (event.notificationType === "transfers.complete") {
      const transferInfo = extractTransferInfo(event);

      if (transferInfo) {
        // Could be a deposit (incoming) or withdrawal (outgoing)
        // The transfer ID would be stored in our transaction metadata

        console.log("Circle transfer completed:", transferInfo);
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "transfer_completed" });
    }

    // Handle transfer failure events
    if (event.notificationType === "transfers.failed") {
      const transferInfo = extractTransferInfo(event);

      if (transferInfo) {
        // Handle failed transfer - could be a failed withdrawal
        console.error("Circle transfer failed:", transferInfo);
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });

      return NextResponse.json({ success: true, action: "transfer_failed" });
    }

    // Unhandled event type
    await convex.mutation(api.webhookEvents.updateStatus, {
      id: webhookEventId,
      status: "ignored",
    });

    return NextResponse.json({ success: true, action: "ignored" });
  } catch (error) {
    console.error("Circle webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
