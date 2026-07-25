// WhatsApp Business Cloud API client

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

// WhatsApp API base URL
const WHATSAPP_API_URL = "https://graph.facebook.com/v18.0";

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  apiUrl: string;
}

export function getWhatsAppConfig(): WhatsAppConfig {
  if (!accessToken) {
    throw new Error("WHATSAPP_ACCESS_TOKEN not configured");
  }
  if (!phoneNumberId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID not configured");
  }
  if (!businessAccountId) {
    throw new Error("WHATSAPP_BUSINESS_ACCOUNT_ID not configured");
  }

  return {
    accessToken,
    phoneNumberId,
    businessAccountId,
    apiUrl: WHATSAPP_API_URL,
  };
}

export function isWhatsAppConfigured(): boolean {
  return !!accessToken && !!phoneNumberId && !!businessAccountId;
}

// WhatsApp API request helper
export async function whatsappRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
  } = {}
): Promise<T> {
  const config = getWhatsAppConfig();

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    method: options.method ?? "POST",
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `WhatsApp API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

// Get messages endpoint URL
export function getMessagesEndpoint(): string {
  const config = getWhatsAppConfig();
  return `/${config.phoneNumberId}/messages`;
}
