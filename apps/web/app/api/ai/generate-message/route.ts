import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequired, validateEnum, validationErrorResponse } from "@/lib/validation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const VALID_CHANNELS = ["email", "sms", "whatsapp"] as const;
const VALID_TONES = ["friendly", "professional", "firm", "urgent"] as const;

// Generate an AI-powered message
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting
    const rateLimit = checkRateLimit(`ai:${userId}`, RATE_LIMITS.ai);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await request.json();
    const { claimId, channel, tone, includePaymentLink, customInstructions } = body;

    // Input validation
    const validation = validateRequired(body, ["claimId", "channel"]);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const channelError = validateEnum(channel, "channel", VALID_CHANNELS);
    if (channelError) {
      return validationErrorResponse([channelError]);
    }

    if (tone) {
      const toneError = validateEnum(tone, "tone", VALID_TONES);
      if (toneError) {
        return validationErrorResponse([toneError]);
      }
    }

    // Get the Convex user
    const convexUser = await convex.query(api.users.getByClerkId, {
      clerkId: userId,
    });

    if (!convexUser) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    // Get the claim
    const claim = await convex.query(api.claims.get, {
      id: claimId,
    });

    if (!claim) {
      return NextResponse.json(
        { error: "Claim not found" },
        { status: 404 }
      );
    }

    if (claim.userId !== convexUser._id) {
      return NextResponse.json(
        { error: "Unauthorized access to claim" },
        { status: 403 }
      );
    }

    // Get the client
    const client = await convex.query(api.clients.get, {
      id: claim.clientId,
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Import AI function
    const { generateMessage } = await import("@oryn/ai");

    // Generate payment link URL if requested
    let paymentLink: string | undefined;
    if (includePaymentLink) {
      const existingLinks = await convex.query(api.paymentLinks.listByClaim, {
        claimId,
      });

      if (existingLinks && existingLinks.length > 0) {
        // Construct URL from token
        paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://pay.oryn.cc"}/${existingLinks[0].token}`;
      } else {
        // Create a new payment link
        const newLink = await convex.mutation(api.paymentLinks.create, {
          userId: convexUser._id,
          claimId,
        });
        paymentLink = `${process.env.NEXT_PUBLIC_APP_URL || "https://pay.oryn.cc"}/${newLink.token}`;
      }
    }

    // Determine tone based on escalation level if not specified
    const messageTone = tone || getToneFromEscalation(claim.escalationLevel || 0);

    // Format due date for AI
    const dueDateStr = claim.dueDate
      ? new Date(claim.dueDate).toLocaleDateString()
      : undefined;

    // Generate the message using the AI package
    const result = await generateMessage(
      {
        clientName: client.name,
        amount: claim.amount,
        currency: claim.currency,
        dueDate: dueDateStr,
        description: claim.description,
        escalationLevel: claim.escalationLevel || 0,
      },
      channel,
      messageTone as "friendly" | "professional" | "firm" | "urgent",
      paymentLink
    );

    return NextResponse.json({
      success: true,
      message: {
        content: result.content,
        subject: result.subject,
        channel,
        tone: messageTone,
        paymentLink,
      },
    });
  } catch (error) {
    console.error("Message generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}

function getToneFromEscalation(level: number): string {
  switch (level) {
    case 0:
      return "friendly";
    case 1:
      return "professional";
    case 2:
      return "firm";
    case 3:
    case 4:
      return "urgent";
    default:
      return "professional";
  }
}
