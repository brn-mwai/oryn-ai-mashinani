// Resend client
export {
  resend,
  getResend,
  isResendConfigured,
  DEFAULT_FROM_EMAIL,
  DEFAULT_REPLY_TO,
} from "./client";

// Send functions
export {
  sendEmail,
  sendBatchEmails,
  getEmail,
  EMAIL_TEMPLATES,
} from "./send";
export type {
  SendEmailInput,
  SendEmailResult,
  EmailTemplate,
} from "./send";

// Webhook utilities
export {
  verifyResendWebhook,
  parseResendWebhook,
  createResendWebhookHandler,
  isDeliverySuccess,
  isDeliveryProblem,
  extractEmailMetadata,
} from "./webhook";
export type {
  ResendWebhookEvent,
  ResendWebhookEventType,
  ResendWebhookHandler,
} from "./webhook";
