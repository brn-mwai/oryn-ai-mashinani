import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// NLP Command status validator
const nlpCommandStatusValidator = v.union(
  v.literal("processing"),
  v.literal("awaiting_confirmation"),
  v.literal("executed"),
  v.literal("failed")
);

// NLP Action status validator
const nlpActionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("executing"),
  v.literal("completed"),
  v.literal("failed")
);

// ============================================
// NLP Commands
// ============================================

// Create a new NLP command record
export const create = mutation({
  args: {
    userId: v.id("users"),
    rawInput: v.string(),
    intent: v.string(),
    confidence: v.number(),
    entities: v.object({
      clientId: v.optional(v.id("clients")),
      claimId: v.optional(v.id("claims")),
      clientName: v.optional(v.string()),
      amount: v.optional(v.number()),
      channel: v.optional(v.string()),
      dueDate: v.optional(v.number()),
    }),
    actions: v.array(
      v.object({
        type: v.string(),
        status: nlpActionStatusValidator,
        params: v.optional(v.any()),
        result: v.optional(v.any()),
        error: v.optional(v.string()),
        executedAt: v.optional(v.number()),
      })
    ),
    status: nlpCommandStatusValidator,
    requiresConfirmation: v.boolean(),
    confirmationMessage: v.optional(v.string()),
    model: v.string(),
    tokensUsed: v.number(),
    durationMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const commandId = await ctx.db.insert("nlpCommands", {
      ...args,
      createdAt: now,
    });

    return commandId;
  },
});

// Get NLP command by ID
export const get = query({
  args: { id: v.id("nlpCommands") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get user's NLP commands
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("nlpCommands")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get pending commands (for processing)
export const getPending = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("nlpCommands")
      .withIndex("by_status", (q) => q.eq("status", "processing"))
      .take(100);
  },
});

// Update command status
export const updateStatus = mutation({
  args: {
    id: v.id("nlpCommands"),
    status: nlpCommandStatusValidator,
    response: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.response) {
      updates.response = args.response;
    }

    if (args.status === "executed" || args.status === "failed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);
  },
});

// Update action status within a command
export const updateActionStatus = mutation({
  args: {
    id: v.id("nlpCommands"),
    actionIndex: v.number(),
    status: nlpActionStatusValidator,
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.id);
    if (!command) throw new Error("NLP command not found");

    const actions = [...command.actions];

    if (args.actionIndex < 0 || args.actionIndex >= actions.length) {
      throw new Error("Invalid action index");
    }

    actions[args.actionIndex] = {
      ...actions[args.actionIndex],
      status: args.status,
      result: args.result,
      error: args.error,
      executedAt:
        args.status === "completed" || args.status === "failed"
          ? Date.now()
          : undefined,
    };

    await ctx.db.patch(args.id, { actions });
  },
});

// Confirm command execution
export const confirm = mutation({
  args: {
    id: v.id("nlpCommands"),
  },
  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.id);
    if (!command) throw new Error("NLP command not found");

    if (command.status !== "awaiting_confirmation") {
      throw new Error("Command is not awaiting confirmation");
    }

    await ctx.db.patch(args.id, {
      status: "processing",
      confirmedAt: Date.now(),
    });
  },
});

// Cancel command
export const cancel = mutation({
  args: {
    id: v.id("nlpCommands"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const command = await ctx.db.get(args.id);
    if (!command) throw new Error("NLP command not found");

    await ctx.db.patch(args.id, {
      status: "failed",
      response: args.reason || "Command cancelled by user",
      completedAt: Date.now(),
    });
  },
});

// Get command statistics for user
export const getStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let commands = await ctx.db
      .query("nlpCommands")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      commands = commands.filter((cmd) => {
        if (args.startDate && cmd.createdAt < args.startDate) return false;
        if (args.endDate && cmd.createdAt > args.endDate) return false;
        return true;
      });
    }

    // Calculate statistics
    const total = commands.length;
    const executed = commands.filter((c) => c.status === "executed").length;
    const failed = commands.filter((c) => c.status === "failed").length;
    const pending = commands.filter(
      (c) => c.status === "processing" || c.status === "awaiting_confirmation"
    ).length;

    const totalTokens = commands.reduce((sum, c) => sum + c.tokensUsed, 0);
    const avgDuration =
      total > 0
        ? Math.round(commands.reduce((sum, c) => sum + c.durationMs, 0) / total)
        : 0;

    // Intent breakdown
    const intentCounts: Record<string, number> = {};
    for (const cmd of commands) {
      intentCounts[cmd.intent] = (intentCounts[cmd.intent] || 0) + 1;
    }

    return {
      total,
      executed,
      failed,
      pending,
      successRate: total > 0 ? Math.round((executed / total) * 100) : 0,
      totalTokens,
      avgDuration,
      intentBreakdown: intentCounts,
    };
  },
});

// Search commands by intent
export const searchByIntent = query({
  args: {
    intent: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("nlpCommands")
      .withIndex("by_intent", (q) => q.eq("intent", args.intent))
      .order("desc")
      .take(limit);
  },
});
