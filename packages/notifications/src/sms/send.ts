import { getTwilio, getTwilioPhoneNumber, getStatusCallbackUrl } from "./client";

export interface SendSmsInput {
  to: string;
  body: string;
  from?: string;
  statusCallback?: string;
  // Metadata for tracking (added to status callback URL)
  metadata?: {
    messageId?: string;
    claimId?: string;
    userId?: string;
    clientId?: string;
  };
}

export interface SendSmsResult {
  sid: string;
  to: string;
  from: string;
  body: string;
  status: string;
  dateCreated: Date;
}

// Send a single SMS
export async function sendSms(input: SendSmsInput): Promise<SendSmsResult> {
  const twilio = getTwilio();
  const fromNumber = input.from ?? getTwilioPhoneNumber();

  // Build status callback URL with metadata
  let statusCallback = input.statusCallback ?? getStatusCallbackUrl();
  if (input.metadata) {
    const params = new URLSearchParams();
    Object.entries(input.metadata).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (params.toString()) {
      statusCallback += `?${params.toString()}`;
    }
  }

  const message = await twilio.messages.create({
    to: input.to,
    from: fromNumber,
    body: input.body,
    statusCallback,
  });

  return {
    sid: message.sid,
    to: message.to,
    from: message.from,
    body: message.body,
    status: message.status,
    dateCreated: message.dateCreated,
  };
}

// Get message status
export async function getSmsStatus(
  messageSid: string
): Promise<{
  sid: string;
  status: string;
  errorCode?: number;
  errorMessage?: string;
  dateCreated: Date;
  dateSent?: Date;
  dateUpdated: Date;
}> {
  const twilio = getTwilio();
  const message = await twilio.messages(messageSid).fetch();

  return {
    sid: message.sid,
    status: message.status,
    errorCode: message.errorCode ?? undefined,
    errorMessage: message.errorMessage ?? undefined,
    dateCreated: message.dateCreated,
    dateSent: message.dateSent ?? undefined,
    dateUpdated: message.dateUpdated,
  };
}

// Validate phone number format
export function validatePhoneNumber(phone: string): {
  valid: boolean;
  formatted?: string;
  error?: string;
} {
  // Basic E.164 validation
  const e164Regex = /^\+[1-9]\d{1,14}$/;

  // If already E.164, return as-is
  if (e164Regex.test(phone)) {
    return { valid: true, formatted: phone };
  }

  // Try to format US numbers
  const digitsOnly = phone.replace(/\D/g, "");

  // US number without country code
  if (digitsOnly.length === 10) {
    const formatted = `+1${digitsOnly}`;
    return { valid: true, formatted };
  }

  // US number with country code
  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    const formatted = `+${digitsOnly}`;
    return { valid: true, formatted };
  }

  return {
    valid: false,
    error: "Invalid phone number format. Please use E.164 format (+1XXXXXXXXXX)",
  };
}

// SMS templates for common scenarios
export const SMS_TEMPLATES = {
  PAYMENT_REMINDER: "payment_reminder",
  PAYMENT_CONFIRMATION: "payment_confirmation",
  VERIFICATION_CODE: "verification_code",
} as const;

export type SmsTemplate = (typeof SMS_TEMPLATES)[keyof typeof SMS_TEMPLATES];

// Generate SMS content with max length check
export function generateSmsContent(
  content: string,
  options?: { maxLength?: number }
): { content: string; truncated: boolean } {
  const maxLength = options?.maxLength ?? 160;

  if (content.length <= maxLength) {
    return { content, truncated: false };
  }

  // Truncate and add ellipsis
  return {
    content: content.slice(0, maxLength - 3) + "...",
    truncated: true,
  };
}
