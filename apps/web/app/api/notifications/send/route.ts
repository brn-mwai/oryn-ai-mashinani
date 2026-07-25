import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Notification type configurations
const NOTIFICATION_CONFIG: Record<string, {
  title: (data: any) => string;
  message: (data: any) => string;
  emailSubject: (data: any) => string;
  emailBody: (data: any) => string;
  priority: "low" | "normal" | "high" | "urgent";
}> = {
  payment_received: {
    title: (data) => "Payment Received",
    message: (data) => `You received a payment of $${data.amount?.toFixed(2) || "0.00"} from ${data.clientName || "a client"}.`,
    emailSubject: (data) => `Payment Received - $${data.amount?.toFixed(2) || "0.00"}`,
    emailBody: (data) => `
      <h2>Payment Received!</h2>
      <p>Great news! You've received a payment.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0; font-weight: bold;">$${data.amount?.toFixed(2) || "0.00"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">From:</td><td style="padding: 8px 0;">${data.clientName || "Client"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Claim:</td><td style="padding: 8px 0;">${data.claimTitle || "N/A"}</td></tr>
      </table>
      <p>The funds will be available in your wallet shortly.</p>
    `,
    priority: "normal",
  },
  claim_status_change: {
    title: (data) => "Claim Updated",
    message: (data) => `Claim "${data.claimTitle}" status changed to ${data.newStatus}.`,
    emailSubject: (data) => `Claim Status Update - ${data.claimTitle}`,
    emailBody: (data) => `
      <h2>Claim Status Updated</h2>
      <p>Your claim has been updated.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Claim:</td><td style="padding: 8px 0;">${data.claimTitle}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">New Status:</td><td style="padding: 8px 0; font-weight: bold;">${data.newStatus}</td></tr>
      </table>
    `,
    priority: "normal",
  },
  message_delivered: {
    title: (data) => "Message Delivered",
    message: (data) => `Your ${data.channel || "message"} to ${data.clientName || "the client"} was delivered.`,
    emailSubject: (data) => `Message Delivered to ${data.clientName}`,
    emailBody: (data) => `
      <h2>Message Delivered</h2>
      <p>Your message has been successfully delivered.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">To:</td><td style="padding: 8px 0;">${data.clientName}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Channel:</td><td style="padding: 8px 0;">${data.channel}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Sent:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
      </table>
    `,
    priority: "low",
  },
  message_failed: {
    title: (data) => "Message Failed",
    message: (data) => `Failed to send ${data.channel || "message"} to ${data.clientName || "the client"}. ${data.error || ""}`,
    emailSubject: (data) => `Message Delivery Failed - ${data.clientName}`,
    emailBody: (data) => `
      <h2>Message Delivery Failed</h2>
      <p>We were unable to deliver your message.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">To:</td><td style="padding: 8px 0;">${data.clientName}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Channel:</td><td style="padding: 8px 0;">${data.channel}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Error:</td><td style="padding: 8px 0; color: #dc2626;">${data.error || "Unknown error"}</td></tr>
      </table>
      <p>Please try again or use a different contact method.</p>
    `,
    priority: "high",
  },
  escalation: {
    title: (data) => "Claim Escalated",
    message: (data) => `Claim "${data.claimTitle}" has been escalated to level ${data.level}.`,
    emailSubject: (data) => `Claim Escalated - ${data.claimTitle}`,
    emailBody: (data) => `
      <h2>Claim Escalated</h2>
      <p>A claim has been escalated to a higher urgency level.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Claim:</td><td style="padding: 8px 0;">${data.claimTitle}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Client:</td><td style="padding: 8px 0;">${data.clientName}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">New Level:</td><td style="padding: 8px 0; font-weight: bold;">Level ${data.level}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0;">$${data.amount?.toFixed(2) || "0.00"}</td></tr>
      </table>
    `,
    priority: "high",
  },
  withdrawal_completed: {
    title: (data) => "Withdrawal Completed",
    message: (data) => `Your withdrawal of $${data.amount?.toFixed(2) || "0.00"} has been processed.`,
    emailSubject: (data) => `Withdrawal Completed - $${data.amount?.toFixed(2)}`,
    emailBody: (data) => `
      <h2>Withdrawal Completed</h2>
      <p>Your withdrawal has been successfully processed.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0; font-weight: bold;">$${data.amount?.toFixed(2) || "0.00"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Method:</td><td style="padding: 8px 0;">${data.method || "Bank Transfer"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Expected:</td><td style="padding: 8px 0;">1-3 business days</td></tr>
      </table>
    `,
    priority: "normal",
  },
  withdrawal_failed: {
    title: (data) => "Withdrawal Failed",
    message: (data) => `Your withdrawal of $${data.amount?.toFixed(2) || "0.00"} failed. ${data.error || ""}`,
    emailSubject: (data) => `Withdrawal Failed - $${data.amount?.toFixed(2)}`,
    emailBody: (data) => `
      <h2>Withdrawal Failed</h2>
      <p>We were unable to process your withdrawal.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Amount:</td><td style="padding: 8px 0;">$${data.amount?.toFixed(2) || "0.00"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Reason:</td><td style="padding: 8px 0; color: #dc2626;">${data.error || "Unknown error"}</td></tr>
      </table>
      <p>Please check your withdrawal details and try again.</p>
    `,
    priority: "urgent",
  },
  document_parsed: {
    title: (data) => "Document Processed",
    message: (data) => `Document "${data.documentName}" has been successfully processed.`,
    emailSubject: (data) => `Document Processed - ${data.documentName}`,
    emailBody: (data) => `
      <h2>Document Processed</h2>
      <p>Your document has been successfully analyzed.</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Document:</td><td style="padding: 8px 0;">${data.documentName}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Fields Extracted:</td><td style="padding: 8px 0;">${data.fieldsExtracted || "N/A"}</td></tr>
      </table>
    `,
    priority: "low",
  },
  security_alert: {
    title: (data) => "Security Alert",
    message: (data) => data.message || "A security event was detected on your account.",
    emailSubject: (data) => "Security Alert - Oryn",
    emailBody: (data) => `
      <h2 style="color: #dc2626;">Security Alert</h2>
      <p>${data.message || "A security event was detected on your account."}</p>
      <table style="margin: 20px 0; border-collapse: collapse;">
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Event:</td><td style="padding: 8px 0;">${data.event || "Unknown"}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">Time:</td><td style="padding: 8px 0;">${new Date().toLocaleString()}</td></tr>
        <tr><td style="padding: 8px 16px 8px 0; color: #666;">IP Address:</td><td style="padding: 8px 0;">${data.ip || "Unknown"}</td></tr>
      </table>
      <p>If this wasn't you, please secure your account immediately.</p>
    `,
    priority: "urgent",
  },
  system: {
    title: (data) => data.title || "System Notification",
    message: (data) => data.message || "You have a new system notification.",
    emailSubject: (data) => data.title || "Oryn Notification",
    emailBody: (data) => `
      <h2>${data.title || "System Notification"}</h2>
      <p>${data.message || "You have a new notification."}</p>
    `,
    priority: "normal",
  },
};

// Generate email HTML wrapper
function wrapEmailHtml(content: string, userName?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); padding: 20px; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Oryn</h1>
      </div>
      <div style="background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
        ${userName ? `<p style="color: #666;">Hi ${userName},</p>` : ""}
        ${content}
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">
          This email was sent by Oryn. You can manage your notification preferences in your
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color: #a855f7;">account settings</a>.
        </p>
      </div>
    </body>
    </html>
  `;
}

// Send notification (creates in-app + optionally sends email)
export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    const body = await request.json();
    const {
      userId, // Convex user ID (if internal call)
      type,
      data = {},
      sendEmail = true,
      link,
    } = body;

    // Validate notification type
    const config = NOTIFICATION_CONFIG[type];
    if (!config) {
      return NextResponse.json(
        { error: `Invalid notification type: ${type}` },
        { status: 400 }
      );
    }

    // Get user (either from auth or from provided userId)
    let convexUser;
    if (userId) {
      convexUser = await convex.query(api.users.get, { id: userId });
    } else if (clerkUserId) {
      convexUser = await convex.query(api.users.getByClerkId, { clerkId: clerkUserId });
    }

    if (!convexUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create in-app notification
    const notificationId = await convex.mutation(api.notifications.create, {
      userId: convexUser._id,
      type: type as any,
      title: config.title(data),
      message: config.message(data),
      priority: config.priority,
      link,
      claimId: data.claimId,
      paymentId: data.paymentId,
      messageId: data.messageId,
      documentId: data.documentId,
      transactionId: data.transactionId,
      metadata: data,
    });

    // Send email if enabled and user has email notifications on
    let emailSent = false;
    if (sendEmail && convexUser.email && convexUser.settings?.emailNotifications !== false) {
      try {
        // Dynamic import to avoid issues if Resend is not configured
        const { sendEmail: sendResendEmail } = await import("@oryn/notifications/email");

        await sendResendEmail({
          to: convexUser.email,
          subject: config.emailSubject(data),
          html: wrapEmailHtml(config.emailBody(data), convexUser.firstName),
        });

        emailSent = true;
      } catch (emailError) {
        console.error("Failed to send email notification:", emailError);
        // Don't fail the whole request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      notificationId,
      emailSent,
    });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
