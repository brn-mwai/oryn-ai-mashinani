import crypto from "crypto";

// Resend webhook event types
export type ResendWebhookEventType =
  | "email.sent"
  | "email.delivered"
  | "email.delivery_delayed"
  | "email.bounced"
  | "email.complained"
  | "email.opened"
  | "email.clicked";

export interface ResendWebhookEvent {
  type: ResendWebhookEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // For bounced events
    bounce?: {
      message: string;
      type: string;
    };
    // For clicked events
    click?: {
      link: string;
      timestamp: string;
      ipAddress: string;
      userAgent: string;
    };
    // For opened events
    open?: {
      timestamp: string;
      ipAddress: string;
      userAgent: string;
    };
    // Custom tags
    tags?: Record<string, string>;
  };
}

// Verify Resend webhook signature
export function verifyResendWebhook(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("RESEND_WEBHOOK_SECRET not configured, skipping verification");
    return true;
  }

  const toSign = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(toSign)
    .digest("hex");

  // Signature format: v1,<hash>
  const providedHash = signature.replace("v1,", "");

  return crypto.timingSafeEqual(
    Buffer.from(providedHash),
    Buffer.from(expectedSignature)
  );
}

// Parse Resend webhook payload
export function parseResendWebhook(payload: string): ResendWebhookEvent {
  return JSON.parse(payload) as ResendWebhookEvent;
}

// Handler type for webhook events
export type ResendWebhookHandler = {
  [K in ResendWebhookEventType]?: (event: ResendWebhookEvent) => Promise<void>;
};

// Create webhook handler
export function createResendWebhookHandler(handlers: ResendWebhookHandler) {
  return async (event: ResendWebhookEvent) => {
    const handler = handlers[event.type];
    if (handler) {
      await handler(event);
    }
  };
}

// Check if event indicates successful delivery
export function isDeliverySuccess(event: ResendWebhookEvent): boolean {
  return event.type === "email.delivered";
}

// Check if event indicates a problem
export function isDeliveryProblem(event: ResendWebhookEvent): boolean {
  return (
    event.type === "email.bounced" ||
    event.type === "email.complained" ||
    event.type === "email.delivery_delayed"
  );
}

// Extract email metadata from tags
export function extractEmailMetadata(event: ResendWebhookEvent): {
  messageId?: string;
  claimId?: string;
  userId?: string;
  clientId?: string;
} {
  const tags = event.data.tags ?? {};
  return {
    messageId: tags.messageId,
    claimId: tags.claimId,
    userId: tags.userId,
    clientId: tags.clientId,
  };
}
