import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyTwilioWebhook,
  parseTwilioWebhook,
  mapTwilioStatus,
} from "@oryn/notifications";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const url = req.url;
  const signature = req.headers.get("x-twilio-signature") ?? "";

  // Convert FormData to params object for verification
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  // Verify webhook signature
  if (!verifyTwilioWebhook(url, params, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const payload = parseTwilioWebhook(params);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "twilio",
      eventType: `sms.${payload.MessageStatus}`,
      eventId: payload.MessageSid,
      payload,
    });

    // Find the message by Twilio SID
    let message = null;
    if (payload.MessageSid) {
      message = await convex.query(api.messages.getByTwilioSid, {
        twilioSid: payload.MessageSid,
      });
    }

    // Map Twilio status to our status
    const internalStatus = mapTwilioStatus(payload.MessageStatus);
    const statusMapping: Record<string, "queued" | "sent" | "delivered" | "failed" | "read"> = {
      queued: "queued",
      sending: "sent",
      sent: "sent",
      delivered: "delivered",
      read: "read",
      failed: "failed",
      received: "delivered",
      unknown: "sent",
    };

    const newStatus = statusMapping[internalStatus] ?? "sent";

    if (message) {
      const updates: {
        id: Id<"messages">;
        status: "queued" | "sent" | "delivered" | "failed" | "read";
        sentAt?: number;
        deliveredAt?: number;
        readAt?: number;
      } = {
        id: message._id,
        status: newStatus,
      };

      if (newStatus === "sent") {
        updates.sentAt = Date.now();
      } else if (newStatus === "delivered") {
        updates.deliveredAt = Date.now();
      } else if (newStatus === "read") {
        updates.readAt = Date.now();
      }

      await convex.mutation(api.messages.updateStatus, updates);

      // Create notification for owner on delivery success or problem
      const successStatuses = ["delivered", "read"];
      const failureStatuses = ["failed", "undelivered"];

      if (successStatuses.includes(payload.MessageStatus)) {
        await convex.mutation(api.notifications.create, {
          userId: message.userId,
          type: "message_delivered",
          title: "SMS Delivered",
          message: `Your SMS to ${payload.To} was delivered successfully.`,
          priority: "low",
          messageId: message._id,
          claimId: message.claimId,
        });
      } else if (failureStatuses.includes(payload.MessageStatus)) {
        await convex.mutation(api.notifications.create, {
          userId: message.userId,
          type: "message_failed",
          title: "SMS Delivery Failed",
          message: `Your SMS to ${payload.To} could not be delivered. ${payload.ErrorMessage ?? ""}`,
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

    // Return TwiML empty response
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { "Content-Type": "text/xml" },
      }
    );
  } catch (error) {
    console.error("Twilio webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
