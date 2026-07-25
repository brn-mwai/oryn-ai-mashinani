import { getResend, DEFAULT_FROM_EMAIL, DEFAULT_REPLY_TO } from "./client";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: React.ReactElement;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  tags?: Array<{ name: string; value: string }>;
  headers?: Record<string, string>;
}

export interface SendEmailResult {
  id: string;
  from: string;
  to: string[];
  createdAt: string;
}

// Send a single email
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: input.from ?? DEFAULT_FROM_EMAIL,
    to: Array.isArray(input.to) ? input.to : [input.to],
    subject: input.subject,
    html: input.html,
    text: input.text,
    react: input.react,
    replyTo: input.replyTo ?? DEFAULT_REPLY_TO,
    cc: input.cc ? (Array.isArray(input.cc) ? input.cc : [input.cc]) : undefined,
    bcc: input.bcc ? (Array.isArray(input.bcc) ? input.bcc : [input.bcc]) : undefined,
    tags: input.tags,
    headers: input.headers,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return {
    id: data!.id,
    from: input.from ?? DEFAULT_FROM_EMAIL,
    to: Array.isArray(input.to) ? input.to : [input.to],
    createdAt: new Date().toISOString(),
  };
}

// Send batch emails (up to 100)
export async function sendBatchEmails(
  emails: SendEmailInput[]
): Promise<SendEmailResult[]> {
  const resend = getResend();

  const batch = emails.map((email) => ({
    from: email.from ?? DEFAULT_FROM_EMAIL,
    to: Array.isArray(email.to) ? email.to : [email.to],
    subject: email.subject,
    html: email.html,
    text: email.text,
    react: email.react,
    replyTo: email.replyTo ?? DEFAULT_REPLY_TO,
    tags: email.tags,
    headers: email.headers,
  }));

  const { data, error } = await resend.batch.send(batch);

  if (error) {
    throw new Error(`Failed to send batch emails: ${error.message}`);
  }

  return data!.data.map((result, index) => ({
    id: result.id,
    from: emails[index].from ?? DEFAULT_FROM_EMAIL,
    to: Array.isArray(emails[index].to) ? emails[index].to : [emails[index].to],
    createdAt: new Date().toISOString(),
  }));
}

// Get email by ID
export async function getEmail(emailId: string) {
  const resend = getResend();
  const { data, error } = await resend.emails.get(emailId);

  if (error) {
    throw new Error(`Failed to get email: ${error.message}`);
  }

  return data;
}

// Email templates for common scenarios
export const EMAIL_TEMPLATES = {
  PAYMENT_REMINDER: "payment_reminder",
  PAYMENT_RECEIVED: "payment_received",
  WELCOME: "welcome",
  MESSAGE_DELIVERED: "message_delivered",
  WITHDRAWAL_COMPLETE: "withdrawal_complete",
  SECURITY_ALERT: "security_alert",
  KYC_UPDATE: "kyc_update",
} as const;

export type EmailTemplate = (typeof EMAIL_TEMPLATES)[keyof typeof EMAIL_TEMPLATES];
