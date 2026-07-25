import crypto from "crypto";
import { CircleChain } from "./client";
import { TransferState } from "./transfers";

// Circle webhook event types
export type CircleWebhookEventType =
  | "wallets.created"
  | "wallets.updated"
  | "transfers.created"
  | "transfers.complete"
  | "transfers.failed";

export interface CircleWebhookEvent {
  subscriptionId: string;
  notificationId: string;
  notificationType: CircleWebhookEventType;
  notification: {
    id: string;
    state: string;
    blockchain?: CircleChain;
    address?: string;
    destinationAddress?: string;
    amounts?: string[];
    transactionHash?: string;
    userId?: string;
    createDate: string;
    updateDate: string;
  };
}

// Verify Circle webhook signature
export function verifyCircleWebhook(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret ?? process.env.CIRCLE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("CIRCLE_WEBHOOK_SECRET not configured, skipping verification");
    return true; // In development, allow without verification
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Parse Circle webhook payload
export function parseCircleWebhook(payload: string): CircleWebhookEvent {
  return JSON.parse(payload) as CircleWebhookEvent;
}

// Handler type for webhook events
export type CircleWebhookHandler = {
  [K in CircleWebhookEventType]?: (event: CircleWebhookEvent) => Promise<void>;
};

// Create webhook handler with typed handlers
export function createCircleWebhookHandler(handlers: CircleWebhookHandler) {
  return async (event: CircleWebhookEvent) => {
    const handler = handlers[event.notificationType];
    if (handler) {
      await handler(event);
    }
  };
}

// Extract transfer info from webhook
export function extractTransferInfo(event: CircleWebhookEvent): {
  transferId: string;
  state: TransferState;
  destinationAddress?: string;
  amount?: number;
  transactionHash?: string;
  blockchain?: CircleChain;
} | null {
  if (
    event.notificationType !== "transfers.complete" &&
    event.notificationType !== "transfers.failed" &&
    event.notificationType !== "transfers.created"
  ) {
    return null;
  }

  const { notification } = event;
  const amount = notification.amounts?.[0]
    ? parseFloat(notification.amounts[0])
    : undefined;

  return {
    transferId: notification.id,
    state: notification.state as TransferState,
    destinationAddress: notification.destinationAddress,
    amount,
    transactionHash: notification.transactionHash,
    blockchain: notification.blockchain,
  };
}

// Extract wallet info from webhook
export function extractWalletInfo(event: CircleWebhookEvent): {
  walletId: string;
  address?: string;
  blockchain?: CircleChain;
  userId?: string;
} | null {
  if (
    event.notificationType !== "wallets.created" &&
    event.notificationType !== "wallets.updated"
  ) {
    return null;
  }

  return {
    walletId: event.notification.id,
    address: event.notification.address,
    blockchain: event.notification.blockchain,
    userId: event.notification.userId,
  };
}
