/**
 * Marathon Agent - Autonomous AI Agent for Payment Collection
 *
 * This agent implements the "Marathon Agent" pattern for Gemini 3:
 * - Tasks spanning hours to days (invoice lifecycle: 1-60 days)
 * - Thought Signatures for state persistence across sessions
 * - Thinking Levels (L1-L4) for structured reasoning
 * - Self-correction when actions fail
 * - No human supervision (autonomous with policy guardrails)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database";
import type { Id } from "@oryn/database";
import { AIClient } from "./client";
import { generateMessage } from "./gemini";

// Types
export type ThinkingLevel =
  | "L1_PARSE"
  | "L2_GENERATE"
  | "L3_COMMUNICATE"
  | "L4_COLLECT"
  | "COLLECTED"
  | "FAILED";

export type AgentAction =
  | "parse_document"
  | "generate_invoice"
  | "send_reminder"
  | "escalate"
  | "wait_for_response"
  | "wait_for_payment"
  | "try_alternate_channel"
  | "final_notice"
  | "mark_collected"
  | "mark_failed"
  | "none";

export interface ThoughtSignature {
  _id: Id<"thoughtSignatures">;
  claimId: Id<"claims">;
  userId: Id<"users">;
  level: ThinkingLevel;
  context: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    invoiceAmount: number;
    currency: string;
    dueDate?: number;
    daysSinceDue: number;
    attemptHistory: Array<{
      channel: "email" | "sms" | "whatsapp";
      sentAt: number;
      messageType: string;
      result: string;
      responseAt?: number;
      responseSummary?: string;
    }>;
    clientResponseSummary?: string;
    clientSentiment?: string;
    promisedPaymentDate?: number;
    paymentReceived?: number;
    paymentTransactionHash?: string;
  };
  nextAction: {
    action: AgentAction;
    channel?: "email" | "sms" | "whatsapp";
    scheduledFor: number;
    reasoning: string;
  };
  corrections: Array<{
    failedAction: string;
    failureReason: string;
    correctedTo: string;
    correctedAt: number;
    reasoning: string;
  }>;
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  totalActionsExecuted: number;
  totalCorrections: number;
  totalApiCalls: number;
  totalTokensUsed: number;
}

export interface AgentConfig {
  convexUrl: string;
  maxActionsPerSession?: number;
  maxTokensPerSession?: number;
  enableSelfCorrection?: boolean;
  dryRun?: boolean;
}

export interface AgentResult {
  success: boolean;
  thoughtSignature: ThoughtSignature;
  actionsExecuted: number;
  tokensUsed: number;
  nextScheduledAction?: {
    action: AgentAction;
    scheduledFor: number;
  };
  error?: string;
}

// Thinking Level Descriptions for Gemini prompts
const LEVEL_DESCRIPTIONS: Record<ThinkingLevel, string> = {
  L1_PARSE:
    "Parse and understand the claim - extract client details, payment terms, and invoice information from documents",
  L2_GENERATE:
    "Generate appropriate communications - create invoices, payment reminders, and follow-up messages",
  L3_COMMUNICATE:
    "Execute communications - send messages via email, SMS, or WhatsApp based on escalation level",
  L4_COLLECT:
    "Process payment collection - verify payments, update records, and settle on blockchain",
  COLLECTED: "Terminal state - payment has been collected successfully",
  FAILED: "Terminal state - collection has failed after all attempts",
};

// Escalation level to message tone mapping
const ESCALATION_TONES: Record<number, string> = {
  0: "friendly",
  1: "professional",
  2: "firm",
  3: "urgent",
  4: "final",
};

// Wait times between actions (in milliseconds)
const WAIT_TIMES = {
  afterFriendlyReminder: 3 * 24 * 60 * 60 * 1000, // 3 days
  afterFollowUp: 5 * 24 * 60 * 60 * 1000, // 5 days
  afterFirmReminder: 7 * 24 * 60 * 60 * 1000, // 7 days
  afterUrgentReminder: 3 * 24 * 60 * 60 * 1000, // 3 days
  afterFinalNotice: 7 * 24 * 60 * 60 * 1000, // 7 days
  afterBounce: 1 * 24 * 60 * 60 * 1000, // 1 day (try alternate channel)
};

/**
 * Marathon Agent Class
 * Orchestrates the autonomous payment collection process
 */
export class MarathonAgent {
  private convex: ConvexHttpClient;
  private ai: AIClient;
  private config: AgentConfig;
  private sessionId?: Id<"agentSessions">;
  private tokensUsed: number = 0;
  private actionsExecuted: number = 0;

  constructor(config: AgentConfig) {
    this.config = {
      maxActionsPerSession: 10,
      maxTokensPerSession: 50000,
      enableSelfCorrection: true,
      dryRun: false,
      ...config,
    };
    this.convex = new ConvexHttpClient(config.convexUrl);
    this.ai = new AIClient();
  }

  /**
   * Run the agent for a specific claim
   */
  async run(
    claimId: Id<"claims">,
    sessionType: "scheduled" | "webhook" | "manual" | "correction" = "manual"
  ): Promise<AgentResult> {
    try {
      // Get or create thought signature
      const claim = await this.convex.query(api.claims.get, { id: claimId });
      if (!claim) throw new Error("Claim not found");

      const thought = await this.convex.mutation(
        api.thoughtSignatures.getOrCreate,
        {
          claimId,
          userId: claim.userId,
        }
      );

      if (!thought) throw new Error("Failed to create thought signature");

      // Check if already in terminal state
      if (thought.level === "COLLECTED" || thought.level === "FAILED") {
        return {
          success: true,
          thoughtSignature: thought as ThoughtSignature,
          actionsExecuted: 0,
          tokensUsed: 0,
        };
      }

      // Create agent session
      this.sessionId = await this.convex.mutation(api.agentSessions.create, {
        thoughtSignatureId: thought._id,
        userId: claim.userId,
        claimId,
        sessionType,
        model: "gemini-2.0-flash",
      });

      // Run the agent loop
      let currentThought = thought as ThoughtSignature;

      while (
        this.actionsExecuted < (this.config.maxActionsPerSession ?? 10) &&
        this.tokensUsed < (this.config.maxTokensPerSession ?? 50000)
      ) {
        // Check if in terminal state
        if (
          currentThought.level === "COLLECTED" ||
          currentThought.level === "FAILED"
        ) {
          break;
        }

        // Check if action is scheduled for the future
        if (currentThought.nextAction.scheduledFor > Date.now()) {
          break;
        }

        // Execute the next action
        const result = await this.executeAction(currentThought);

        if (!result.success && this.config.enableSelfCorrection) {
          // Apply self-correction
          currentThought = await this.applySelfCorrection(
            currentThought,
            result.error ?? "Unknown error"
          );
        } else if (result.success) {
          // Determine next action
          currentThought = await this.determineNextAction(currentThought);
        } else {
          // No self-correction, exit loop
          break;
        }

        this.actionsExecuted++;
      }

      // Complete the session
      await this.convex.mutation(api.agentSessions.complete, {
        id: this.sessionId,
        success: true,
      });

      // Update metrics
      await this.convex.mutation(api.thoughtSignatures.updateMetrics, {
        id: currentThought._id,
        apiCalls: this.actionsExecuted,
        tokensUsed: this.tokensUsed,
      });

      return {
        success: true,
        thoughtSignature: currentThought,
        actionsExecuted: this.actionsExecuted,
        tokensUsed: this.tokensUsed,
        nextScheduledAction:
          currentThought.nextAction.action !== "none"
            ? {
                action: currentThought.nextAction.action,
                scheduledFor: currentThought.nextAction.scheduledFor,
              }
            : undefined,
      };
    } catch (error) {
      // Complete session with error
      if (this.sessionId) {
        await this.convex.mutation(api.agentSessions.complete, {
          id: this.sessionId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      throw error;
    }
  }

  /**
   * Execute a single action based on the thought signature
   */
  private async executeAction(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; error?: string }> {
    const { action, channel } = thought.nextAction;
    const startedAt = Date.now();

    try {
      let result: any;

      switch (action) {
        case "parse_document":
          result = await this.executeParseDocument(thought);
          break;

        case "generate_invoice":
          result = await this.executeGenerateInvoice(thought);
          break;

        case "send_reminder":
          result = await this.executeSendReminder(thought, channel ?? "email");
          break;

        case "escalate":
          result = await this.executeEscalate(thought);
          break;

        case "try_alternate_channel":
          result = await this.executeTryAlternateChannel(thought);
          break;

        case "final_notice":
          result = await this.executeFinalNotice(thought);
          break;

        case "mark_collected":
          result = await this.executeMarkCollected(thought);
          break;

        case "mark_failed":
          result = await this.executeMarkFailed(thought);
          break;

        case "wait_for_response":
        case "wait_for_payment":
          // These are passive actions, nothing to execute
          result = { success: true };
          break;

        default:
          result = { success: false, error: `Unknown action: ${action}` };
      }

      // Record action in session
      if (this.sessionId) {
        await this.convex.mutation(api.agentSessions.recordAction, {
          id: this.sessionId,
          action: {
            type: action,
            startedAt,
            completedAt: Date.now(),
            success: result.success,
            result: result.data,
            error: result.error,
            tokensUsed: result.tokensUsed,
          },
        });
      }

      if (result.tokensUsed) {
        this.tokensUsed += result.tokensUsed;
      }

      return { success: result.success, error: result.error };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      if (this.sessionId) {
        await this.convex.mutation(api.agentSessions.recordAction, {
          id: this.sessionId,
          action: {
            type: action,
            startedAt,
            completedAt: Date.now(),
            success: false,
            error: errorMessage,
          },
        });
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * L1: Parse document to extract claim details
   */
  private async executeParseDocument(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    // In a real implementation, this would call the document parsing API
    // For now, we assume the claim already has the necessary details

    // Transition to L2
    await this.convex.mutation(api.thoughtSignatures.updateLevel, {
      id: thought._id,
      level: "L2_GENERATE",
      reasoning: "Document parsed, ready to generate communications",
    });

    return { success: true, data: { level: "L2_GENERATE" } };
  }

  /**
   * L2: Generate invoice or reminder message
   */
  private async executeGenerateInvoice(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    // Transition to L3 (ready to communicate)
    await this.convex.mutation(api.thoughtSignatures.updateLevel, {
      id: thought._id,
      level: "L3_COMMUNICATE",
      reasoning: "Invoice generated, ready to send communications",
    });

    return { success: true, data: { level: "L3_COMMUNICATE" } };
  }

  /**
   * L3: Send reminder via specified channel
   */
  private async executeSendReminder(
    thought: ThoughtSignature,
    channel: "email" | "sms" | "whatsapp"
  ): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    if (this.config.dryRun) {
      return { success: true, data: { dryRun: true, channel } };
    }

    const tone = ESCALATION_TONES[thought.escalationLevel] ?? "professional";

    // Generate message using AI
    const message = await generateMessage(
      {
        clientName: thought.context.clientName ?? "Client",
        amount: thought.context.invoiceAmount,
        currency: thought.context.currency,
        escalationLevel: thought.escalationLevel,
        previousMessages: thought.context.attemptHistory.map((a) =>
          `${a.channel} on ${new Date(a.sentAt).toISOString()}: ${a.messageType}`
        ),
      },
      channel,
      tone as any
    );

    // Record the attempt
    await this.convex.mutation(api.thoughtSignatures.recordAttempt, {
      id: thought._id,
      attempt: {
        channel,
        sentAt: Date.now(),
        messageType: tone,
        result: "sent", // Will be updated by webhook
      },
    });

    // In a real implementation, this would call the notification API
    // to actually send the message

    return {
      success: true,
      data: { channel, tone, messageGenerated: true },
      tokensUsed: message.tokensUsed,
    };
  }

  /**
   * Escalate the claim to next level
   */
  private async executeEscalate(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    if (thought.escalationLevel >= 4) {
      return { success: false, error: "Already at maximum escalation level" };
    }

    const newLevel = await this.convex.mutation(
      api.thoughtSignatures.escalate,
      {
        id: thought._id,
        reasoning: `Escalating after ${thought.context.attemptHistory.length} attempts with no response`,
      }
    );

    return { success: true, data: { newEscalationLevel: newLevel } };
  }

  /**
   * Try an alternate communication channel
   */
  private async executeTryAlternateChannel(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    // Determine which channels have been tried
    const triedChannels = new Set(
      thought.context.attemptHistory.map((a) => a.channel)
    );

    // Try channels in order: email -> sms -> whatsapp
    const channelPriority: Array<"email" | "sms" | "whatsapp"> = [
      "email",
      "sms",
      "whatsapp",
    ];
    const nextChannel = channelPriority.find((c) => !triedChannels.has(c));

    if (!nextChannel) {
      // All channels tried, escalate instead
      return this.executeEscalate(thought);
    }

    return this.executeSendReminder(thought, nextChannel);
  }

  /**
   * Send final notice before marking as failed
   */
  private async executeFinalNotice(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string; tokensUsed?: number }> {
    // Send a final notice via all available channels
    const result = await this.executeSendReminder(thought, "email");

    // Schedule failure if no response
    await this.convex.mutation(api.thoughtSignatures.setNextAction, {
      id: thought._id,
      action: "mark_failed",
      scheduledFor: Date.now() + WAIT_TIMES.afterFinalNotice,
      reasoning:
        "Final notice sent, will mark as failed if no response within 7 days",
    });

    return result;
  }

  /**
   * Mark claim as collected
   */
  private async executeMarkCollected(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    await this.convex.mutation(api.thoughtSignatures.markCollected, {
      id: thought._id,
      paymentAmount: thought.context.paymentReceived ?? thought.context.invoiceAmount,
      transactionHash: thought.context.paymentTransactionHash,
    });

    return { success: true, data: { level: "COLLECTED" } };
  }

  /**
   * Mark claim as failed (uncollectable)
   */
  private async executeMarkFailed(
    thought: ThoughtSignature
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    await this.convex.mutation(api.thoughtSignatures.markFailed, {
      id: thought._id,
      reason: "Maximum escalation reached with no response",
    });

    return { success: true, data: { level: "FAILED" } };
  }

  /**
   * Determine the next action based on current state
   */
  private async determineNextAction(
    thought: ThoughtSignature
  ): Promise<ThoughtSignature> {
    const now = Date.now();
    let nextAction: AgentAction;
    let scheduledFor: number;
    let reasoning: string;
    let channel: "email" | "sms" | "whatsapp" | undefined;

    const lastAttempt = thought.context.attemptHistory.at(-1);
    const daysSinceDue = thought.context.daysSinceDue;

    // Determine next action based on state
    switch (thought.level) {
      case "L1_PARSE":
        nextAction = "generate_invoice";
        scheduledFor = now;
        reasoning = "Parsed claim, generating invoice";
        break;

      case "L2_GENERATE":
        nextAction = "send_reminder";
        channel = "email";
        scheduledFor = now;
        reasoning = "Invoice ready, sending initial reminder";
        break;

      case "L3_COMMUNICATE":
        // Check last attempt result
        if (lastAttempt?.result === "bounced") {
          nextAction = "try_alternate_channel";
          scheduledFor = now + WAIT_TIMES.afterBounce;
          reasoning = `${lastAttempt.channel} bounced, trying alternate channel`;
        } else if (lastAttempt?.result === "replied") {
          // Analyze response and decide
          nextAction = "wait_for_payment";
          scheduledFor = now + 7 * 24 * 60 * 60 * 1000; // 7 days
          reasoning = "Client responded, waiting for payment";
        } else if (thought.escalationLevel >= 4) {
          nextAction = "final_notice";
          scheduledFor = now;
          reasoning = "Maximum escalation, sending final notice";
        } else if (thought.context.attemptHistory.length >= 3) {
          nextAction = "escalate";
          scheduledFor = now;
          reasoning = `${thought.context.attemptHistory.length} attempts with no response, escalating`;
        } else {
          // Schedule next reminder
          nextAction = "send_reminder";
          channel = this.determineNextChannel(thought);
          scheduledFor = now + this.getWaitTime(thought.escalationLevel);
          reasoning = `Waiting for response, will follow up via ${channel}`;
        }
        break;

      case "L4_COLLECT":
        if (thought.context.paymentReceived) {
          nextAction = "mark_collected";
          scheduledFor = now;
          reasoning = "Payment received, marking as collected";
        } else {
          nextAction = "wait_for_payment";
          scheduledFor = now + 24 * 60 * 60 * 1000; // 1 day
          reasoning = "Waiting for payment confirmation";
        }
        break;

      default:
        nextAction = "none";
        scheduledFor = now;
        reasoning = "No action required";
    }

    // Update thought signature
    await this.convex.mutation(api.thoughtSignatures.setNextAction, {
      id: thought._id,
      action: nextAction,
      channel,
      scheduledFor,
      reasoning,
    });

    // Return updated thought
    const updated = await this.convex.query(api.thoughtSignatures.getByClaim, {
      claimId: thought.claimId,
    });

    return updated as ThoughtSignature;
  }

  /**
   * Apply self-correction when an action fails
   */
  private async applySelfCorrection(
    thought: ThoughtSignature,
    failureReason: string
  ): Promise<ThoughtSignature> {
    const failedAction = thought.nextAction.action;
    let correctedTo: AgentAction;
    let reasoning: string;

    // Determine correction based on failure type
    if (failureReason.includes("bounce") || failureReason.includes("invalid")) {
      correctedTo = "try_alternate_channel";
      reasoning = "Communication failed, trying alternate channel";
    } else if (failureReason.includes("rate limit")) {
      correctedTo = "wait_for_response";
      reasoning = "Rate limited, scheduling retry";
    } else if (failedAction === "send_reminder") {
      correctedTo = "try_alternate_channel";
      reasoning = "Reminder failed, trying alternate channel";
    } else {
      // Generic fallback - wait and retry
      correctedTo = "wait_for_response";
      reasoning = `Action failed (${failureReason}), will retry later`;
    }

    // Record the correction
    await this.convex.mutation(api.thoughtSignatures.recordCorrection, {
      id: thought._id,
      correction: {
        failedAction,
        failureReason,
        correctedTo,
        reasoning,
      },
    });

    // Set the corrected action
    await this.convex.mutation(api.thoughtSignatures.setNextAction, {
      id: thought._id,
      action: correctedTo,
      scheduledFor: Date.now() + 60 * 60 * 1000, // 1 hour
      reasoning,
    });

    // Return updated thought
    const updated = await this.convex.query(api.thoughtSignatures.getByClaim, {
      claimId: thought.claimId,
    });

    return updated as ThoughtSignature;
  }

  /**
   * Determine the next channel to use
   */
  private determineNextChannel(
    thought: ThoughtSignature
  ): "email" | "sms" | "whatsapp" {
    const attemptCounts = {
      email: 0,
      sms: 0,
      whatsapp: 0,
    };

    for (const attempt of thought.context.attemptHistory) {
      attemptCounts[attempt.channel]++;
    }

    // Rotate through channels
    if (attemptCounts.email <= attemptCounts.sms) {
      return "email";
    } else if (attemptCounts.sms <= attemptCounts.whatsapp) {
      return "sms";
    } else {
      return "whatsapp";
    }
  }

  /**
   * Get wait time based on escalation level
   */
  private getWaitTime(escalationLevel: number): number {
    switch (escalationLevel) {
      case 0:
        return WAIT_TIMES.afterFriendlyReminder;
      case 1:
        return WAIT_TIMES.afterFollowUp;
      case 2:
        return WAIT_TIMES.afterFirmReminder;
      case 3:
        return WAIT_TIMES.afterUrgentReminder;
      case 4:
        return WAIT_TIMES.afterFinalNotice;
      default:
        return WAIT_TIMES.afterFollowUp;
    }
  }
}

/**
 * Factory function to create a Marathon Agent
 */
export function createMarathonAgent(config: Partial<AgentConfig> = {}) {
  return new MarathonAgent({
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
    ...config,
  });
}

/**
 * Run the Marathon Agent for a claim (convenience function)
 */
export async function runMarathonAgent(
  claimId: Id<"claims">,
  options: {
    sessionType?: "scheduled" | "webhook" | "manual" | "correction";
    dryRun?: boolean;
  } = {}
): Promise<AgentResult> {
  const agent = createMarathonAgent({
    dryRun: options.dryRun,
  });

  return agent.run(claimId, options.sessionType ?? "manual");
}
