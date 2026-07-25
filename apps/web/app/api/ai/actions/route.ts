import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { Resend } from "resend";
import {
  PaymentReminderEmail,
  PaymentReminderText,
  getPaymentReminderSubject,
} from "@oryn/notifications/email/templates";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const resend = new Resend(process.env.RESEND_API_KEY);
const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Oryn <notifications@oryn.cc>";

// ============================================================
// AGENT ACTION TYPES
// ============================================================

type ActionType =
  | "send_message"
  | "create_payment_link"
  | "escalate_claim"
  | "pause_claim"
  | "activate_claim"
  | "mark_collected"
  | "send_bulk_reminders"
  | "create_marathon";

interface ActionRequest {
  action: ActionType;
  params: Record<string, any>;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  actionId?: string;
}

// ============================================================
// EMAIL/MESSAGE GENERATION
// ============================================================

interface MessageTemplate {
  subject: string;
  content: string;
}

function generateReminderMessage(
  clientName: string,
  amount: number,
  claimTitle: string,
  dueDate: Date | null,
  escalationLevel: number,
  paymentLink: string,
  channel: "email" | "sms" | "whatsapp",
  userName: string
): MessageTemplate {
  const formattedAmount = `$${amount.toLocaleString()}`;
  const dueDateStr = dueDate ? dueDate.toLocaleDateString() : "immediately";

  // Email templates by escalation level
  if (channel === "email") {
    switch (escalationLevel) {
      case 0: // Friendly reminder
        return {
          subject: `Friendly Reminder: Invoice for ${claimTitle}`,
          content: `Dear ${clientName},

I hope this message finds you well. This is a friendly reminder about the outstanding invoice for "${claimTitle}" in the amount of ${formattedAmount}.

If you've already sent the payment, please disregard this message. Otherwise, you can conveniently pay online using the secure link below:

${paymentLink}

If you have any questions or need to discuss payment arrangements, please don't hesitate to reach out.

Best regards,
${userName}`,
        };

      case 1: // Firm reminder
        return {
          subject: `Payment Reminder: ${formattedAmount} Due for ${claimTitle}`,
          content: `Dear ${clientName},

I'm writing to follow up on the outstanding invoice for "${claimTitle}" in the amount of ${formattedAmount}, which was due on ${dueDateStr}.

Your prompt attention to this matter would be greatly appreciated. You can make a secure payment using the link below:

${paymentLink}

If there are any issues preventing payment, please let me know so we can discuss options.

Thank you for your attention to this matter.

Best regards,
${userName}`,
        };

      case 2: // Urgent
        return {
          subject: `URGENT: Payment Required - ${formattedAmount} Overdue`,
          content: `Dear ${clientName},

This is an urgent notice regarding your overdue payment for "${claimTitle}" in the amount of ${formattedAmount}.

This invoice is now significantly past due, and I must ask for your immediate attention to this matter. Continued non-payment may affect our business relationship and could result in additional collection measures.

Please make your payment immediately using the secure link below:

${paymentLink}

If you're experiencing difficulties, please contact me directly to discuss payment arrangements.

Regards,
${userName}`,
        };

      case 3: // Final notice
        return {
          subject: `FINAL NOTICE: ${formattedAmount} - Immediate Payment Required`,
          content: `Dear ${clientName},

FINAL NOTICE

Despite multiple previous reminders, the invoice for "${claimTitle}" in the amount of ${formattedAmount} remains unpaid.

This is your final notice before we escalate this matter. Please make your payment within the next 48 hours to avoid further action.

Payment link: ${paymentLink}

If you believe this notice has been sent in error, or if you need to arrange a payment plan, please contact me immediately.

${userName}`,
        };

      case 4: // Legal notice
        return {
          subject: `LEGAL NOTICE: Overdue Account - ${formattedAmount}`,
          content: `Dear ${clientName},

FORMAL DEMAND FOR PAYMENT

This letter serves as a formal demand for payment of the outstanding debt of ${formattedAmount} for "${claimTitle}".

Your account is seriously delinquent. If payment is not received within 7 days, we may be forced to pursue additional collection activities, which may include:
- Reporting to credit bureaus
- Engaging a collection agency
- Pursuing legal remedies

To resolve this matter and avoid further action, please make your payment immediately:

${paymentLink}

This is a serious matter requiring your immediate attention.

${userName}`,
        };

      default:
        return {
          subject: `Payment Reminder: ${claimTitle}`,
          content: `Dear ${clientName},

This is a reminder about your outstanding balance of ${formattedAmount} for "${claimTitle}".

Please pay at your earliest convenience: ${paymentLink}

Best regards,
${userName}`,
        };
    }
  }

  // SMS template (keep under 160 chars if possible)
  if (channel === "sms") {
    if (escalationLevel >= 3) {
      return {
        subject: "",
        content: `URGENT: ${formattedAmount} overdue for ${claimTitle}. Pay now to avoid escalation: ${paymentLink}`,
      };
    }
    return {
      subject: "",
      content: `Hi ${clientName}, reminder: ${formattedAmount} due for ${claimTitle}. Pay easily here: ${paymentLink}`,
    };
  }

  // WhatsApp template
  if (channel === "whatsapp") {
    if (escalationLevel >= 2) {
      return {
        subject: "",
        content: `Hi ${clientName},

This is an urgent reminder about your outstanding payment of ${formattedAmount} for "${claimTitle}".

Please settle this as soon as possible to avoid any issues.

Pay here: ${paymentLink}

Thank you!`,
      };
    }
    return {
      subject: "",
      content: `Hi ${clientName}! 👋

Quick reminder about your invoice of ${formattedAmount} for "${claimTitle}".

Pay easily here: ${paymentLink}

Let me know if you have any questions!`,
    };
  }

  return { subject: "", content: "" };
}

// ============================================================
// ACTION HANDLERS
// ============================================================

async function handleSendMessage(
  params: any,
  userId: string,
  convexUserId: string
): Promise<ActionResult> {
  try {
    // Get claim and client details
    const claim = await convex.query(api.claims.get, { id: params.claimId });
    if (!claim) {
      return { success: false, message: "Claim not found" };
    }

    const client = await convex.query(api.clients.get, { id: claim.clientId });
    if (!client) {
      return { success: false, message: "Client not found" };
    }

    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });

    // Create payment link if not provided
    let paymentLink = params.paymentLink;
    if (!paymentLink) {
      const linkResult = await convex.mutation(api.paymentLinks.create, {
        claimId: params.claimId,
        userId: convexUserId as any,
        expiresIn: 7 * 24 * 60 * 60, // 7 days
      });
      paymentLink = `https://pay.oryn.cc/${linkResult.token}`;
    }

    // Calculate days overdue
    const now = Date.now();
    const daysOverdue = claim.dueDate
      ? Math.max(0, Math.floor((now - claim.dueDate) / (1000 * 60 * 60 * 24)))
      : 0;

    // Generate message content if not provided
    let content = params.content;
    let subject = params.subject;
    let htmlContent: string | undefined;

    if (!content) {
      const template = generateReminderMessage(
        client.name,
        claim.amount - claim.amountPaid,
        claim.title,
        claim.dueDate ? new Date(claim.dueDate) : null,
        claim.escalationLevel,
        paymentLink,
        params.channel,
        user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "The Team"
      );
      content = template.content;
      subject = template.subject;

      // For email, also generate beautiful HTML template
      if (params.channel === "email") {
        subject = getPaymentReminderSubject(
          claim.escalationLevel,
          claim.title,
          claim.amount - claim.amountPaid,
          claim.currency
        );
        htmlContent = PaymentReminderEmail({
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
        content = PaymentReminderText({
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
      }
    }

    // Send via appropriate channel
    let resendId: string | undefined;
    let status: "sent" | "queued" | "failed" = "queued";

    if (params.channel === "email") {
      // Send email via Resend
      if (!client.email) {
        return { success: false, message: "Client has no email address" };
      }

      if (process.env.RESEND_API_KEY) {
        try {
          const { data, error } = await resend.emails.send({
            from: DEFAULT_FROM_EMAIL,
            to: client.email,
            subject: subject || "Payment Reminder",
            html: htmlContent || `<p>${content.replace(/\n/g, "<br>")}</p>`,
            text: content,
            tags: [
              { name: "type", value: "payment_reminder" },
              { name: "claim_id", value: params.claimId },
              { name: "escalation_level", value: String(claim.escalationLevel) },
              { name: "source", value: "agent_action" },
            ],
          });

          if (error) {
            console.error("Resend error:", error);
            status = "failed";
          } else {
            resendId = data?.id;
            status = "sent";
          }
        } catch (emailError: any) {
          console.error("Email send error:", emailError);
          status = "failed";
        }
      }
    }
    // For SMS and WhatsApp, still queue (would integrate Twilio in future)

    // Create message record in database
    const messageId = await convex.mutation(api.messages.create, {
      claimId: params.claimId,
      userId: convexUserId as any,
      clientId: claim.clientId,
      channel: params.channel,
      direction: "outbound",
      content,
      subject,
      status,
      resendId,
    });

    const statusMessage = status === "sent"
      ? `Email sent successfully to ${client.email}`
      : status === "failed"
      ? `Failed to send email, message queued for retry`
      : `Message queued for delivery via ${params.channel} to ${client.name}`;

    return {
      success: status !== "failed",
      message: statusMessage,
      data: {
        messageId,
        channel: params.channel,
        recipient: params.channel === "email" ? client.email : client.phone,
        status,
        resendId,
        preview: content.substring(0, 100) + "...",
      },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to send message: ${error.message}` };
  }
}

async function handleCreatePaymentLink(
  params: any,
  convexUserId: string
): Promise<ActionResult> {
  try {
    const result = await convex.mutation(api.paymentLinks.create, {
      claimId: params.claimId,
      userId: convexUserId as any,
      expiresIn: (params.expiresInDays || 7) * 24 * 60 * 60,
      methods: params.methods || ["card", "bank_transfer", "usdc"],
    });

    const url = `https://pay.oryn.cc/${result.token}`;

    return {
      success: true,
      message: "Payment link created successfully",
      data: {
        token: result.token,
        url,
        expiresIn: params.expiresInDays || 7,
        methods: params.methods || ["card", "bank_transfer", "usdc"],
      },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to create payment link: ${error.message}` };
  }
}

async function handleEscalateClaim(params: any): Promise<ActionResult> {
  try {
    const claim = await convex.query(api.claims.get, { id: params.claimId });
    if (!claim) {
      return { success: false, message: "Claim not found" };
    }

    if (claim.escalationLevel >= 4) {
      return { success: false, message: "Claim is already at maximum escalation level" };
    }

    const newLevel = await convex.mutation(api.claims.escalate, {
      id: params.claimId,
    });

    return {
      success: true,
      message: `Claim escalated from level ${claim.escalationLevel} to level ${newLevel}`,
      data: {
        previousLevel: claim.escalationLevel,
        newLevel,
        claimTitle: claim.title,
      },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to escalate claim: ${error.message}` };
  }
}

async function handlePauseClaim(params: any): Promise<ActionResult> {
  try {
    await convex.mutation(api.claims.pause, { id: params.claimId });

    return {
      success: true,
      message: "Claim paused - collection activities stopped",
    };
  } catch (error: any) {
    return { success: false, message: `Failed to pause claim: ${error.message}` };
  }
}

async function handleActivateClaim(params: any): Promise<ActionResult> {
  try {
    await convex.mutation(api.claims.activate, { id: params.claimId });

    return {
      success: true,
      message: "Claim activated - collection started",
    };
  } catch (error: any) {
    return { success: false, message: `Failed to activate claim: ${error.message}` };
  }
}

async function handleMarkCollected(params: any): Promise<ActionResult> {
  try {
    await convex.mutation(api.claims.markCollected, { id: params.claimId });

    return {
      success: true,
      message: "Claim marked as collected",
    };
  } catch (error: any) {
    return { success: false, message: `Failed to mark claim as collected: ${error.message}` };
  }
}

async function handleBulkReminders(
  params: any,
  userId: string,
  convexUserId: string
): Promise<ActionResult> {
  try {
    // Get overdue claims
    const claimsResult = await convex.query(api.claims.list, {
      userId: convexUserId as any,
      status: "active",
      limit: 50,
    });

    const now = Date.now();
    const overdueClaims = (claimsResult?.data || []).filter(
      (c: any) => c.dueDate && c.dueDate < now
    );

    if (overdueClaims.length === 0) {
      return {
        success: true,
        message: "No overdue claims found",
        data: { sent: 0 },
      };
    }

    const results: any[] = [];
    const channel = params.channel || "email";

    for (const claim of overdueClaims.slice(0, params.limit || 10)) {
      const result = await handleSendMessage(
        {
          claimId: claim._id,
          channel,
        },
        userId,
        convexUserId
      );
      results.push({ claimId: claim._id, ...result });
    }

    const successful = results.filter((r) => r.success).length;

    return {
      success: true,
      message: `Sent ${successful} reminders out of ${results.length} overdue claims`,
      data: {
        total: results.length,
        successful,
        failed: results.length - successful,
        details: results,
      },
    };
  } catch (error: any) {
    return { success: false, message: `Failed to send bulk reminders: ${error.message}` };
  }
}

// ============================================================
// MAIN API HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: ActionRequest = await request.json();
    const { action, params } = body;

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    // Get Convex user ID
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let result: ActionResult;

    switch (action) {
      case "send_message":
        result = await handleSendMessage(params, userId, user._id);
        break;

      case "create_payment_link":
        result = await handleCreatePaymentLink(params, user._id);
        break;

      case "escalate_claim":
        result = await handleEscalateClaim(params);
        break;

      case "pause_claim":
        result = await handlePauseClaim(params);
        break;

      case "activate_claim":
        result = await handleActivateClaim(params);
        break;

      case "mark_collected":
        result = await handleMarkCollected(params);
        break;

      case "send_bulk_reminders":
        result = await handleBulkReminders(params, userId, user._id);
        break;

      default:
        result = { success: false, message: `Unknown action: ${action}` };
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Agent action error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to list available actions
export async function GET() {
  const actions = [
    {
      id: "send_message",
      name: "Send Message",
      description: "Send an email, SMS, or WhatsApp message to a client",
      params: {
        claimId: "ID of the claim (required)",
        channel: "email | sms | whatsapp (required)",
        content: "Message content (optional, auto-generated if not provided)",
        subject: "Email subject (optional, for email only)",
      },
    },
    {
      id: "create_payment_link",
      name: "Create Payment Link",
      description: "Generate a secure payment link for a claim",
      params: {
        claimId: "ID of the claim (required)",
        expiresInDays: "Days until expiration (default: 7)",
        methods: "Array of payment methods to enable",
      },
    },
    {
      id: "escalate_claim",
      name: "Escalate Claim",
      description: "Increase the escalation level of a claim",
      params: {
        claimId: "ID of the claim (required)",
      },
    },
    {
      id: "pause_claim",
      name: "Pause Claim",
      description: "Pause collection activities on a claim",
      params: {
        claimId: "ID of the claim (required)",
      },
    },
    {
      id: "activate_claim",
      name: "Activate Claim",
      description: "Start collection on a claim",
      params: {
        claimId: "ID of the claim (required)",
      },
    },
    {
      id: "send_bulk_reminders",
      name: "Send Bulk Reminders",
      description: "Send reminders to all overdue claims",
      params: {
        channel: "email | sms | whatsapp (default: email)",
        limit: "Maximum number of reminders to send (default: 10)",
      },
    },
  ];

  return NextResponse.json({ actions });
}
