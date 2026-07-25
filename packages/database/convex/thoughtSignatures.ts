import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get thought signature for a claim
export const getByClaim = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("thoughtSignatures")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .first();
  },
});

// Get or create thought signature for a claim
export const getOrCreate = mutation({
  args: {
    claimId: v.id("claims"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if one already exists
    const existing = await ctx.db
      .query("thoughtSignatures")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .first();

    if (existing) return existing;

    // Get claim details to initialize context
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found");

    const client = await ctx.db.get(claim.clientId);
    const now = Date.now();
    const dueDate = claim.dueDate ?? now;
    const daysSinceDue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));

    // Create new thought signature
    const id = await ctx.db.insert("thoughtSignatures", {
      claimId: args.claimId,
      userId: args.userId,
      level: "L1_PARSE",
      context: {
        clientName: client?.name,
        clientEmail: client?.email,
        clientPhone: client?.phone,
        invoiceAmount: claim.amount,
        currency: claim.currency,
        dueDate: claim.dueDate,
        daysSinceDue: Math.max(0, daysSinceDue),
        attemptHistory: [],
      },
      nextAction: {
        action: "parse_document",
        scheduledFor: now,
        reasoning: "Initial parse of claim documents to extract details",
      },
      corrections: [],
      escalationLevel: 0,
      startedAt: now,
      lastUpdatedAt: now,
      totalActionsExecuted: 0,
      totalCorrections: 0,
      totalApiCalls: 0,
      totalTokensUsed: 0,
    });

    return await ctx.db.get(id);
  },
});

// Update thought signature level
export const updateLevel = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    level: v.union(
      v.literal("L1_PARSE"),
      v.literal("L2_GENERATE"),
      v.literal("L3_COMMUNICATE"),
      v.literal("L4_COLLECT"),
      v.literal("COLLECTED"),
      v.literal("FAILED")
    ),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    const now = Date.now();
    const updates: any = {
      level: args.level,
      lastUpdatedAt: now,
    };

    // If terminal state, set completedAt
    if (args.level === "COLLECTED" || args.level === "FAILED") {
      updates.completedAt = now;
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Update context after an action
export const updateContext = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    context: v.any(), // Accept any context updates
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    await ctx.db.patch(args.id, {
      context: { ...ts.context, ...args.context },
      lastUpdatedAt: Date.now(),
    });
  },
});

// Record a communication attempt
export const recordAttempt = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp")),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    const attempt = {
      channel: args.channel,
      sentAt: Date.now(),
      messageType: "reminder",
      result: args.success ? "sent" : "failed",
      error: args.error,
    };

    const attemptHistory = ts.context?.attemptHistory || [];

    await ctx.db.patch(args.id, {
      context: {
        ...ts.context,
        attemptHistory: [...attemptHistory, attempt],
      },
      totalActionsExecuted: ts.totalActionsExecuted + 1,
      lastUpdatedAt: Date.now(),
    });
  },
});

// Set next action
export const setNextAction = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    action: v.string(), // Accept any action string for flexibility
    channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"))),
    scheduledFor: v.number(),
    reasoning: v.string(),
  },
  handler: async (ctx, args) => {
    const { id, ...nextAction } = args;

    await ctx.db.patch(id, {
      nextAction,
      lastUpdatedAt: Date.now(),
    });
  },
});

// Record a self-correction
export const recordCorrection = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    failedAction: v.string(),
    failureReason: v.string(),
    correctedAction: v.string(),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    const now = Date.now();
    const correction = {
      failedAction: args.failedAction,
      failureReason: args.failureReason,
      correctedTo: args.correctedAction,
      reasoning: `Auto-correction from ${args.failedAction} to ${args.correctedAction}`,
      correctedAt: now,
    };

    await ctx.db.patch(args.id, {
      corrections: [...ts.corrections, correction],
      totalCorrections: ts.totalCorrections + 1,
      lastUpdatedAt: now,
    });
  },
});

// Escalate the claim
export const escalate = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    reasoning: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    if (ts.escalationLevel >= 4) {
      throw new Error("Already at maximum escalation level");
    }

    const newLevel = (ts.escalationLevel + 1) as 0 | 1 | 2 | 3 | 4;

    await ctx.db.patch(args.id, {
      escalationLevel: newLevel,
      lastUpdatedAt: Date.now(),
    });

    // Also escalate the claim itself
    const claim = await ctx.db.get(ts.claimId);
    if (claim && (claim.escalationLevel ?? 0) < 4) {
      await ctx.db.patch(ts.claimId, {
        escalationLevel: newLevel,
        updatedAt: Date.now(),
      });
    }

    return newLevel;
  },
});

// Update API usage metrics
export const updateMetrics = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    apiCalls: v.optional(v.number()),
    tokensUsed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    await ctx.db.patch(args.id, {
      totalApiCalls: ts.totalApiCalls + (args.apiCalls ?? 0),
      totalTokensUsed: ts.totalTokensUsed + (args.tokensUsed ?? 0),
      lastUpdatedAt: Date.now(),
    });
  },
});

// List active thought signatures for a user
export const listActive = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("thoughtSignatures")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        q.and(
          q.neq(q.field("level"), "COLLECTED"),
          q.neq(q.field("level"), "FAILED")
        )
      )
      .order("desc")
      .take(limit);
  },
});

// Get thought signatures due for action
export const getDueForAction = query({
  args: {
    before: v.optional(v.number()), // Get all with scheduledFor before this timestamp (default: now)
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const before = args.before ?? Date.now();

    // Get all non-terminal thought signatures
    const all = await ctx.db
      .query("thoughtSignatures")
      .filter((q) =>
        q.and(
          q.neq(q.field("level"), "COLLECTED"),
          q.neq(q.field("level"), "FAILED"),
          q.lte(q.field("nextAction.scheduledFor"), before)
        )
      )
      .take(limit);

    return all;
  },
});

// Create a new thought signature
export const create = mutation({
  args: {
    userId: v.id("users"),
    claimId: v.id("claims"),
    level: v.optional(v.union(
      v.literal("L1_PARSE"),
      v.literal("L2_GENERATE"),
      v.literal("L3_COMMUNICATE"),
      v.literal("L4_COLLECT")
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found");

    const client = await ctx.db.get(claim.clientId);

    const id = await ctx.db.insert("thoughtSignatures", {
      claimId: args.claimId,
      userId: args.userId,
      level: args.level ?? "L1_PARSE",
      context: {
        clientName: client?.name,
        clientEmail: client?.email,
        clientPhone: client?.phone,
        invoiceAmount: claim.amount,
        currency: claim.currency,
        dueDate: claim.dueDate,
        attemptHistory: [],
      },
      nextAction: {
        action: "parse_document",
        scheduledFor: now,
        reasoning: "Initial parse of claim to extract details",
      },
      corrections: [],
      escalationLevel: 0,
      startedAt: now,
      lastUpdatedAt: now,
      totalActionsExecuted: 0,
      totalCorrections: 0,
      totalApiCalls: 0,
      totalTokensUsed: 0,
    });

    return id;
  },
});

// Mark as collected
export const markCollected = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    paymentAmount: v.optional(v.number()),
    paymentHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      level: "COLLECTED",
      context: {
        ...ts.context,
        paymentReceived: args.paymentAmount,
        paymentTransactionHash: args.paymentHash,
      },
      nextAction: {
        action: "none",
        scheduledFor: now,
        reasoning: "Payment collected successfully",
      },
      completedAt: now,
      lastUpdatedAt: now,
    });
  },
});

// Mark as failed
export const markFailed = mutation({
  args: {
    id: v.id("thoughtSignatures"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const ts = await ctx.db.get(args.id);
    if (!ts) throw new Error("Thought signature not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      level: "FAILED",
      nextAction: {
        action: "none",
        scheduledFor: now,
        reasoning: args.reason,
      },
      completedAt: now,
      lastUpdatedAt: now,
    });
  },
});
