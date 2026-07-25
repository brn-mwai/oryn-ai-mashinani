// Twilio client
export {
  twilioClient,
  getTwilio,
  isTwilioConfigured,
  getTwilioPhoneNumber,
  getStatusCallbackUrl,
} from "./client";

// Send functions
export {
  sendSms,
  getSmsStatus,
  validatePhoneNumber,
  generateSmsContent,
  SMS_TEMPLATES,
} from "./send";
export type { SendSmsInput, SendSmsResult, SmsTemplate } from "./send";

// Webhook utilities
export {
  verifyTwilioWebhook,
  parseTwilioWebhook,
  isDeliverySuccess,
  isDeliveryProblem,
  isTerminalStatus,
  mapTwilioStatus,
} from "./webhook";
export type {
  TwilioWebhookPayload,
  TwilioMessageStatus,
  TwilioStatusHandler,
} from "./webhook";
