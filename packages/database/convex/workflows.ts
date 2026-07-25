import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List all workflows for a user
export const list = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single workflow
export const get = query({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get workflows by type
export const getByType = query({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("auto_reminder"),
      v.literal("smart_escalation"),
      v.literal("payment_confirmation"),
      v.literal("document_processing"),
      v.literal("multi_channel")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .first();
  },
});

// Get enabled workflows
export const getEnabled = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workflows")
      .withIndex("by_user_and_enabled", (q) =>
        q.eq("userId", args.userId).eq("enabled", true)
      )
      .collect();
  },
});

// Create a new workflow
export const create = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    type: v.union(
      v.literal("auto_reminder"),
      v.literal("smart_escalation"),
      v.literal("payment_confirmation"),
      v.literal("document_processing"),
      v.literal("multi_channel")
    ),
    trigger: v.object({
      event: v.union(
        v.literal("claim_overdue"),
        v.literal("payment_received"),
        v.literal("document_uploaded"),
        v.literal("scheduled"),
        v.literal("manual")
      ),
      conditions: v.optional(v.object({
        daysOverdue: v.optional(v.number()),
        minAmount: v.optional(v.number()),
        escalationLevel: v.optional(v.number()),
      })),
      schedule: v.optional(v.object({
        frequency: v.union(v.literal("daily"), v.literal("weekly")),
        time: v.string(),
        timezone: v.string(),
      })),
    }),
    actions: v.array(v.object({
      type: v.union(
        v.literal("send_reminder"),
        v.literal("escalate_claim"),
        v.literal("send_thank_you"),
        v.literal("parse_document"),
        v.literal("create_claim"),
        v.literal("notify_user")
      ),
      config: v.optional(v.object({
        channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"))),
        tone: v.optional(v.union(v.literal("friendly"), v.literal("professional"), v.literal("firm"))),
        delayMinutes: v.optional(v.number()),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("workflows", {
      userId: args.userId,
      name: args.name,
      description: args.description,
      enabled: true,
      type: args.type,
      trigger: args.trigger,
      actions: args.actions,
      stats: {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
      },
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Toggle workflow enabled/disabled
export const toggle = mutation({
  args: {
    id: v.id("workflows"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      enabled: args.enabled,
      updatedAt: Date.now(),
    });
  },
});

// Update workflow stats after a run
export const updateStats = mutation({
  args: {
    id: v.id("workflows"),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return;

    await ctx.db.patch(args.id, {
      stats: {
        totalRuns: workflow.stats.totalRuns + 1,
        successfulRuns: workflow.stats.successfulRuns + (args.success ? 1 : 0),
        failedRuns: workflow.stats.failedRuns + (args.success ? 0 : 1),
        lastRunAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  },
});

// Delete a workflow
export const remove = mutation({
  args: {
    id: v.id("workflows"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Initialize default workflows for a new user
export const initializeDefaults = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const defaultStats = { totalRuns: 0, successfulRuns: 0, failedRuns: 0 };

    // Check if user already has workflows
    const existing = await ctx.db
      .query("workflows")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) return; // Already initialized

    // Auto Reminder
    await ctx.db.insert("workflows", {
      userId: args.userId,
      name: "Automatic Payment Reminders",
      description: "Send reminders when invoices become overdue",
      enabled: true,
      type: "auto_reminder",
      trigger: {
        event: "claim_overdue",
        conditions: { daysOverdue: 1 },
      },
      actions: [
        { type: "send_reminder", config: { channel: "email", tone: "friendly" } },
        { type: "notify_user" },
      ],
      stats: defaultStats,
      createdAt: now,
      updatedAt: now,
    });

    // Smart Escalation
    await ctx.db.insert("workflows", {
      userId: args.userId,
      name: "Smart Claim Escalation",
      description: "Automatically escalate claims based on age",
      enabled: true,
      type: "smart_escalation",
      trigger: {
        event: "scheduled",
        schedule: { frequency: "daily", time: "09:00", timezone: "America/New_York" },
      },
      actions: [
        { type: "escalate_claim" },
        { type: "send_reminder", config: { tone: "firm" } },
        { type: "notify_user" },
      ],
      stats: defaultStats,
      createdAt: now,
      updatedAt: now,
    });

    // Payment Confirmation
    await ctx.db.insert("workflows", {
      userId: args.userId,
      name: "Payment Confirmation",
      description: "Send thank you messages when payments are received",
      enabled: true,
      type: "payment_confirmation",
      trigger: { event: "payment_received" },
      actions: [
        { type: "send_thank_you", config: { channel: "email", tone: "friendly" } },
        { type: "notify_user" },
      ],
      stats: defaultStats,
      createdAt: now,
      updatedAt: now,
    });

    // Document Processing
    await ctx.db.insert("workflows", {
      userId: args.userId,
      name: "Document Auto-Processing",
      description: "Extract data from uploaded documents",
      enabled: true,
      type: "document_processing",
      trigger: { event: "document_uploaded" },
      actions: [
        { type: "parse_document" },
        { type: "create_claim" },
        { type: "notify_user" },
      ],
      stats: defaultStats,
      createdAt: now,
      updatedAt: now,
    });
  },
});
