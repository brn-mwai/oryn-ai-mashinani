import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new agent session
export const create = mutation({
  args: {
    thoughtSignatureId: v.id("thoughtSignatures"),
    userId: v.id("users"),
    claimId: v.id("claims"),
    sessionType: v.union(
      v.literal("scheduled"),
      v.literal("webhook"),
      v.literal("manual"),
      v.literal("correction")
    ),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("agentSessions", {
      ...args,
      status: "running",
      actions: [],
      totalTokensUsed: 0,
      totalDurationMs: 0,
      startedAt: now,
    });
  },
});

// Record an action in the session
export const recordAction = mutation({
  args: {
    id: v.id("agentSessions"),
    action: v.object({
      type: v.string(),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      success: v.boolean(),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
      tokensUsed: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");

    const tokensUsed = args.action.tokensUsed ?? 0;

    await ctx.db.patch(args.id, {
      actions: [...session.actions, args.action],
      totalTokensUsed: session.totalTokensUsed + tokensUsed,
    });
  },
});

// Complete the session
export const complete = mutation({
  args: {
    id: v.id("agentSessions"),
    success: v.boolean(),
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.id);
    if (!session) throw new Error("Session not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: args.success ? "completed" : "failed",
      completedAt: now,
      totalDurationMs: now - session.startedAt,
      error: args.error,
      errorStack: args.errorStack,
    });
  },
});

// Pause the session (for long-running operations)
export const pause = mutation({
  args: {
    id: v.id("agentSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "paused",
    });
  },
});

// Resume a paused session
export const resume = mutation({
  args: {
    id: v.id("agentSessions"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "running",
    });
  },
});

// Get session by ID
export const get = query({
  args: { id: v.id("agentSessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List sessions for a thought signature
export const listByThoughtSignature = query({
  args: {
    thoughtSignatureId: v.id("thoughtSignatures"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("agentSessions")
      .withIndex("by_thought_signature", (q) =>
        q.eq("thoughtSignatureId", args.thoughtSignatureId)
      )
      .order("desc")
      .take(limit);
  },
});

// List recent sessions for a user
export const listByUser = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("paused")
    )),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("agentSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.take(limit);
  },
});

// Get running sessions (for monitoring)
export const getRunning = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    return await ctx.db
      .query("agentSessions")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .take(limit);
  },
});

// Get session stats for a user
export const getStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let sessions = await ctx.db
      .query("agentSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range
    if (args.startDate || args.endDate) {
      sessions = sessions.filter((s) => {
        if (args.startDate && s.startedAt < args.startDate) return false;
        if (args.endDate && s.startedAt > args.endDate) return false;
        return true;
      });
    }

    const completed = sessions.filter((s) => s.status === "completed");
    const failed = sessions.filter((s) => s.status === "failed");

    const totalTokens = sessions.reduce((sum, s) => sum + s.totalTokensUsed, 0);
    const totalDuration = sessions.reduce((sum, s) => sum + s.totalDurationMs, 0);
    const totalActions = sessions.reduce((sum, s) => sum + s.actions.length, 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completed.length,
      failedSessions: failed.length,
      successRate: sessions.length > 0
        ? (completed.length / sessions.length) * 100
        : 0,
      totalTokensUsed: totalTokens,
      totalDurationMs: totalDuration,
      totalActionsExecuted: totalActions,
      avgTokensPerSession: sessions.length > 0
        ? Math.round(totalTokens / sessions.length)
        : 0,
      avgDurationMs: sessions.length > 0
        ? Math.round(totalDuration / sessions.length)
        : 0,
    };
  },
});
