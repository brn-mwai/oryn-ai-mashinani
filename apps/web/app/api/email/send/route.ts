import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { Resend } from "resend";
import {
  PaymentReminderEmail,
  PaymentReminderText,
  getPaymentReminderSubject,
  PaymentReceivedEmail,
  PaymentReceivedText,
  getPaymentReceivedSubject,
} from "@oryn/notifications/email/templates";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);

const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Oryn <notifications@oryn.cc>";

// ============================================================
// TYPES
// ============================================================

interface SendEmailRequest {
  type: "payment_reminder" | "payment_received" | "custom";
  claimId?: string;
  clientId?: string;
  to?: string;
  subject?: string;
  content?: string;
  htmlContent?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  recipient?: string;
}

// ============================================================
// EMAIL SENDING FUNCTIONS
// ============================================================

async function sendPaymentReminder(
  claimId: string,
  userId: string,
  convexUserId: string
): Promise<EmailResult> {
  try {
    // Fetch claim data
    const claim = await convex.query(api.claims.get, { id: claimId as any });
    if (!claim) {
      return { success: false, error: "Claim not found" };
    }

    // Fetch client data
    const client = await convex.query(api.clients.get, { id: claim.clientId });
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    if (!client.email) {
      return { success: false, error: "Client has no email address" };
    }

    // Fetch user data
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });

    // Create payment link
    const linkResult = await convex.mutation(api.paymentLinks.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });
    const paymentLinkBase = process.env.NEXT_PUBLIC_PAY_URL || "https://pay.oryn.cc";
    const paymentLink = `${paymentLinkBase}/${linkResult.token}`;

    // Calculate days overdue
    const now = Date.now();
    const daysOverdue = claim.dueDate
      ? Math.max(0, Math.floor((now - claim.dueDate) / (1000 * 60 * 60 * 24)))
      : 0;

    // Generate email content
    const subject = getPaymentReminderSubject(
      claim.escalationLevel,
      claim.title,
      claim.amount - claim.amountPaid,
      claim.currency
    );

    const htmlContent = PaymentReminderEmail({
      clientName: client.name,
      amount: claim.amount - claim.amountPaid,
      currency: claim.currency,
      claimTitle: claim.title,
      dueDate: claim.dueDate ? new Date(claim.dueDate).toLocaleDateString() : null,
      daysOverdue,
      escalationLevel: claim.escalationLevel,
      paymentLink,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "The Team",
      companyName: "Oryn",
    });

    const textContent = PaymentReminderText({
      clientName: client.name,
      amount: claim.amount - claim.amountPaid,
      currency: claim.currency,
      claimTitle: claim.title,
      dueDate: claim.dueDate ? new Date(claim.dueDate).toLocaleDateString() : null,
      daysOverdue,
      escalationLevel: claim.escalationLevel,
      paymentLink,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "The Team",
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: client.email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: "type", value: "payment_reminder" },
        { name: "claim_id", value: claimId },
        { name: "escalation_level", value: String(claim.escalationLevel) },
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Create message record in database
    await convex.mutation(api.messages.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      clientId: claim.clientId,
      channel: "email",
      direction: "outbound",
      content: textContent,
      subject,
      status: "sent",
      resendId: data?.id,
    });

    // Update claim reminder count
    const currentClaim = await convex.query(api.claims.get, { id: claimId as any });
    if (currentClaim) {
      await convex.mutation(api.claims.update, {
        id: claimId as any,
        // Note: reminderCount field would need to be added to the mutation
      });
    }

    return {
      success: true,
      messageId: data?.id,
      recipient: client.email,
    };
  } catch (error: any) {
    console.error("Error sending payment reminder:", error);
    return { success: false, error: error.message };
  }
}

async function sendPaymentReceived(
  claimId: string,
  userId: string,
  convexUserId: string,
  paymentDetails: {
    amount: number;
    method: string;
    transactionId?: string;
  }
): Promise<EmailResult> {
  try {
    // Fetch claim data
    const claim = await convex.query(api.claims.get, { id: claimId as any });
    if (!claim) {
      return { success: false, error: "Claim not found" };
    }

    // Fetch client data
    const client = await convex.query(api.clients.get, { id: claim.clientId });
    if (!client) {
      return { success: false, error: "Client not found" };
    }

    if (!client.email) {
      return { success: false, error: "Client has no email address" };
    }

    // Fetch user data
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });

    const subject = getPaymentReceivedSubject(paymentDetails.amount, claim.currency);

    const htmlContent = PaymentReceivedEmail({
      clientName: client.name,
      amount: paymentDetails.amount,
      currency: claim.currency,
      claimTitle: claim.title,
      paymentMethod: paymentDetails.method,
      transactionId: paymentDetails.transactionId,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "The Team",
      companyName: "Oryn",
    });

    const textContent = PaymentReceivedText({
      clientName: client.name,
      amount: paymentDetails.amount,
      currency: claim.currency,
      claimTitle: claim.title,
      paymentMethod: paymentDetails.method,
      transactionId: paymentDetails.transactionId,
      senderName: user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "The Team",
    });

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to: client.email,
      subject,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: "type", value: "payment_received" },
        { name: "claim_id", value: claimId },
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Create message record in database
    await convex.mutation(api.messages.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      clientId: claim.clientId,
      channel: "email",
      direction: "outbound",
      content: textContent,
      subject,
      status: "sent",
      resendId: data?.id,
    });

    return {
      success: true,
      messageId: data?.id,
      recipient: client.email,
    };
  } catch (error: any) {
    console.error("Error sending payment received email:", error);
    return { success: false, error: error.message };
  }
}

async function sendCustomEmail(
  to: string,
  subject: string,
  content: string,
  htmlContent: string | undefined,
  claimId: string | undefined,
  convexUserId: string
): Promise<EmailResult> {
  try {
    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: DEFAULT_FROM_EMAIL,
      to,
      subject,
      html: htmlContent || `<p>${content.replace(/\n/g, "<br>")}</p>`,
      text: content,
      tags: [
        { name: "type", value: "custom" },
        ...(claimId ? [{ name: "claim_id", value: claimId }] : []),
      ],
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // If we have a claim, create message record
    if (claimId) {
      const claim = await convex.query(api.claims.get, { id: claimId as any });
      if (claim) {
        await convex.mutation(api.messages.create, {
          claimId: claimId as any,
          userId: convexUserId as any,
          clientId: claim.clientId,
          channel: "email",
          direction: "outbound",
          content,
          subject,
          status: "sent",
          resendId: data?.id,
        });
      }
    }

    return {
      success: true,
      messageId: data?.id,
      recipient: to,
    };
  } catch (error: any) {
    console.error("Error sending custom email:", error);
    return { success: false, error: error.message };
  }
}

// ============================================================
// API HANDLERS
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify Resend is configured
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Get Convex user
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: SendEmailRequest = await request.json();
    let result: EmailResult;

    switch (body.type) {
      case "payment_reminder":
        if (!body.claimId) {
          return NextResponse.json(
            { error: "claimId is required for payment reminder" },
            { status: 400 }
          );
        }
        result = await sendPaymentReminder(body.claimId, userId, user._id);
        break;

      case "payment_received":
        if (!body.claimId) {
          return NextResponse.json(
            { error: "claimId is required for payment received email" },
            { status: 400 }
          );
        }
        // Would need additional payment details passed in
        result = await sendPaymentReceived(body.claimId, userId, user._id, {
          amount: 0, // Would come from payment record
          method: "Card",
        });
        break;

      case "custom":
        if (!body.to || !body.subject || !body.content) {
          return NextResponse.json(
            { error: "to, subject, and content are required for custom email" },
            { status: 400 }
          );
        }
        result = await sendCustomEmail(
          body.to,
          body.subject,
          body.content,
          body.htmlContent,
          body.claimId,
          user._id
        );
        break;

      default:
        return NextResponse.json(
          { error: "Invalid email type" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      recipient: result.recipient,
    });
  } catch (error: any) {
    console.error("Email API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List email templates and capabilities
export async function GET() {
  return NextResponse.json({
    configured: !!process.env.RESEND_API_KEY,
    templates: [
      {
        type: "payment_reminder",
        name: "Payment Reminder",
        description: "Send a payment reminder to a client based on claim escalation level",
        requiredParams: ["claimId"],
        features: [
          "Auto-generates payment link",
          "Escalation-aware tone (friendly to legal)",
          "Beautiful HTML template",
          "Plain text fallback",
        ],
      },
      {
        type: "payment_received",
        name: "Payment Received",
        description: "Send a payment confirmation/receipt to a client",
        requiredParams: ["claimId"],
        features: [
          "Professional receipt format",
          "Payment details included",
          "Transaction ID support",
        ],
      },
      {
        type: "custom",
        name: "Custom Email",
        description: "Send a custom email with your own content",
        requiredParams: ["to", "subject", "content"],
        features: [
          "Full control over content",
          "Optional HTML content",
          "Links to claim if provided",
        ],
      },
    ],
    useCases: [
      {
        name: "Automated Collection Reminders",
        description: "AI agent sends payment reminders at optimal intervals",
      },
      {
        name: "Escalation Notifications",
        description: "Automatic emails when claims are escalated",
      },
      {
        name: "Payment Confirmations",
        description: "Instant receipts when payments are received",
      },
      {
        name: "Bulk Campaigns",
        description: "Send reminders to all overdue claims at once",
      },
      {
        name: "Custom Outreach",
        description: "Manual emails for special situations",
      },
    ],
  });
}
