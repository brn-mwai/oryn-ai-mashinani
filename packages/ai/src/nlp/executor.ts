import type { NLPIntent, NLPEntities, NLPAction, NLPActionType, NLPActionStatus } from "@oryn/types";

// Action plan configuration
export interface ActionPlan {
  actions: NLPAction[];
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  estimatedDuration?: string;
}

// Action execution context
export interface ExecutionContext {
  userId: string;
  userType?: string;
  limits?: {
    maxEscalationLevel: number;
    channels: string[];
    aiActionsLimit: number;
  };
  currentUsage?: {
    aiActionsUsed: number;
  };
}

// High-risk action thresholds
export const HIGH_RISK_THRESHOLDS = {
  WITHDRAWAL_AMOUNT: 1000, // Withdrawals > $1000 require confirmation
  BULK_OPERATION_COUNT: 5, // Operations affecting > 5 items require confirmation
  ESCALATION_LEVEL: 4,     // Level 4 escalation (legal) requires confirmation
} as const;

// Action definitions for each intent
const INTENT_ACTIONS: Record<NLPIntent, NLPActionType[]> = {
  SEND_REMINDER: [
    "RESOLVE_CLIENT",
    "RESOLVE_CLAIM",
    "GENERATE_MESSAGE",
    "SEND_MESSAGE",
    "LOG_AI_ACTION",
  ],
  CREATE_CLAIM: [
    "RESOLVE_CLIENT",
    "CREATE_CLAIM",
    "CREATE_PAYMENT_LINK",
    "LOG_AI_ACTION",
  ],
  CHECK_STATUS: [
    "RESOLVE_CLAIM",
    "FETCH_STATS",
    "LOG_AI_ACTION",
  ],
  ESCALATE_CLAIM: [
    "RESOLVE_CLAIM",
    "ESCALATE_CLAIM",
    "GENERATE_MESSAGE",
    "SEND_MESSAGE",
    "LOG_AI_ACTION",
  ],
  UPDATE_CLAIM: [
    "RESOLVE_CLAIM",
    "UPDATE_CLAIM",
    "LOG_AI_ACTION",
  ],
  PAUSE_CLAIM: [
    "RESOLVE_CLAIM",
    "PAUSE_CLAIM",
    "LOG_AI_ACTION",
  ],
  ADD_CLIENT: [
    "CREATE_CLIENT",
    "LOG_AI_ACTION",
  ],
  REQUEST_PAYMENT: [
    "RESOLVE_CLIENT",
    "RESOLVE_CLAIM",
    "CREATE_PAYMENT_LINK",
    "GENERATE_MESSAGE",
    "SEND_MESSAGE",
    "LOG_AI_ACTION",
  ],
  WITHDRAW_FUNDS: [
    "INITIATE_WITHDRAWAL",
    "LOG_AI_ACTION",
  ],
  GET_STATS: [
    "FETCH_STATS",
    "LOG_AI_ACTION",
  ],
  UNKNOWN: [],
};

/**
 * Generate an action plan based on intent and entities
 */
export function generateActionPlan(
  intent: NLPIntent,
  entities: NLPEntities,
  context: ExecutionContext
): ActionPlan {
  const actionTypes = INTENT_ACTIONS[intent] || [];

  // Create action objects with pending status
  const actions: NLPAction[] = actionTypes.map((type) => ({
    type,
    status: "pending" as NLPActionStatus,
    params: getActionParams(type, entities, context),
  }));

  // Filter out unnecessary actions based on already resolved entities
  const filteredActions = filterActions(actions, entities);

  // Determine if confirmation is required
  const { requiresConfirmation, confirmationMessage } = checkConfirmationRequired(
    intent,
    entities,
    context
  );

  return {
    actions: filteredActions,
    requiresConfirmation,
    confirmationMessage,
    estimatedDuration: estimateActionDuration(filteredActions),
  };
}

/**
 * Get action-specific parameters based on entities
 */
function getActionParams(
  actionType: NLPActionType,
  entities: NLPEntities,
  context: ExecutionContext
): Record<string, unknown> | undefined {
  switch (actionType) {
    case "RESOLVE_CLIENT":
      return {
        clientName: entities.clientName,
        clientId: entities.clientId,
      };

    case "RESOLVE_CLAIM":
      return {
        claimId: entities.claimId,
        clientId: entities.clientId,
        amount: entities.amount,
      };

    case "GENERATE_MESSAGE":
      return {
        channel: entities.channel || "email",
        clientId: entities.clientId,
        claimId: entities.claimId,
        amount: entities.amount,
      };

    case "SEND_MESSAGE":
      return {
        channel: entities.channel || "email",
        clientId: entities.clientId,
        claimId: entities.claimId,
      };

    case "CREATE_CLAIM":
      return {
        clientId: entities.clientId,
        clientName: entities.clientName,
        amount: entities.amount,
        dueDate: entities.dueDate,
      };

    case "UPDATE_CLAIM":
      return {
        claimId: entities.claimId,
        amount: entities.amount,
        dueDate: entities.dueDate,
      };

    case "ESCALATE_CLAIM":
      return {
        claimId: entities.claimId,
      };

    case "PAUSE_CLAIM":
      return {
        claimId: entities.claimId,
      };

    case "CREATE_CLIENT":
      return {
        name: entities.clientName,
      };

    case "CREATE_PAYMENT_LINK":
      return {
        claimId: entities.claimId,
        amount: entities.amount,
      };

    case "INITIATE_WITHDRAWAL":
      return {
        amount: entities.amount,
      };

    case "FETCH_STATS":
      return {
        claimId: entities.claimId,
        clientId: entities.clientId,
      };

    case "LOG_AI_ACTION":
      return {
        userId: context.userId,
      };

    default:
      return undefined;
  }
}

/**
 * Filter out unnecessary actions based on already resolved entities
 */
function filterActions(actions: NLPAction[], entities: NLPEntities): NLPAction[] {
  return actions.filter((action) => {
    // Skip RESOLVE_CLIENT if clientId is already resolved
    if (action.type === "RESOLVE_CLIENT" && entities.clientId) {
      return false;
    }

    // Skip RESOLVE_CLAIM if claimId is already resolved
    if (action.type === "RESOLVE_CLAIM" && entities.claimId) {
      return false;
    }

    return true;
  });
}

/**
 * Check if confirmation is required for this action plan
 */
function checkConfirmationRequired(
  intent: NLPIntent,
  entities: NLPEntities,
  context: ExecutionContext
): { requiresConfirmation: boolean; confirmationMessage?: string } {
  // Escalation always requires confirmation
  if (intent === "ESCALATE_CLAIM") {
    // Check user's plan limits for escalation level
    if (context.limits && context.limits.maxEscalationLevel < 4) {
      return {
        requiresConfirmation: true,
        confirmationMessage: `Your plan allows escalation up to level ${context.limits.maxEscalationLevel}. Higher escalation requires an upgrade.`,
      };
    }
    // Default escalation confirmation
    return {
      requiresConfirmation: true,
      confirmationMessage:
        "This will escalate the claim. Escalation may mention legal action or collection agencies. Are you sure?",
    };
  }

  // Large withdrawals require confirmation
  if (intent === "WITHDRAW_FUNDS" && entities.amount) {
    if (entities.amount > HIGH_RISK_THRESHOLDS.WITHDRAWAL_AMOUNT) {
      return {
        requiresConfirmation: true,
        confirmationMessage: `You're about to withdraw $${entities.amount.toFixed(2)}. Please confirm this withdrawal.`,
      };
    }
  }

  // Check user-specific limits for channel access
  if (context.limits) {
    if ((intent === "SEND_REMINDER" || intent === "REQUEST_PAYMENT") && entities.channel) {
      if (!context.limits.channels.includes(entities.channel)) {
        return {
          requiresConfirmation: true,
          confirmationMessage: `The ${entities.channel} channel is not available on your plan. Would you like to send via email instead?`,
        };
      }
    }
  }

  return { requiresConfirmation: false };
}

/**
 * Estimate the duration of an action plan
 */
function estimateActionDuration(actions: NLPAction[]): string {
  // Rough estimates per action type
  const estimates: Record<NLPActionType, number> = {
    RESOLVE_CLIENT: 100,
    RESOLVE_CLAIM: 100,
    GENERATE_MESSAGE: 2000,
    SEND_MESSAGE: 500,
    CREATE_CLAIM: 200,
    UPDATE_CLAIM: 200,
    ESCALATE_CLAIM: 300,
    PAUSE_CLAIM: 200,
    CREATE_CLIENT: 200,
    CREATE_PAYMENT_LINK: 300,
    INITIATE_WITHDRAWAL: 1000,
    FETCH_STATS: 300,
    LOG_AI_ACTION: 100,
  };

  const totalMs = actions.reduce((sum, action) => {
    return sum + (estimates[action.type as NLPActionType] || 200);
  }, 0);

  if (totalMs < 1000) {
    return "< 1 second";
  } else if (totalMs < 5000) {
    return "a few seconds";
  } else {
    return "several seconds";
  }
}

/**
 * Update action status in the plan
 */
export function updateActionStatus(
  actions: NLPAction[],
  actionIndex: number,
  status: NLPActionStatus,
  result?: Record<string, unknown>,
  error?: string
): NLPAction[] {
  return actions.map((action, index) => {
    if (index === actionIndex) {
      return {
        ...action,
        status,
        result,
        error,
        executedAt: status === "completed" || status === "failed" ? Date.now() : undefined,
      };
    }
    return action;
  });
}

/**
 * Generate a human-readable response based on completed actions
 */
export function generateResponse(
  intent: NLPIntent,
  entities: NLPEntities,
  actions: NLPAction[]
): string {
  const completedActions = actions.filter((a) => a.status === "completed");
  const failedActions = actions.filter((a) => a.status === "failed");

  // Check for failures
  if (failedActions.length > 0) {
    const errors = failedActions.map((a) => a.error).filter(Boolean).join(", ");
    return `I encountered an issue: ${errors || "Unknown error"}. Please try again.`;
  }

  // Generate success response based on intent
  switch (intent) {
    case "SEND_REMINDER": {
      const channel = entities.channel || "email";
      const clientName = entities.clientName || "the client";
      return `Sent a reminder to ${clientName} via ${channel}.`;
    }

    case "CREATE_CLAIM": {
      const amount = entities.amount ? `$${entities.amount.toFixed(2)}` : "the specified amount";
      const clientName = entities.clientName || "the client";
      return `Created a new claim for ${amount} from ${clientName}.`;
    }

    case "CHECK_STATUS": {
      const statsAction = completedActions.find((a) => a.type === "FETCH_STATS");
      if (statsAction?.result) {
        const stats = statsAction.result as Record<string, unknown>;
        return formatStatsResponse(stats);
      }
      return "Here's your current status.";
    }

    case "ESCALATE_CLAIM": {
      return `Escalated the claim. A more urgent message has been prepared.`;
    }

    case "UPDATE_CLAIM": {
      return `Updated the claim successfully.`;
    }

    case "PAUSE_CLAIM": {
      return `Paused collection on the claim.`;
    }

    case "ADD_CLIENT": {
      const clientName = entities.clientName || "the client";
      return `Added ${clientName} as a new client.`;
    }

    case "REQUEST_PAYMENT": {
      const amount = entities.amount ? `$${entities.amount.toFixed(2)}` : "payment";
      return `Created a payment request for ${amount} and sent the payment link.`;
    }

    case "WITHDRAW_FUNDS": {
      const amount = entities.amount ? `$${entities.amount.toFixed(2)}` : "funds";
      return `Initiated withdrawal of ${amount}. It should arrive in 1-3 business days.`;
    }

    case "GET_STATS": {
      const statsAction = completedActions.find((a) => a.type === "FETCH_STATS");
      if (statsAction?.result) {
        const stats = statsAction.result as Record<string, unknown>;
        return formatStatsResponse(stats);
      }
      return "Here are your statistics.";
    }

    default:
      return "Action completed successfully.";
  }
}

/**
 * Format stats response for display
 */
function formatStatsResponse(stats: Record<string, unknown>): string {
  const parts: string[] = [];

  if (typeof stats.totalClaims === "number") {
    parts.push(`Total claims: ${stats.totalClaims}`);
  }

  if (typeof stats.activeClaims === "number") {
    parts.push(`Active claims: ${stats.activeClaims}`);
  }

  if (typeof stats.totalOwed === "number") {
    parts.push(`Total owed: $${(stats.totalOwed as number).toFixed(2)}`);
  }

  if (typeof stats.totalCollected === "number") {
    parts.push(`Total collected: $${(stats.totalCollected as number).toFixed(2)}`);
  }

  if (typeof stats.collectionRate === "number") {
    parts.push(`Collection rate: ${(stats.collectionRate as number).toFixed(1)}%`);
  }

  if (parts.length === 0) {
    return "No statistics available.";
  }

  return parts.join("\n");
}

/**
 * Validate that an action plan can be executed given the user's limits
 */
export function validateAgainstLimits(
  plan: ActionPlan,
  context: ExecutionContext
): { valid: boolean; error?: string } {
  if (!context.limits || !context.currentUsage) {
    return { valid: true };
  }

  // Check AI actions limit
  const aiActionCount = plan.actions.filter((a) =>
    ["GENERATE_MESSAGE", "FETCH_STATS"].includes(a.type)
  ).length;

  if (
    context.currentUsage.aiActionsUsed + aiActionCount >
    context.limits.aiActionsLimit
  ) {
    return {
      valid: false,
      error: `You've reached your AI actions limit (${context.limits.aiActionsLimit}/month). Please upgrade your plan.`,
    };
  }

  return { valid: true };
}

/**
 * Get the next action to execute from the plan
 */
export function getNextAction(actions: NLPAction[]): NLPAction | null {
  return actions.find((a) => a.status === "pending") || null;
}

/**
 * Check if all actions in the plan are completed
 */
export function isPlanComplete(actions: NLPAction[]): boolean {
  return actions.every((a) => a.status === "completed" || a.status === "failed");
}

/**
 * Check if any action in the plan has failed
 */
export function hasPlanFailed(actions: NLPAction[]): boolean {
  return actions.some((a) => a.status === "failed");
}
