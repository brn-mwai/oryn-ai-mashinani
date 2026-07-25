import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequired, validationErrorResponse } from "@/lib/validation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Analyze a claim for escalation
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
    const { claimId, autoApply } = body;

    // Input validation
    const validation = validateRequired(body, ["claimId"]);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
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

    // Import AI functions
    const { analyzeEscalation } = await import("@oryn/ai");

    // Calculate days since due
    const now = Date.now();
    const daysSinceDue = claim.dueDate
      ? Math.floor((now - claim.dueDate) / (1000 * 60 * 60 * 24))
      : 0;
    const lastReminderDaysAgo = claim.lastReminderAt
      ? Math.floor((now - claim.lastReminderAt) / (1000 * 60 * 60 * 24))
      : 999;

    // Analyze escalation
    const result = await analyzeEscalation({
      daysSinceDue,
      totalReminders: claim.reminderCount || 0,
      lastReminderDaysAgo,
      currentEscalationLevel: claim.escalationLevel || 0,
    });

    // Auto-apply escalation if requested (use the escalate mutation)
    if (autoApply && convexUser.settings?.autoEscalation && result.shouldEscalate) {
      await convex.mutation(api.claims.escalate, {
        id: claimId,
      });

      return NextResponse.json({
        success: true,
        applied: true,
        analysis: {
          shouldEscalate: result.shouldEscalate,
          currentLevel: claim.escalationLevel || 0,
          suggestedAction: result.suggestedAction,
          reasoning: result.reasoning,
        },
      });
    }

    return NextResponse.json({
      success: true,
      applied: false,
      analysis: {
        shouldEscalate: result.shouldEscalate,
        currentLevel: claim.escalationLevel || 0,
        suggestedAction: result.suggestedAction,
        reasoning: result.reasoning,
      },
    });
  } catch (error) {
    console.error("Escalation analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze escalation" },
      { status: 500 }
    );
  }
}
