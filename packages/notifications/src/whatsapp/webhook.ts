import crypto from "crypto";

// WhatsApp message status values
export type WhatsAppMessageStatus =
  | "sent"
  | "delivered"
  | "read"
  | "failed";

// WhatsApp webhook entry types
export interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: "whatsapp";
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      // Incoming messages
      messages?: Array<{
        id: string;
        from: string;
        timestamp: string;
        type: string;
        text?: { body: string };
        interactive?: {
          type: string;
          button_reply?: { id: string; title: string };
          list_reply?: { id: string; title: string; description?: string };
        };
      }>;
      // Status updates
      statuses?: Array<{
        id: string;
        recipient_id: string;
        status: WhatsAppMessageStatus;
        timestamp: string;
        conversation?: {
          id: string;
          origin: { type: string };
          expiration_timestamp?: string;
        };
        pricing?: {
          pricing_model: string;
          billable: boolean;
          category: string;
        };
        errors?: Array<{
          code: number;
          title: string;
          message: string;
          error_data?: { details: string };
        }>;
      }>;
      // Contacts
      contacts?: Array<{
        wa_id: string;
        profile: { name: string };
      }>;
    };
    field: string;
  }>;
}

export interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: WhatsAppWebhookEntry[];
}

// Verify WhatsApp webhook signature
export function verifyWhatsAppWebhook(
  payload: string,
  signature: string
): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;

  if (!appSecret) {
    console.warn("WHATSAPP_APP_SECRET not configured, skipping verification");
    return true;
  }

  // Signature format: sha256=<hash>
  const expectedSignature =
    "sha256=" +
    crypto.createHmac("sha256", appSecret).update(payload).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Verify webhook challenge (for setup)
export function verifyWebhookChallenge(
  mode: string,
  token: string,
  challenge: string
): string | null {
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    return challenge;
  }

  return null;
}

// Parse WhatsApp webhook payload
export function parseWhatsAppWebhook(payload: string): WhatsAppWebhookPayload {
  return JSON.parse(payload) as WhatsAppWebhookPayload;
}

// Extract status updates from webhook
export function extractStatusUpdates(
  payload: WhatsAppWebhookPayload
): Array<{
  messageId: string;
  recipientId: string;
  status: WhatsAppMessageStatus;
  timestamp: Date;
  error?: { code: number; message: string };
}> {
  const updates: Array<{
    messageId: string;
    recipientId: string;
    status: WhatsAppMessageStatus;
    timestamp: Date;
    error?: { code: number; message: string };
  }> = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const statuses = change.value.statuses ?? [];
      for (const status of statuses) {
        updates.push({
          messageId: status.id,
          recipientId: status.recipient_id,
          status: status.status,
          timestamp: new Date(parseInt(status.timestamp) * 1000),
          error: status.errors?.[0]
            ? {
                code: status.errors[0].code,
                message: status.errors[0].message,
              }
            : undefined,
        });
      }
    }
  }

  return updates;
}

// Extract incoming messages from webhook
export function extractIncomingMessages(
  payload: WhatsAppWebhookPayload
): Array<{
  messageId: string;
  from: string;
  fromName?: string;
  timestamp: Date;
  type: string;
  text?: string;
  buttonReply?: { id: string; title: string };
  listReply?: { id: string; title: string; description?: string };
}> {
  const messages: Array<{
    messageId: string;
    from: string;
    fromName?: string;
    timestamp: Date;
    type: string;
    text?: string;
    buttonReply?: { id: string; title: string };
    listReply?: { id: string; title: string; description?: string };
  }> = [];

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      const incomingMessages = change.value.messages ?? [];
      const contacts = change.value.contacts ?? [];

      for (const msg of incomingMessages) {
        const contact = contacts.find((c) => c.wa_id === msg.from);

        messages.push({
          messageId: msg.id,
          from: msg.from,
          fromName: contact?.profile.name,
          timestamp: new Date(parseInt(msg.timestamp) * 1000),
          type: msg.type,
          text: msg.text?.body,
          buttonReply: msg.interactive?.button_reply,
          listReply: msg.interactive?.list_reply,
        });
      }
    }
  }

  return messages;
}

// Handler types
export type WhatsAppStatusHandler = (
  updates: ReturnType<typeof extractStatusUpdates>
) => Promise<void>;

export type WhatsAppMessageHandler = (
  messages: ReturnType<typeof extractIncomingMessages>
) => Promise<void>;

// Check if status indicates successful delivery
export function isDeliverySuccess(status: WhatsAppMessageStatus): boolean {
  return status === "delivered" || status === "read";
}

// Check if status indicates a problem
export function isDeliveryProblem(status: WhatsAppMessageStatus): boolean {
  return status === "failed";
}

// Map WhatsApp status to our internal status
export function mapWhatsAppStatus(status: WhatsAppMessageStatus): string {
  switch (status) {
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
      return "failed";
    default:
      return "unknown";
  }
}
