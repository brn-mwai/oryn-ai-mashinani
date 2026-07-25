import { inngest } from "./client";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Marathon Agent Scheduler - runs every 5 minutes
export const agentScheduler = inngest.createFunction(
  {
    id: "agent-scheduler",
    name: "Marathon Agent Scheduler",
  },
  { cron: "*/5 * * * *" }, // Every 5 minutes
  async ({ event, step }) => {
    // Step 1: Get all thought signatures due for action
    const dueSignatures = await step.run("get-due-signatures", async () => {
      return await convex.query(api.thoughtSignatures.getDueForAction, {
        limit: 10,
      });
    });

    if (!dueSignatures || dueSignatures.length === 0) {
      return { processed: 0, message: "No signatures due for action" };
    }

    // Step 2: Process each signature
    const results = [];
    for (const signature of dueSignatures) {
      const result = await step.run(`process-${signature._id}`, async () => {
        return await processThoughtSignature(signature);
      });
      results.push(result);
    }

    return {
      processed: results.length,
      results,
    };
  }
);

// Process a single thought signature
async function processThoughtSignature(signature: any) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  try {
    // Create agent session
    const sessionId = await convex.mutation(api.agentSessions.create, {
      userId: signature.userId,
      claimId: signature.claimId,
      thoughtSignatureId: signature._id,
      sessionType: "scheduled",
      model: "gpt-4o-mini",
    });

    // Determine action based on current level
    let action: string;
    let result: any;

    switch (signature.level) {
      case "L1_PARSE":
        // Parse the claim and extract context
        action = "parse_claim";
        result = await parseClaimContext(signature);
        break;

      case "L2_GENERATE":
        // Generate reminder message
        action = "generate_message";
        result = await generateReminderMessage(signature, appUrl);
        break;

      case "L3_COMMUNICATE":
        // Send the reminder
        action = "send_reminder";
        result = await sendReminder(signature, appUrl);
        break;

      case "L4_COLLECT":
        // Check payment status
        action = "check_payment";
        result = await checkPaymentStatus(signature);
        break;

      default:
        action = "unknown";
        result = { success: false, error: "Unknown level" };
    }

    // Record the action
    const now = Date.now();
    await convex.mutation(api.agentSessions.recordAction, {
      id: sessionId,
      action: {
        type: action,
        startedAt: now,
        completedAt: now,
        success: result.success,
        result: result,
        error: result.error,
        tokensUsed: result.tokensUsed || 0,
      },
    });

    // Update thought signature based on result
    if (result.success) {
      await updateSignatureState(signature, result);
    } else {
      // Record correction attempt
      await convex.mutation(api.thoughtSignatures.recordCorrection, {
        id: signature._id,
        failedAction: action,
        failureReason: result.error || "Unknown error",
        correctedAction: determineCorrectionAction(signature, result),
      });
    }

    // Complete the session
    await convex.mutation(api.agentSessions.complete, {
      id: sessionId,
      success: result.success,
      error: result.success ? undefined : result.error,
    });

    return {
      signatureId: signature._id,
      action,
      success: result.success,
      nextLevel: result.nextLevel,
    };
  } catch (error: any) {
    console.error("Error processing signature:", error);
    return {
      signatureId: signature._id,
      success: false,
      error: error.message,
    };
  }
}

// Parse claim context (L1)
async function parseClaimContext(signature: any) {
  const claim = await convex.query(api.claims.get, { id: signature.claimId });
  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  const client = await convex.query(api.clients.get, { id: claim.clientId });

  // Update context with parsed data
  await convex.mutation(api.thoughtSignatures.updateContext, {
    id: signature._id,
    context: {
      clientName: client?.name || "Unknown",
      clientEmail: client?.email,
      clientPhone: client?.phone,
      invoiceAmount: claim.amount,
      dueDate: claim.dueDate,
      description: claim.description,
    },
  });

  // Transition to L2
  await convex.mutation(api.thoughtSignatures.updateLevel, {
    id: signature._id,
    level: "L2_GENERATE",
  });

  return {
    success: true,
    nextLevel: "L2_GENERATE",
    context: { clientName: client?.name, amount: claim.amount },
  };
}

// Generate reminder message (L2)
async function generateReminderMessage(signature: any, appUrl: string) {
  const claim = await convex.query(api.claims.get, { id: signature.claimId });
  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  // Determine tone based on escalation level
  const tones = ["friendly", "professional", "firm", "urgent", "final"];
  const tone = tones[Math.min(signature.escalationLevel || 0, 4)];

  try {
    // Call AI to generate message
    const response = await fetch(`${appUrl}/api/ai/generate-message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        claimId: signature.claimId,
        type: "email",
        tone,
        context: signature.context,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate message");
    }

    const data = await response.json();

    // Store generated message in context
    await convex.mutation(api.thoughtSignatures.updateContext, {
      id: signature._id,
      context: {
        ...signature.context,
        generatedMessage: data.message,
        generatedSubject: data.subject,
        tone,
      },
    });

    // Transition to L3
    await convex.mutation(api.thoughtSignatures.updateLevel, {
      id: signature._id,
      level: "L3_COMMUNICATE",
    });

    return {
      success: true,
      nextLevel: "L3_COMMUNICATE",
      tokensUsed: data.tokensUsed || 0,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Send reminder (L3)
async function sendReminder(signature: any, appUrl: string) {
  const context = signature.context || {};

  if (!context.clientEmail) {
    return { success: false, error: "No client email" };
  }

  try {
    // Send email
    const response = await fetch(`${appUrl}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment_reminder",
        claimId: signature.claimId,
        to: context.clientEmail,
        subject: context.generatedSubject || "Payment Reminder",
        body: context.generatedMessage,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send email");
    }

    // Record communication attempt
    await convex.mutation(api.thoughtSignatures.recordAttempt, {
      id: signature._id,
      channel: "email",
      success: true,
    });

    // Transition to L4 (monitoring)
    await convex.mutation(api.thoughtSignatures.updateLevel, {
      id: signature._id,
      level: "L4_COLLECT",
    });

    // Schedule next action (check payment in 24 hours)
    await convex.mutation(api.thoughtSignatures.setNextAction, {
      id: signature._id,
      action: "check_payment",
      scheduledFor: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      reasoning: "Waiting for client to make payment after reminder sent",
    });

    return {
      success: true,
      nextLevel: "L4_COLLECT",
    };
  } catch (error: any) {
    // Record failed attempt
    await convex.mutation(api.thoughtSignatures.recordAttempt, {
      id: signature._id,
      channel: "email",
      success: false,
      error: error.message,
    });

    return { success: false, error: error.message };
  }
}

// Check payment status (L4)
async function checkPaymentStatus(signature: any) {
  const claim = await convex.query(api.claims.get, { id: signature.claimId });
  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  // Check if payment received
  if (claim.status === "collected" || claim.amountPaid >= claim.amount) {
    // Mark as collected
    await convex.mutation(api.thoughtSignatures.markCollected, {
      id: signature._id,
      paymentHash: claim.paymentTxHash,
    });

    return {
      success: true,
      collected: true,
      amount: claim.amountPaid,
    };
  }

  // Payment not received - escalate
  const currentLevel = signature.escalationLevel || 0;
  const maxEscalation = 4;

  if (currentLevel >= maxEscalation) {
    // Mark as failed after max attempts
    await convex.mutation(api.thoughtSignatures.markFailed, {
      id: signature._id,
      reason: "Maximum escalation reached without payment",
    });

    return {
      success: true,
      collected: false,
      failed: true,
    };
  }

  // Escalate and send another reminder
  await convex.mutation(api.thoughtSignatures.updateLevel, {
    id: signature._id,
    level: "L2_GENERATE", // Go back to generate new message
  });

  // Increment escalation level
  await convex.mutation(api.thoughtSignatures.escalate, {
    id: signature._id,
  });

  // Schedule next action
  await convex.mutation(api.thoughtSignatures.setNextAction, {
    id: signature._id,
    action: "generate_escalated_message",
    scheduledFor: Date.now() + 1000, // Immediately
    reasoning: `Payment not received, escalating to level ${currentLevel + 1}`,
  });

  return {
    success: true,
    collected: false,
    escalated: true,
    newLevel: currentLevel + 1,
  };
}

// Update signature state based on result
async function updateSignatureState(signature: any, result: any) {
  if (result.nextLevel) {
    // Level transition handled in individual functions
  }
}

// Determine correction action when something fails
function determineCorrectionAction(signature: any, result: any): string {
  if (result.error?.includes("email")) {
    return "try_sms_instead";
  }
  if (result.error?.includes("not found")) {
    return "verify_data";
  }
  return "retry_with_delay";
}

// Event-triggered agent run (for webhooks, manual triggers)
export const agentRunOnEvent = inngest.createFunction(
  {
    id: "agent-run-on-event",
    name: "Agent Run on Event",
  },
  { event: "oryn/claim.created" },
  async ({ event, step }) => {
    const { claimId, userId } = event.data;

    // Create thought signature for new claim
    const signatureId = await step.run("create-signature", async () => {
      return await convex.mutation(api.thoughtSignatures.create, {
        userId,
        claimId,
        level: "L1_PARSE",
      });
    });

    // Set initial action
    await step.run("set-initial-action", async () => {
      await convex.mutation(api.thoughtSignatures.setNextAction, {
        id: signatureId,
        action: "parse_claim",
        scheduledFor: Date.now() + 1000, // Process immediately
        reasoning: "New claim created, starting collection process",
      });
    });

    return { signatureId };
  }
);

// Export all functions
export const functions = [agentScheduler, agentRunOnEvent];
