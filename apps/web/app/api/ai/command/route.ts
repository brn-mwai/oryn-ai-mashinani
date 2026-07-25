import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import { checkRateLimit, RATE_LIMITS, getRateLimitHeaders } from "@/lib/rate-limit";
import { validateRequired, validateString, validationErrorResponse } from "@/lib/validation";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Action descriptions for UI display
const ACTION_DESCRIPTIONS: Record<string, string> = {
  RESOLVE_CLIENT: "Finding client...",
  RESOLVE_CLAIM: "Finding claim...",
  GENERATE_MESSAGE: "Generating message...",
  SEND_MESSAGE: "Sending message...",
  CREATE_CLAIM: "Creating claim...",
  UPDATE_CLAIM: "Updating claim...",
  ESCALATE_CLAIM: "Escalating claim...",
  PAUSE_CLAIM: "Pausing claim...",
  CREATE_CLIENT: "Creating client...",
  CREATE_PAYMENT_LINK: "Creating payment link...",
  INITIATE_WITHDRAWAL: "Processing withdrawal...",
  FETCH_STATS: "Fetching statistics...",
  LOG_AI_ACTION: "Logging action...",
};

// Intent-specific suggestions
const INTENT_SUGGESTIONS: Record<string, string[]> = {
  SEND_REMINDER: ["Send via email", "Send via SMS", "Send via WhatsApp"],
  CREATE_CLAIM: ["Add payment link", "Set due date", "Add notes"],
  CHECK_STATUS: ["View all claims", "Check overdue claims", "View collection stats"],
  ESCALATE_CLAIM: ["Send final notice", "Add late fee", "Mark as disputed"],
  GET_STATS: ["This week", "This month", "All time"],
  UNKNOWN: ["Send a reminder", "Create a claim", "Check my stats", "View clients"],
};

// Generate a user-friendly message based on the NLP result
function generateMessage(result: any): string {
  const { intent, confidence, clarificationNeeded, clarificationQuestions, actionPlan } = result;

  // If clarification is needed, ask the questions
  if (clarificationNeeded && clarificationQuestions?.length > 0) {
    return clarificationQuestions.join("\n\n");
  }

  // If confirmation is required, show the confirmation message
  if (actionPlan?.requiresConfirmation && actionPlan?.confirmationMessage) {
    return actionPlan.confirmationMessage;
  }

  // Generate a message based on intent
  const intentMessages: Record<string, string> = {
    SEND_REMINDER: "I'll help you send a payment reminder.",
    CREATE_CLAIM: "I'll create a new claim for you.",
    CHECK_STATUS: "Let me check that for you.",
    ESCALATE_CLAIM: "I'll escalate this claim to the next level.",
    UPDATE_CLAIM: "I'll update the claim with the new information.",
    PAUSE_CLAIM: "I'll pause collection on this claim.",
    ADD_CLIENT: "I'll add this new client to your account.",
    REQUEST_PAYMENT: "I'll send a payment request with a payment link.",
    WITHDRAW_FUNDS: "I'll process your withdrawal request.",
    GET_STATS: "Here's a summary of your activity.",
    UNKNOWN: "I'm not sure what you'd like to do. Here are some things I can help with:",
  };

  let message = intentMessages[intent] || intentMessages.UNKNOWN;

  // Add confidence indicator for medium confidence
  if (confidence >= 0.65 && confidence < 0.85) {
    message += " Is that correct?";
  }

  // Add action plan summary
  if (actionPlan?.actions?.length > 0 && !actionPlan.requiresConfirmation) {
    const actionCount = actionPlan.actions.length;
    message += `\n\nI'll perform ${actionCount} action${actionCount > 1 ? "s" : ""} to complete this.`;
  }

  return message;
}

// Transform NLP actions to UI-friendly format
function transformActions(actions: any[]): Array<{ type: string; description: string; status: string }> {
  return actions
    .filter((action) => action.type !== "LOG_AI_ACTION") // Hide logging from UI
    .map((action) => ({
      type: action.type,
      description: ACTION_DESCRIPTIONS[action.type] || action.type,
      status: action.status || "pending",
    }));
}

// Get suggestions based on intent and context
function getSuggestions(intent: string, clarificationNeeded: boolean): string[] {
  if (clarificationNeeded) {
    return INTENT_SUGGESTIONS[intent] || INTENT_SUGGESTIONS.UNKNOWN;
  }
  return [];
}

// Execute actions that don't require confirmation
async function executeActions(
  result: any,
  userId: string,
  convexUserId: string
): Promise<{ success: boolean; updatedActions: any[]; error?: string }> {
  const { intent, actionPlan, resolvedEntities } = result;

  if (!actionPlan?.actions || actionPlan.requiresConfirmation) {
    return { success: true, updatedActions: actionPlan?.actions || [] };
  }

  const updatedActions = [...actionPlan.actions];

  for (let i = 0; i < updatedActions.length; i++) {
    const action = updatedActions[i];

    try {
      switch (action.type) {
        case "FETCH_STATS": {
          // Fetch user stats from database
          const stats = await convex.query(api.users.getUsageStats, {
            id: convexUserId as any,
          });
          updatedActions[i] = {
            ...action,
            status: "completed",
            result: stats,
          };
          break;
        }

        case "CREATE_CLIENT": {
          // Create client in database
          if (resolvedEntities?.clientName) {
            const clientId = await convex.mutation(api.clients.create, {
              userId: convexUserId as any,
              name: resolvedEntities.clientName,
              email: resolvedEntities.clientEmail,
            });
            updatedActions[i] = {
              ...action,
              status: "completed",
              result: { clientId },
            };
          } else {
            updatedActions[i] = {
              ...action,
              status: "failed",
              error: "Client name is required",
            };
          }
          break;
        }

        case "LOG_AI_ACTION": {
          // Log the AI action
          await convex.mutation(api.aiActions.log, {
            userId: convexUserId as any,
            type: mapIntentToActionType(intent),
            input: result.rawInput,
            output: generateMessage(result),
            model: result.model || "gemini-2.0-flash",
            tokensTotal: result.tokensUsed || 0,
            status: "success" as const,
            wasFallback: false,
            durationMs: result.durationMs || 0,
          });
          updatedActions[i] = { ...action, status: "completed" };
          break;
        }

        default:
          // For actions that need more context or confirmation, mark as pending
          // These will be executed when the user confirms
          break;
      }
    } catch (error) {
      console.error(`Action ${action.type} failed:`, error);
      updatedActions[i] = {
        ...action,
        status: "failed",
        error: error instanceof Error ? error.message : "Action failed",
      };
    }
  }

  return { success: true, updatedActions };
}

type AiActionType = "document_parse" | "message_generate" | "escalation_decision" | "semantic_search" | "embedding_generate" | "tone_analysis" | "data_extraction" | "ocr";

function mapIntentToActionType(intent: string): AiActionType {
  const mapping: Record<string, AiActionType> = {
    SEND_REMINDER: "message_generate",
    CREATE_CLAIM: "data_extraction",
    CHECK_STATUS: "semantic_search",
    ESCALATE_CLAIM: "escalation_decision",
    UPDATE_CLAIM: "data_extraction",
    PAUSE_CLAIM: "data_extraction",
    ADD_CLIENT: "data_extraction",
    REQUEST_PAYMENT: "message_generate",
    WITHDRAW_FUNDS: "data_extraction",
    GET_STATS: "semantic_search",
  };
  return mapping[intent] || "data_extraction";
}

// Process natural language commands via AI
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
    const { command, claimId, confirmed } = body;

    // Input validation
    const validation = validateRequired(body, ["command"]);
    if (!validation.success) {
      return validationErrorResponse(validation.errors!);
    }

    const commandError = validateString(command, "command", { minLength: 1, maxLength: 1000 });
    if (commandError) {
      return validationErrorResponse([commandError]);
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

    // Get database context for entity resolution
    const [clients, claims] = await Promise.all([
      convex.query(api.clients.list, { userId: convexUser._id }),
      convex.query(api.claims.list, { userId: convexUser._id }),
    ]);

    const databaseContext = {
      clients: (clients?.data || []).map((c: any) => ({
        id: c._id,
        name: c.name,
        email: c.email,
      })),
      claims: (claims?.data || []).map((c: any) => ({
        id: c._id,
        title: c.title,
        amount: c.amount,
        clientId: c.clientId,
      })),
    };

    // Import AI functions
    const { processNLPCommand, generateResponse } = await import("@oryn/ai");

    // Process the command through NLP pipeline
    const result = await processNLPCommand(
      command,
      {
        userId: convexUser._id.toString(),
        userType: convexUser.userType,
        limits: convexUser.limits,
        currentUsage: convexUser.currentUsage,
      },
      databaseContext
    );

    // Execute actions if no confirmation is needed
    let executionResult = { success: true, updatedActions: result.actionPlan?.actions || [] };
    if (!result.requiresConfirmation && !result.clarificationNeeded) {
      executionResult = await executeActions(result, userId, convexUser._id.toString());
    }

    // Generate the user-friendly message
    const message = result.clarificationNeeded || result.requiresConfirmation
      ? generateMessage(result)
      : generateResponse(result.intent, result.resolvedEntities, executionResult.updatedActions);

    // Transform actions for UI
    const actions = transformActions(executionResult.updatedActions);

    // Get relevant suggestions
    const suggestions = getSuggestions(result.intent, result.clarificationNeeded);

    return NextResponse.json({
      success: true,
      result: {
        message,
        actions,
        requiresConfirmation: result.requiresConfirmation,
        confirmationMessage: result.confirmationMessage,
        suggestions,
        // Include metadata for debugging/logging
        metadata: {
          intent: result.intent,
          confidence: result.confidence,
          clarificationNeeded: result.clarificationNeeded,
          tokensUsed: result.tokensUsed,
          durationMs: result.durationMs,
        },
      },
    });
  } catch (error) {
    console.error("AI command error:", error);
    return NextResponse.json(
      {
        success: false,
        result: {
          message: "Sorry, I encountered an error processing your request. Please try again.",
          actions: [],
          suggestions: ["Send a reminder", "Create a claim", "Check my stats"],
        }
      },
      { status: 500 }
    );
  }
}
