import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Execute confirmed action
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
    const { intent, entities, confirmed } = body;

    if (!confirmed) {
      return NextResponse.json({
        success: true,
        result: {
          message: "Action cancelled.",
          actions: [],
        },
      });
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

    // Execute the confirmed action based on intent
    const executionResult = await executeConfirmedAction(
      intent,
      entities,
      convexUser._id.toString(),
      convex
    );

    return NextResponse.json({
      success: executionResult.success,
      result: {
        message: executionResult.message,
        actions: executionResult.actions,
      },
    });
  } catch (error) {
    console.error("AI confirm error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {
          message: "Failed to execute the action. Please try again.",
          actions: [],
        },
      },
      { status: 500 }
    );
  }
}

async function executeConfirmedAction(
  intent: string,
  entities: any,
  convexUserId: string,
  convex: ConvexHttpClient
): Promise<{ success: boolean; message: string; actions: any[] }> {
  const actions: any[] = [];

  try {
    switch (intent) {
      case "ESCALATE_CLAIM": {
        if (!entities?.claimId) {
          return {
            success: false,
            message: "Claim ID is required for escalation.",
            actions: [],
          };
        }

        // Get the claim
        const claim = await convex.query(api.claims.get, { id: entities.claimId });
        if (!claim) {
          return {
            success: false,
            message: "Claim not found.",
            actions: [],
          };
        }

        // Get the client for notification
        const client = claim.clientId ? await convex.query(api.clients.get, { id: claim.clientId }) : null;

        // Escalate the claim using the dedicated mutation
        const newLevel = await convex.mutation(api.claims.escalate, {
          id: entities.claimId,
        });

        actions.push({
          type: "ESCALATE_CLAIM",
          description: `Escalated to level ${newLevel}`,
          status: "completed",
        });

        // Send notification
        await notify.claimEscalated(convexUserId, {
          claimTitle: claim.title || "Untitled Claim",
          clientName: client?.name || "Unknown Client",
          level: newLevel,
          amount: claim.amount,
          claimId: entities.claimId,
        });

        return {
          success: true,
          message: `Claim escalated to level ${newLevel}. ${getEscalationDescription(newLevel)}`,
          actions,
        };
      }

      case "WITHDRAW_FUNDS": {
        if (!entities?.amount || entities.amount < 10) {
          return {
            success: false,
            message: "Minimum withdrawal amount is $10.",
            actions: [],
          };
        }

        // Request withdrawal
        await convex.mutation(api.wallets.requestWithdrawal, {
          userId: convexUserId as any,
          amount: entities.amount,
          method: entities.method || "bank_transfer",
          destination: entities.destination || { type: "bank" },
        });

        actions.push({
          type: "INITIATE_WITHDRAWAL",
          description: `Withdrawal of $${entities.amount} initiated`,
          status: "completed",
        });

        // Send notification (withdrawal initiated - will send completed notification when processed)
        await notify.system(convexUserId, {
          title: "Withdrawal Initiated",
          message: `Your withdrawal of $${entities.amount.toFixed(2)} has been initiated and is being processed.`,
          link: "/dashboard/wallet",
        });

        return {
          success: true,
          message: `Withdrawal of $${entities.amount.toFixed(2)} initiated. It should arrive in 1-3 business days.`,
          actions,
        };
      }

      case "SEND_REMINDER": {
        if (!entities?.claimId || !entities?.clientId) {
          return {
            success: false,
            message: "Claim and client information is required.",
            actions: [],
          };
        }

        // Get client info for notification
        const reminderClient = await convex.query(api.clients.get, { id: entities.clientId });

        // Generate and send message
        const channel = entities.channel || "email";

        // Generate message using AI
        const messageResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/ai/generate-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            claimId: entities.claimId,
            channel,
            tone: "professional",
          }),
        });

        if (!messageResponse.ok) {
          // Send failure notification
          await notify.messageFailed(convexUserId, {
            clientName: reminderClient?.name || "Unknown Client",
            channel,
            error: "Failed to generate message",
          });

          return {
            success: false,
            message: "Failed to generate reminder message.",
            actions: [{ type: "GENERATE_MESSAGE", description: "Generate message", status: "failed" }],
          };
        }

        const messageData = await messageResponse.json();

        actions.push({
          type: "GENERATE_MESSAGE",
          description: "Generated reminder message",
          status: "completed",
        });

        // Create message record
        await convex.mutation(api.messages.create, {
          userId: convexUserId as any,
          claimId: entities.claimId,
          clientId: entities.clientId,
          channel,
          content: messageData.message,
          status: "queued",
          direction: "outbound",
        });

        actions.push({
          type: "SEND_MESSAGE",
          description: `Sent via ${channel}`,
          status: "completed",
        });

        // Send success notification (don't email for this - it would be redundant)
        await notify.messageDelivered(convexUserId, {
          clientName: reminderClient?.name || "Unknown Client",
          channel,
          claimId: entities.claimId,
        });

        return {
          success: true,
          message: `Reminder sent to the client via ${channel}.`,
          actions,
        };
      }

      default:
        return {
          success: false,
          message: "Unknown action type.",
          actions: [],
        };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Action failed.",
      actions: actions.map((a) => ({ ...a, status: "failed" })),
    };
  }
}

function getEscalationDescription(level: number): string {
  const descriptions: Record<number, string> = {
    1: "Friendly reminder will be sent.",
    2: "A more firm reminder will be sent.",
    3: "Final notice before further action.",
    4: "Legal/collection agency notice prepared.",
  };
  return descriptions[level] || "";
}
