// WhatsApp client
export {
  getWhatsAppConfig,
  isWhatsAppConfigured,
  whatsappRequest,
  getMessagesEndpoint,
} from "./client";
export type { WhatsAppConfig } from "./client";

// Send functions
export {
  sendWhatsApp,
  sendTemplateMessage,
  validateWhatsAppNumber,
  textParam,
  currencyParam,
  WHATSAPP_TEMPLATES,
} from "./send";
export type {
  SendWhatsAppInput,
  SendWhatsAppResult,
  WhatsAppMessageType,
  WhatsAppTemplate,
  TemplateParameter,
  TemplateComponent,
} from "./send";

// Webhook utilities
export {
  verifyWhatsAppWebhook,
  verifyWebhookChallenge,
  parseWhatsAppWebhook,
  extractStatusUpdates,
  extractIncomingMessages,
  isDeliverySuccess,
  isDeliveryProblem,
  mapWhatsAppStatus,
} from "./webhook";
export type {
  WhatsAppWebhookPayload,
  WhatsAppWebhookEntry,
  WhatsAppMessageStatus,
  WhatsAppStatusHandler,
  WhatsAppMessageHandler,
} from "./webhook";
