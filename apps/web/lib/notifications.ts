/**
 * Notification helper utilities
 * Use these to send notifications from anywhere in the app
 */

export type NotificationType =
  | "payment_received"
  | "claim_status_change"
  | "message_delivered"
  | "message_read"
  | "message_failed"
  | "message_received"
  | "escalation"
  | "document_parsed"
  | "document_failed"
  | "withdrawal_completed"
  | "withdrawal_failed"
  | "kyc_update"
  | "security_alert"
  | "referral_signup"
  | "referral_reward"
  | "system";

export interface NotificationData {
  // Common fields
  amount?: number;
  clientName?: string;
  claimTitle?: string;

  // Message fields
  channel?: string;
  error?: string;

  // Claim fields
  claimId?: string;
  newStatus?: string;
  level?: number;

  // Document fields
  documentId?: string;
  documentName?: string;
  fieldsExtracted?: number;

  // Payment fields
  paymentId?: string;

  // Message fields
  messageId?: string;

  // Transaction fields
  transactionId?: string;

  // Withdrawal fields
  method?: string;

  // Security fields
  event?: string;
  ip?: string;
  message?: string;

  // System fields
  title?: string;

  // Allow any additional data
  [key: string]: any;
}

export interface SendNotificationOptions {
  userId: string; // Convex user ID
  type: NotificationType;
  data?: NotificationData;
  sendEmail?: boolean;
  link?: string;
}

/**
 * Send a notification to a user
 * Creates an in-app notification and optionally sends an email
 */
export async function sendNotification(options: SendNotificationOptions): Promise<{
  success: boolean;
  notificationId?: string;
  emailSent?: boolean;
  error?: string;
}> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const response = await fetch(`${baseUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: options.userId,
        type: options.type,
        data: options.data || {},
        sendEmail: options.sendEmail ?? true,
        link: options.link,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      notificationId: result.notificationId,
      emailSent: result.emailSent,
    };
  } catch (error) {
    console.error("Failed to send notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Helper functions for common notification types
 */
export const notify = {
  paymentReceived: (userId: string, data: { amount: number; clientName: string; claimTitle?: string; claimId?: string; paymentId?: string }) =>
    sendNotification({
      userId,
      type: "payment_received",
      data,
      link: data.claimId ? `/dashboard/claims/${data.claimId}` : "/dashboard/payments",
    }),

  messageDelivered: (userId: string, data: { clientName: string; channel: string; messageId?: string; claimId?: string }) =>
    sendNotification({
      userId,
      type: "message_delivered",
      data,
      sendEmail: false, // Don't email for every message delivery
    }),

  messageFailed: (userId: string, data: { clientName: string; channel: string; error?: string; messageId?: string }) =>
    sendNotification({
      userId,
      type: "message_failed",
      data,
      link: "/dashboard/messages",
    }),

  claimEscalated: (userId: string, data: { claimTitle: string; clientName: string; level: number; amount?: number; claimId?: string }) =>
    sendNotification({
      userId,
      type: "escalation",
      data,
      link: data.claimId ? `/dashboard/claims/${data.claimId}` : "/dashboard/claims",
    }),

  claimStatusChanged: (userId: string, data: { claimTitle: string; newStatus: string; claimId?: string }) =>
    sendNotification({
      userId,
      type: "claim_status_change",
      data,
      link: data.claimId ? `/dashboard/claims/${data.claimId}` : "/dashboard/claims",
    }),

  withdrawalCompleted: (userId: string, data: { amount: number; method?: string; transactionId?: string }) =>
    sendNotification({
      userId,
      type: "withdrawal_completed",
      data,
      link: "/dashboard/wallet",
    }),

  withdrawalFailed: (userId: string, data: { amount: number; error?: string; transactionId?: string }) =>
    sendNotification({
      userId,
      type: "withdrawal_failed",
      data,
      link: "/dashboard/wallet",
    }),

  documentParsed: (userId: string, data: { documentName: string; fieldsExtracted?: number; documentId?: string }) =>
    sendNotification({
      userId,
      type: "document_parsed",
      data,
      sendEmail: false, // Don't email for document parsing
    }),

  documentFailed: (userId: string, data: { documentName: string; error?: string; documentId?: string }) =>
    sendNotification({
      userId,
      type: "document_failed",
      data,
      link: "/dashboard/documents",
    }),

  securityAlert: (userId: string, data: { message: string; event?: string; ip?: string }) =>
    sendNotification({
      userId,
      type: "security_alert",
      data,
      link: "/dashboard/settings",
    }),

  system: (userId: string, data: { title: string; message: string; link?: string }) =>
    sendNotification({
      userId,
      type: "system",
      data,
      link: data.link,
    }),
};
