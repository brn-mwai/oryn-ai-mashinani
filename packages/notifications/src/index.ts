// Email (Resend) exports - namespace to avoid conflicts
import * as email from "./email";
export { email };
export {
  sendEmail,
  sendBatchEmails,
  isResendConfigured,
  resend,
  getResend,
  verifyResendWebhook,
  parseResendWebhook,
  extractEmailMetadata,
  createResendWebhookHandler,
  type ResendWebhookEvent,
  type SendEmailInput,
  type SendEmailResult,
} from "./email";

// SMS (Twilio) exports - namespace to avoid conflicts
import * as sms from "./sms";
export { sms };
export {
  sendSms,
  getSmsStatus,
  isTwilioConfigured,
  twilioClient,
  getTwilio,
  verifyTwilioWebhook,
  parseTwilioWebhook,
  mapTwilioStatus,
  isTerminalStatus,
  type TwilioMessageStatus,
  type SendSmsInput,
  type SendSmsResult,
} from "./sms";

// WhatsApp exports - namespace to avoid conflicts
import * as whatsapp from "./whatsapp";
export { whatsapp };
export {
  sendWhatsApp,
  sendTemplateMessage,
  isWhatsAppConfigured,
  verifyWhatsAppWebhook,
  verifyWebhookChallenge,
  parseWhatsAppWebhook,
  extractStatusUpdates,
  extractIncomingMessages,
  mapWhatsAppStatus,
  type WhatsAppMessageStatus,
  type SendWhatsAppInput,
  type SendWhatsAppResult,
} from "./whatsapp";

// Notification channel type
export type NotificationChannel = "email" | "sms" | "whatsapp";

// Check which channels are configured
export function getConfiguredChannels(): NotificationChannel[] {
  const { isResendConfigured } = require("./email");
  const { isTwilioConfigured } = require("./sms");
  const { isWhatsAppConfigured } = require("./whatsapp");

  const channels: NotificationChannel[] = [];

  if (isResendConfigured()) channels.push("email");
  if (isTwilioConfigured()) channels.push("sms");
  if (isWhatsAppConfigured()) channels.push("whatsapp");

  return channels;
}

// Check if any notification channel is configured
export function isNotificationsConfigured(): boolean {
  return getConfiguredChannels().length > 0;
}

// Unified delivery status
export type DeliveryStatus =
  | "queued"
  | "sending"
  | "sent"
  | "delivered"
  | "read"
  | "failed"
  | "bounced"
  | "complained";

// Map channel-specific status to unified status
export function mapToDeliveryStatus(
  channel: NotificationChannel,
  status: string
): DeliveryStatus {
  switch (channel) {
    case "email":
      switch (status) {
        case "email.sent":
          return "sent";
        case "email.delivered":
          return "delivered";
        case "email.opened":
          return "read";
        case "email.bounced":
          return "bounced";
        case "email.complained":
          return "complained";
        case "email.delivery_delayed":
          return "sending";
        default:
          return "queued";
      }

    case "sms":
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
        default:
          return "queued";
      }

    case "whatsapp":
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
          return "queued";
      }

    default:
      return "queued";
  }
}

// Check if delivery was successful
export function wasDeliverySuccessful(status: DeliveryStatus): boolean {
  return ["delivered", "read"].includes(status);
}

// Check if delivery had a problem
export function hadDeliveryProblem(status: DeliveryStatus): boolean {
  return ["failed", "bounced", "complained"].includes(status);
}
