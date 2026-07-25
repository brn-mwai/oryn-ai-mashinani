import { whatsappRequest, getMessagesEndpoint } from "./client";

// WhatsApp message types
export type WhatsAppMessageType = "text" | "template" | "interactive" | "document" | "image";

// Template parameter types
export interface TemplateParameter {
  type: "text" | "currency" | "date_time";
  text?: string;
  currency?: {
    code: string;
    amount_1000: number;
    fallback_value: string;
  };
  date_time?: {
    fallback_value: string;
  };
}

// Template component
export interface TemplateComponent {
  type: "header" | "body" | "button";
  sub_type?: "quick_reply" | "url";
  parameters?: TemplateParameter[];
  index?: number;
}

export interface SendWhatsAppInput {
  to: string; // Phone number in international format without +
  type?: WhatsAppMessageType;
  // For text messages
  text?: string;
  previewUrl?: boolean;
  // For template messages
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: TemplateComponent[];
}

export interface SendWhatsAppResult {
  messageId: string;
  to: string;
}

// Send a WhatsApp message
export async function sendWhatsApp(
  input: SendWhatsAppInput
): Promise<SendWhatsAppResult> {
  const endpoint = getMessagesEndpoint();

  // Clean phone number (remove + if present)
  const to = input.to.replace(/^\+/, "");

  let body: unknown;

  if (input.type === "template" && input.templateName) {
    // Template message
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: input.templateName,
        language: {
          code: input.templateLanguage ?? "en",
        },
        components: input.templateComponents ?? [],
      },
    };
  } else {
    // Text message
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: input.previewUrl ?? false,
        body: input.text ?? "",
      },
    };
  }

  const response = await whatsappRequest<{
    messaging_product: string;
    contacts: Array<{ input: string; wa_id: string }>;
    messages: Array<{ id: string }>;
  }>(endpoint, { body });

  return {
    messageId: response.messages[0].id,
    to: response.contacts[0].wa_id,
  };
}

// Send template message with parameters
export async function sendTemplateMessage(input: {
  to: string;
  templateName: string;
  language?: string;
  headerParams?: TemplateParameter[];
  bodyParams?: TemplateParameter[];
  buttonParams?: Array<{ index: number; parameters: TemplateParameter[] }>;
}): Promise<SendWhatsAppResult> {
  const components: TemplateComponent[] = [];

  if (input.headerParams?.length) {
    components.push({
      type: "header",
      parameters: input.headerParams,
    });
  }

  if (input.bodyParams?.length) {
    components.push({
      type: "body",
      parameters: input.bodyParams,
    });
  }

  if (input.buttonParams?.length) {
    input.buttonParams.forEach((button) => {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index: button.index,
        parameters: button.parameters,
      });
    });
  }

  return sendWhatsApp({
    to: input.to,
    type: "template",
    templateName: input.templateName,
    templateLanguage: input.language ?? "en",
    templateComponents: components,
  });
}

// Pre-defined template names for Oryn
export const WHATSAPP_TEMPLATES = {
  PAYMENT_REMINDER_FRIENDLY: "payment_reminder_friendly",
  PAYMENT_REMINDER_FIRM: "payment_reminder_firm",
  PAYMENT_LINK: "payment_link",
  PAYMENT_CONFIRMATION: "payment_confirmation",
  THANK_YOU: "thank_you",
} as const;

export type WhatsAppTemplate = (typeof WHATSAPP_TEMPLATES)[keyof typeof WHATSAPP_TEMPLATES];

// Helper to create text parameters
export function textParam(text: string): TemplateParameter {
  return { type: "text", text };
}

// Helper to create currency parameters
export function currencyParam(
  code: string,
  amount: number,
  fallback: string
): TemplateParameter {
  return {
    type: "currency",
    currency: {
      code,
      amount_1000: Math.round(amount * 1000),
      fallback_value: fallback,
    },
  };
}

// Validate WhatsApp phone number format
export function validateWhatsAppNumber(phone: string): {
  valid: boolean;
  formatted?: string;
  error?: string;
} {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, "");

  // Remove leading +
  cleaned = cleaned.replace(/^\+/, "");

  // WhatsApp requires country code + number
  if (cleaned.length < 10 || cleaned.length > 15) {
    return {
      valid: false,
      error: "Phone number must be 10-15 digits including country code",
    };
  }

  return { valid: true, formatted: cleaned };
}
