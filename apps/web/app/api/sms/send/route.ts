import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { sendSms, validatePhoneNumber } from "@oryn/notifications/sms";
import { isTwilioConfigured } from "@oryn/notifications/sms/client";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// ============================================================
// TYPES
// ============================================================

interface SendSmsRequest {
  type: "payment_reminder" | "payment_confirmation" | "custom";
  claimId?: string;
  clientId?: string;
  to?: string;
  message?: string;
}

interface SmsResult {
  success: boolean;
  sid?: string;
  error?: string;
  recipient?: string;
}

// ============================================================
// SMS TEMPLATES
// ============================================================

function getPaymentReminderSms(
  clientName: string,
  amount: number,
  currency: string,
  claimTitle: string,
  escalationLevel: number,
  paymentLink: string
): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;

  switch (escalationLevel) {
    case 0:
      return `Hi ${clientName}, just a friendly reminder about your payment of ${formattedAmount} for "${claimTitle}". Pay easily here: ${paymentLink}`;
    case 1:
      return `Hi ${clientName}, your payment of ${formattedAmount} for "${claimTitle}" is due. Please pay at: ${paymentLink}`;
    case 2:
      return `URGENT: ${clientName}, your payment of ${formattedAmount} is overdue. Pay now: ${paymentLink}`;
    case 3:
      return `FINAL NOTICE: ${clientName}, ${formattedAmount} remains unpaid. Action required within 48hrs: ${paymentLink}`;
    case 4:
      return `FORMAL NOTICE: ${clientName}, ${formattedAmount} is delinquent. Pay immediately to avoid further action: ${paymentLink}`;
    default:
      return `Hi ${clientName}, please pay ${formattedAmount} for "${claimTitle}": ${paymentLink}`;
  }
}

function getPaymentConfirmationSms(
  clientName: string,
  amount: number,
  currency: string,
  claimTitle: string
): string {
  const formattedAmount = `${currency} ${amount.toLocaleString()}`;
  return `Thank you ${clientName}! We've received your payment of ${formattedAmount} for "${claimTitle}". Receipt sent to your email.`;
}

// ============================================================
// SMS SENDING FUNCTIONS
// ============================================================

async function sendPaymentReminderSms(
  claimId: string,
  userId: string,
  convexUserId: string
): Promise<SmsResult> {
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

    if (!client.phone) {
      return { success: false, error: "Client has no phone number" };
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(client.phone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error || "Invalid phone number" };
    }

    // Create payment link
    const linkResult = await convex.mutation(api.paymentLinks.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      expiresIn: 7 * 24 * 60 * 60, // 7 days
    });
    const paymentLinkBase = process.env.NEXT_PUBLIC_PAY_URL || "https://pay.oryn.cc";
    const paymentLink = `${paymentLinkBase}/${linkResult.token}`;

    // Generate SMS content
    const amountDue = claim.amount - claim.amountPaid;
    const message = getPaymentReminderSms(
      client.name,
      amountDue,
      claim.currency,
      claim.title,
      claim.escalationLevel,
      paymentLink
    );

    // Send SMS
    const result = await sendSms({
      to: phoneValidation.formatted!,
      body: message,
      metadata: {
        claimId,
        userId: convexUserId,
        clientId: client._id,
      },
    });

    // Create message record in database
    await convex.mutation(api.messages.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      clientId: claim.clientId,
      channel: "sms",
      direction: "outbound",
      content: message,
      status: "sent",
      twilioSid: result.sid,
    });

    return {
      success: true,
      sid: result.sid,
      recipient: phoneValidation.formatted,
    };
  } catch (error: any) {
    console.error("Error sending payment reminder SMS:", error);
    return { success: false, error: error.message };
  }
}

async function sendPaymentConfirmationSms(
  claimId: string,
  userId: string,
  convexUserId: string,
  amount: number
): Promise<SmsResult> {
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

    if (!client.phone) {
      return { success: false, error: "Client has no phone number" };
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(client.phone);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error || "Invalid phone number" };
    }

    // Generate SMS content
    const message = getPaymentConfirmationSms(
      client.name,
      amount,
      claim.currency,
      claim.title
    );

    // Send SMS
    const result = await sendSms({
      to: phoneValidation.formatted!,
      body: message,
      metadata: {
        claimId,
        userId: convexUserId,
        clientId: client._id,
      },
    });

    // Create message record in database
    await convex.mutation(api.messages.create, {
      claimId: claimId as any,
      userId: convexUserId as any,
      clientId: claim.clientId,
      channel: "sms",
      direction: "outbound",
      content: message,
      status: "sent",
      twilioSid: result.sid,
    });

    return {
      success: true,
      sid: result.sid,
      recipient: phoneValidation.formatted,
    };
  } catch (error: any) {
    console.error("Error sending payment confirmation SMS:", error);
    return { success: false, error: error.message };
  }
}

async function sendCustomSms(
  to: string,
  message: string,
  claimId: string | undefined,
  convexUserId: string
): Promise<SmsResult> {
  try {
    // Validate phone number
    const phoneValidation = validatePhoneNumber(to);
    if (!phoneValidation.valid) {
      return { success: false, error: phoneValidation.error || "Invalid phone number" };
    }

    // Send SMS
    const result = await sendSms({
      to: phoneValidation.formatted!,
      body: message,
      metadata: {
        claimId,
        userId: convexUserId,
      },
    });

    // If we have a claim, create message record
    if (claimId) {
      const claim = await convex.query(api.claims.get, { id: claimId as any });
      if (claim) {
        await convex.mutation(api.messages.create, {
          claimId: claimId as any,
          userId: convexUserId as any,
          clientId: claim.clientId,
          channel: "sms",
          direction: "outbound",
          content: message,
          status: "sent",
          twilioSid: result.sid,
        });
      }
    }

    return {
      success: true,
      sid: result.sid,
      recipient: phoneValidation.formatted,
    };
  } catch (error: any) {
    console.error("Error sending custom SMS:", error);
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

    // Verify Twilio is configured
    if (!isTwilioConfigured()) {
      return NextResponse.json(
        { error: "SMS service not configured" },
        { status: 500 }
      );
    }

    // Get Convex user
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body: SendSmsRequest = await request.json();
    let result: SmsResult;

    switch (body.type) {
      case "payment_reminder":
        if (!body.claimId) {
          return NextResponse.json(
            { error: "claimId is required for payment reminder" },
            { status: 400 }
          );
        }
        result = await sendPaymentReminderSms(body.claimId, userId, user._id);
        break;

      case "payment_confirmation":
        if (!body.claimId) {
          return NextResponse.json(
            { error: "claimId is required for payment confirmation" },
            { status: 400 }
          );
        }
        result = await sendPaymentConfirmationSms(body.claimId, userId, user._id, 0);
        break;

      case "custom":
        if (!body.to || !body.message) {
          return NextResponse.json(
            { error: "to and message are required for custom SMS" },
            { status: 400 }
          );
        }
        result = await sendCustomSms(body.to, body.message, body.claimId, user._id);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid SMS type" },
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
      sid: result.sid,
      recipient: result.recipient,
    });
  } catch (error: any) {
    console.error("SMS API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - List SMS capabilities
export async function GET() {
  return NextResponse.json({
    configured: isTwilioConfigured(),
    templates: [
      {
        type: "payment_reminder",
        name: "Payment Reminder",
        description: "Send a payment reminder SMS with payment link to client",
        requiredParams: ["claimId"],
        features: [
          "Auto-generates payment link",
          "Escalation-aware tone",
          "Character-optimized for SMS",
        ],
      },
      {
        type: "payment_confirmation",
        name: "Payment Confirmation",
        description: "Send a payment receipt confirmation via SMS",
        requiredParams: ["claimId"],
        features: [
          "Thank you message",
          "Amount confirmation",
        ],
      },
      {
        type: "custom",
        name: "Custom SMS",
        description: "Send a custom SMS message",
        requiredParams: ["to", "message"],
        features: [
          "Full control over content",
          "160 character optimization",
        ],
      },
    ],
  });
}
