import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export function getResend(): Resend {
  if (!resend) {
    throw new Error("RESEND_API_KEY not configured");
  }
  return resend;
}

export function isResendConfigured(): boolean {
  return !!resend;
}

// Default from address
export const DEFAULT_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Oryn <notifications@oryn.cc>";

// Default reply-to address
export const DEFAULT_REPLY_TO =
  process.env.RESEND_REPLY_TO ?? "support@oryn.cc";
