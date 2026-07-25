import crypto from "crypto";

// Twilio message status values
export type TwilioMessageStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "undelivered"
  | "failed"
  | "receiving"
  | "received"
  | "accepted"
  | "read";

export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  MessagingServiceSid?: string;
  From: string;
  To: string;
  Body?: string;
  MessageStatus: TwilioMessageStatus;
  ErrorCode?: string;
  ErrorMessage?: string;
  // Custom metadata from URL params
  messageId?: string;
  claimId?: string;
  userId?: string;
  clientId?: string;
}

// Verify Twilio webhook signature
export function verifyTwilioWebhook(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!authToken) {
    console.warn("TWILIO_AUTH_TOKEN not configured, skipping verification");
    return true;
  }

  // Sort params and concatenate
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], "");

  const toSign = url + sortedParams;
  const expectedSignature = crypto
    .createHmac("sha1", authToken)
    .update(Buffer.from(toSign, "utf-8"))
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Parse Twilio webhook payload from form data
export function parseTwilioWebhook(
  formData: FormData | URLSearchParams | Record<string, string>
): TwilioWebhookPayload {
  const get = (key: string): string | undefined => {
    if (formData instanceof FormData || formData instanceof URLSearchParams) {
      return formData.get(key)?.toString();
    }
    return formData[key];
  };

  return {
    MessageSid: get("MessageSid") ?? "",
    AccountSid: get("AccountSid") ?? "",
    MessagingServiceSid: get("MessagingServiceSid"),
    From: get("From") ?? "",
    To: get("To") ?? "",
    Body: get("Body"),
    MessageStatus: (get("MessageStatus") ?? "queued") as TwilioMessageStatus,
    ErrorCode: get("ErrorCode"),
    ErrorMessage: get("ErrorMessage"),
    // Custom metadata
    messageId: get("messageId"),
    claimId: get("claimId"),
    userId: get("userId"),
    clientId: get("clientId"),
  };
}

// Handler type for status updates
export type TwilioStatusHandler = (payload: TwilioWebhookPayload) => Promise<void>;

// Check if status indicates successful delivery
export function isDeliverySuccess(status: TwilioMessageStatus): boolean {
  return status === "delivered" || status === "read";
}

// Check if status indicates a problem
export function isDeliveryProblem(status: TwilioMessageStatus): boolean {
  return status === "failed" || status === "undelivered";
}

// Check if status is terminal (no more updates expected)
export function isTerminalStatus(status: TwilioMessageStatus): boolean {
  return ["delivered", "failed", "undelivered", "read"].includes(status);
}

// Map Twilio status to our internal status
export function mapTwilioStatus(status: TwilioMessageStatus): string {
  switch (status) {
    case "queued":
    case "accepted":
      return "queued";
    case "sending":
      return "sending";
    case "sent":
      return "sent";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
    case "undelivered":
      return "failed";
    case "receiving":
    case "received":
      return "received";
    default:
      return "unknown";
  }
}
