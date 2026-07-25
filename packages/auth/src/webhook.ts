import { createHmac, timingSafeEqual } from "crypto";
import { WebhookEvent } from "@clerk/nextjs/server";

// Verify and parse Clerk webhook using native crypto
export async function verifyClerkWebhook(
  payload: string,
  headers: {
    "svix-id": string;
    "svix-timestamp": string;
    "svix-signature": string;
  }
): Promise<WebhookEvent> {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("CLERK_WEBHOOK_SECRET not configured");
  }

  const svixId = headers["svix-id"];
  const svixTimestamp = headers["svix-timestamp"];
  const svixSignature = headers["svix-signature"];

  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new Error("Missing svix headers");
  }

  // Check timestamp to prevent replay attacks (5 minute tolerance)
  const timestamp = parseInt(svixTimestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(timestamp) || Math.abs(now - timestamp) > 300) {
    throw new Error("Invalid or expired timestamp");
  }

  // Extract the secret (remove whsec_ prefix if present)
  const secret = webhookSecret.startsWith("whsec_")
    ? webhookSecret.slice(6)
    : webhookSecret;

  // Decode the base64 secret
  const secretBytes = Buffer.from(secret, "base64");

  // Create the signed content
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;

  // Calculate expected signature
  const expectedSignature = createHmac("sha256", secretBytes)
    .update(signedContent)
    .digest("base64");

  // Parse the signatures from the header (format: v1,signature v1,signature2 ...)
  const signatures = svixSignature.split(" ").map((sig) => {
    const [version, signature] = sig.split(",");
    return { version, signature };
  });

  // Check if any v1 signature matches
  const isValid = signatures.some(({ version, signature }) => {
    if (version !== "v1") return false;
    try {
      const sigBuffer = Buffer.from(signature, "base64");
      const expectedBuffer = Buffer.from(expectedSignature, "base64");
      return sigBuffer.length === expectedBuffer.length &&
        timingSafeEqual(sigBuffer, expectedBuffer);
    } catch {
      return false;
    }
  });

  if (!isValid) {
    throw new Error("Invalid webhook signature");
  }

  return JSON.parse(payload) as WebhookEvent;
}

// Type guard for user events
export function isUserEvent(
  event: WebhookEvent
): event is WebhookEvent & { type: `user.${string}` } {
  return event.type.startsWith("user.");
}

// Type guard for session events
export function isSessionEvent(
  event: WebhookEvent
): event is WebhookEvent & { type: `session.${string}` } {
  return event.type.startsWith("session.");
}

// Type guard for organization events
export function isOrganizationEvent(
  event: WebhookEvent
): event is WebhookEvent & { type: `organization.${string}` } {
  return event.type.startsWith("organization.");
}

// Type guard for non-deleted user events (user.created, user.updated)
export function isUserDataEvent(
  event: WebhookEvent
): event is WebhookEvent & {
  type: "user.created" | "user.updated";
  data: {
    id: string;
    email_addresses: Array<{ id: string; email_address: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    phone_numbers: Array<{ id: string; phone_number: string }>;
    public_metadata: Record<string, unknown>;
    primary_email_address_id: string | null;
    primary_phone_number_id: string | null;
  };
} {
  return event.type === "user.created" || event.type === "user.updated";
}

// Extract user data from webhook event (only for created/updated events)
export function extractUserData(event: WebhookEvent) {
  if (!isUserDataEvent(event)) {
    throw new Error("Not a user.created or user.updated event");
  }

  const { id, email_addresses, first_name, last_name, image_url, phone_numbers, public_metadata } = event.data;

  const primaryEmail = email_addresses?.find((e) => e.id === event.data.primary_email_address_id);
  const primaryPhone = phone_numbers?.find((p) => p.id === event.data.primary_phone_number_id);

  return {
    clerkId: id,
    email: primaryEmail?.email_address ?? "",
    firstName: first_name ?? undefined,
    lastName: last_name ?? undefined,
    imageUrl: image_url ?? undefined,
    phone: primaryPhone?.phone_number ?? undefined,
    role: (public_metadata?.role as "user" | "admin" | "super_admin") ?? "user",
  };
}

// Extract deleted user ID from webhook event
export function extractDeletedUserId(event: WebhookEvent): string {
  if (event.type !== "user.deleted") {
    throw new Error("Not a user.deleted event");
  }
  return event.data.id as string;
}

// Webhook event types we handle
export type ClerkWebhookEventType =
  | "user.created"
  | "user.updated"
  | "user.deleted"
  | "session.created"
  | "session.ended"
  | "organization.created"
  | "organization.updated"
  | "organization.deleted"
  | "organizationMembership.created"
  | "organizationMembership.updated"
  | "organizationMembership.deleted";

// Handler type for webhook events
export type ClerkWebhookHandler = {
  [K in ClerkWebhookEventType]?: (event: WebhookEvent) => Promise<void>;
};

// Create webhook handler with typed handlers
export function createClerkWebhookHandler(handlers: ClerkWebhookHandler) {
  return async (event: WebhookEvent) => {
    const handler = handlers[event.type as ClerkWebhookEventType];
    if (handler) {
      await handler(event);
    }
  };
}
