import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

export const twilioClient =
  accountSid && authToken ? twilio(accountSid, authToken) : null;

export function getTwilio() {
  if (!twilioClient) {
    throw new Error("Twilio credentials not configured");
  }
  return twilioClient;
}

export function isTwilioConfigured(): boolean {
  return !!twilioClient && !!phoneNumber;
}

export function getTwilioPhoneNumber(): string {
  if (!phoneNumber) {
    throw new Error("TWILIO_PHONE_NUMBER not configured");
  }
  return phoneNumber;
}

// Webhook URL for status callbacks
export function getStatusCallbackUrl(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL not configured");
  }
  return `${appUrl}/api/webhooks/twilio`;
}
