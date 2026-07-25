import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// AI model validator (matches schema)
const aiModelValidator = v.union(
  v.literal("gemini-2.0-flash"),
  v.literal("gemini-1.5-pro"),
  v.literal("gpt-4o"),
  v.literal("gpt-4o-mini"),
  v.literal("claude-sonnet-4-20250514"),
  v.literal("claude-haiku"),
  v.literal("llama-3.3-70b"),
  v.literal("llama-4-scout"),
  v.literal("ocr-groq")
);

// Log an AI action
export const log = mutation({
  args: {
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    documentId: v.optional(v.id("documents")),
    messageId: v.optional(v.id("messages")),
    type: v.union(
      v.literal("document_parse"),
      v.literal("message_generate"),
      v.literal("escalation_decision"),
      v.literal("semantic_search"),
      v.literal("embedding_generate"),
      v.literal("tone_analysis"),
      v.literal("data_extraction"),
      v.literal("ocr")
    ),
    model: aiModelValidator,
    fallbackChain: v.optional(v.array(aiModelValidator)),
    wasFallback: v.boolean(),
    input: v.any(),
    output: v.optional(v.any()),
    tokensInput: v.optional(v.number()),
    tokensOutput: v.optional(v.number()),
    tokensTotal: v.number(),
    costUsd: v.optional(v.number()),
    durationMs: v.number(),
    latencyMs: v.optional(v.number()),
    status: v.union(v.literal("success"), v.literal("error")),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("aiActions", {
      ...args,
      wasFallback: args.wasFallback,
      createdAt: Date.now(),
    });
  },
});

// Get AI actions for a user
export const listByUser = query({
  args: {
    userId: v.id("users"),
    type: v.optional(
      v.union(
        v.literal("document_parse"),
        v.literal("message_generate"),
        v.literal("escalation_decision"),
        v.literal("semantic_search"),
        v.literal("tone_analysis")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("aiActions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    return await query.order("desc").take(args.limit ?? 50);
  },
});

// Get AI actions for a claim
export const listByClaim = query({
  args: {
    claimId: v.id("claims"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("aiActions")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Get usage stats for a user
export const getUsageStats = query({
  args: {
    userId: v.id("users"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let actions = await ctx.db
      .query("aiActions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by date range if provided
    if (args.startDate) {
      actions = actions.filter((a) => a._creationTime >= args.startDate!);
    }
    if (args.endDate) {
      actions = actions.filter((a) => a._creationTime <= args.endDate!);
    }

    const totalTokens = actions.reduce((sum, a) => sum + a.tokensTotal, 0);
    const totalDuration = actions.reduce((sum, a) => sum + a.durationMs, 0);
    const successCount = actions.filter((a) => a.status === "success").length;
    const errorCount = actions.filter((a) => a.status === "error").length;

    const byType = {
      document_parse: actions.filter((a) => a.type === "document_parse").length,
      message_generate: actions.filter((a) => a.type === "message_generate").length,
      escalation_decision: actions.filter((a) => a.type === "escalation_decision").length,
      semantic_search: actions.filter((a) => a.type === "semantic_search").length,
      tone_analysis: actions.filter((a) => a.type === "tone_analysis").length,
    };

    const byModel = {
      "gemini-2.0-flash": actions.filter((a) => a.model === "gemini-2.0-flash").length,
      "gemini-1.5-pro": actions.filter((a) => a.model === "gemini-1.5-pro").length,
      "llama-3.3-70b": actions.filter((a) => a.model === "llama-3.3-70b").length,
    };

    return {
      totalActions: actions.length,
      totalTokens,
      totalDurationMs: totalDuration,
      averageDurationMs: actions.length > 0 ? totalDuration / actions.length : 0,
      successRate: actions.length > 0 ? (successCount / actions.length) * 100 : 0,
      successCount,
      errorCount,
      byType,
      byModel,
    };
  },
});

// Admin: Get global AI usage stats
export const getGlobalStats = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let actions = await ctx.db.query("aiActions").collect();

    // Filter by date range if provided
    if (args.startDate) {
      actions = actions.filter((a) => a._creationTime >= args.startDate!);
    }
    if (args.endDate) {
      actions = actions.filter((a) => a._creationTime <= args.endDate!);
    }

    const totalTokens = actions.reduce((sum, a) => sum + a.tokensTotal, 0);
    const uniqueUsers = new Set(actions.map((a) => a.userId)).size;

    return {
      totalActions: actions.length,
      totalTokens,
      uniqueUsers,
      actionsPerUser: uniqueUsers > 0 ? actions.length / uniqueUsers : 0,
      tokensPerUser: uniqueUsers > 0 ? totalTokens / uniqueUsers : 0,
    };
  },
});
