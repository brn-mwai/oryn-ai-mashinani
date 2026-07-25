import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import {
  verifyWhatsAppWebhook,
  verifyWebhookChallenge,
  parseWhatsAppWebhook,
  extractStatusUpdates,
  extractIncomingMessages,
  mapWhatsAppStatus,
} from "@oryn/notifications";
import { api } from "@oryn/database/server";
import type { Id } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// GET handler for webhook verification (required by WhatsApp)
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode") ?? "";
  const token = searchParams.get("hub.verify_token") ?? "";
  const challenge = searchParams.get("hub.challenge") ?? "";

  const result = verifyWebhookChallenge(mode, token, challenge);

  if (result) {
    return new NextResponse(result, { status: 200 });
  }

  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// POST handler for webhook events
export async function POST(req: NextRequest) {
  const payload = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  // Verify webhook signature
  if (!verifyWhatsAppWebhook(payload, signature)) {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 401 }
    );
  }

  try {
    const webhookPayload = parseWhatsAppWebhook(payload);

    // Log webhook event for audit
    const webhookEventId = await convex.mutation(api.webhookEvents.create, {
      provider: "whatsapp",
      eventType: "webhook_received",
      payload: webhookPayload,
    });

    // Process status updates
    const statusUpdates = extractStatusUpdates(webhookPayload);
    for (const update of statusUpdates) {
      // Find the message by WhatsApp message ID
      const message = await convex.query(api.messages.getByWhatsappMsgId, {
        whatsappMsgId: update.messageId,
      });

      if (message) {
        const internalStatus = mapWhatsAppStatus(update.status);
        const statusMapping: Record<string, "sent" | "delivered" | "failed" | "read"> = {
          sent: "sent",
          delivered: "delivered",
          read: "read",
          failed: "failed",
          unknown: "sent",
        };

        const newStatus = statusMapping[internalStatus] ?? "sent";

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
          updates.deliveredAt = update.timestamp.getTime();
        } else if (newStatus === "read") {
          updates.readAt = update.timestamp.getTime();
        }

        await convex.mutation(api.messages.updateStatus, updates);

        // Create notification for owner
        const successStatuses = ["delivered", "read"];
        const failureStatuses = ["failed"];

        if (successStatuses.includes(update.status)) {
          await convex.mutation(api.notifications.create, {
            userId: message.userId,
            type: update.status === "read" ? "message_read" : "message_delivered",
            title: update.status === "read" ? "WhatsApp Message Read" : "WhatsApp Message Delivered",
            message: `Your WhatsApp message to ${update.recipientId} was ${update.status}.`,
            priority: "low",
            messageId: message._id,
            claimId: message.claimId,
          });
        } else if (failureStatuses.includes(update.status)) {
          await convex.mutation(api.notifications.create, {
            userId: message.userId,
            type: "message_failed",
            title: "WhatsApp Message Failed",
            message: `Your WhatsApp message to ${update.recipientId} could not be delivered. ${update.error?.message ?? ""}`,
            priority: "high",
            messageId: message._id,
            claimId: message.claimId,
          });
        }
      }
    }

    // Process incoming messages
    const incomingMessages = extractIncomingMessages(webhookPayload);
    for (const incoming of incomingMessages) {
      // Find the client by WhatsApp number
      const client = await convex.query(api.clients.getByWhatsapp, {
        whatsapp: incoming.from,
      });

      if (client) {
        // Find the most recent active claim for this client
        const claims = await convex.query(api.claims.listByClient, {
          clientId: client._id,
          status: "active",
          limit: 1,
        });

        if (claims && claims.length > 0) {
          const claim = claims[0];

          // Create inbound message
          const messageId = await convex.mutation(api.messages.create, {
            claimId: claim._id,
            userId: claim.userId,
            clientId: client._id,
            channel: "whatsapp",
            direction: "inbound",
            content: incoming.text ?? `[${incoming.type}]`,
            status: "delivered",
            whatsappMsgId: incoming.messageId,
            metadata: {
              fromName: incoming.fromName,
              type: incoming.type,
              buttonReply: incoming.buttonReply,
              listReply: incoming.listReply,
            },
          });

          // Notify owner of incoming message
          await convex.mutation(api.notifications.create, {
            userId: claim.userId,
            type: "message_received",
            title: "New WhatsApp Message",
            message: `${incoming.fromName ?? incoming.from}: ${incoming.text ?? `[${incoming.type}]`}`,
            priority: "normal",
            messageId,
            claimId: claim._id,
          });

          // Update client's last response time
          await convex.mutation(api.clients.updateLastResponse, {
            id: client._id,
          });
        }
      }
    }

    await convex.mutation(api.webhookEvents.updateStatus, {
      id: webhookEventId,
      status: "processed",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
