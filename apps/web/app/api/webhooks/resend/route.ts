import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyResendWebhook,
  parseResendWebhook,
  extractEmailMetadata,
} from "@oryn/notifications";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("svix-signature") ?? "";
  const timestamp = req.headers.get("svix-timestamp") ?? "";

  // Verify webhook signature
  if (!verifyResendWebhook(payload, signature, timestamp)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const event = parseResendWebhook(payload);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "resend",
      eventType: event.type,
      eventId: event.data.email_id,
      payload: event.data,
    });

    // Extract metadata from tags
    const metadata = extractEmailMetadata(event);

    // Find the message by Resend ID
    let message = null;
    if (event.data.email_id) {
      message = await convex.query(api.messages.getByResendId, {
        resendId: event.data.email_id,
      });
    }

    // Map Resend status to our status
    const statusMap: Record<string, "sent" | "delivered" | "failed" | "read"> = {
      "email.sent": "sent",
      "email.delivered": "delivered",
      "email.bounced": "failed",
      "email.complained": "failed",
      "email.opened": "read",
      "email.clicked": "read",
      "email.delivery_delayed": "sent",
    };

    const newStatus = statusMap[event.type];

    if (message && newStatus) {
      const updates: {
        id: Id<"messages">;
        status: "sent" | "delivered" | "failed" | "read";
        deliveredAt?: number;
        readAt?: number;
      } = {
        id: message._id,
        status: newStatus,
      };

      if (newStatus === "delivered") {
        updates.deliveredAt = Date.now();
      } else if (newStatus === "read") {
        updates.readAt = Date.now();
      }

      await convex.mutation(api.messages.updateStatus, updates);

      // Create notification for owner on delivery success or problem
      const successEvents = ["email.delivered", "email.opened", "email.clicked"];
      const failureEvents = ["email.bounced", "email.complained"];

      if (successEvents.includes(event.type)) {
        await convex.mutation(api.notifications.create, {
          userId: message.userId,
          type: "message_delivered",
          title: "Message Delivered",
          message: `Your email to ${event.data.to.join(", ")} was delivered successfully.`,
          priority: "low",
          messageId: message._id,
          claimId: message.claimId,
        });
      } else if (failureEvents.includes(event.type)) {
        await convex.mutation(api.notifications.create, {
          userId: message.userId,
          type: "message_failed",
          title: "Message Delivery Failed",
          message: `Your email to ${event.data.to.join(", ")} could not be delivered. ${event.data.bounce?.message ?? ""}`,
          priority: "high",
          messageId: message._id,
          claimId: message.claimId,
        });
      }

      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
        messageId: message._id,
      });
    } else {
      await convex.mutation(api.webhookEvents.updateStatus, {
        id: webhookEventId,
        status: "processed",
      });
    }

    return NextResponse.json({ success: true, action: event.type });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
