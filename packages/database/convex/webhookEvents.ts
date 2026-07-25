import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new webhook event (for audit logging)
export const create = mutation({
  args: {
    provider: v.union(
      v.literal("clerk"),
      v.literal("stripe"),
      v.literal("circle"),
      v.literal("arc"),
      v.literal("resend"),
      v.literal("twilio"),
      v.literal("whatsapp"),
      v.literal("uploadthing"),
      v.literal("inngest")
    ),
    eventType: v.string(),
    eventId: v.optional(v.string()),
    payload: v.any(),
    userId: v.optional(v.id("users")),
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    messageId: v.optional(v.id("messages")),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("webhookEvents", {
      provider: args.provider,
      eventType: args.eventType,
      eventId: args.eventId,
      payload: args.payload,
      status: "received",
      userId: args.userId,
      claimId: args.claimId,
      paymentId: args.paymentId,
      messageId: args.messageId,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: Date.now(),
    });
  },
});

// Update webhook event status
export const updateStatus = mutation({
  args: {
    id: v.id("webhookEvents"),
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed"),
      v.literal("ignored")
    ),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
    userId: v.optional(v.id("users")),
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    messageId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const { id, status, error, metadata, ...relations } = args;

    const updates: Record<string, unknown> = {
      status,
    };

    if (status === "processed" || status === "failed") {
      updates.processedAt = Date.now();
    }

    if (error) {
      updates.error = error;
    }

    if (metadata) {
      updates.metadata = metadata;
    }

    // Add any relation IDs if provided
    if (relations.userId) updates.userId = relations.userId;
    if (relations.claimId) updates.claimId = relations.claimId;
    if (relations.paymentId) updates.paymentId = relations.paymentId;
    if (relations.messageId) updates.messageId = relations.messageId;

    await ctx.db.patch(id, updates);
  },
});

// Update status by event ID (for idempotency)
export const updateStatusByEventId = mutation({
  args: {
    eventId: v.string(),
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed"),
      v.literal("ignored")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();

    if (event) {
      const updates: Record<string, unknown> = {
        status: args.status,
      };

      if (args.status === "processed" || args.status === "failed") {
        updates.processedAt = Date.now();
      }

      if (args.error) {
        updates.error = args.error;
      }

      await ctx.db.patch(event._id, updates);
    }
  },
});

// Get webhook event by provider's event ID (for idempotency checks)
export const getByEventId = query({
  args: { eventId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhookEvents")
      .withIndex("by_event_id", (q) => q.eq("eventId", args.eventId))
      .first();
  },
});

// List recent webhook events (for debugging/admin)
export const listRecent = query({
  args: {
    provider: v.optional(
      v.union(
        v.literal("clerk"),
        v.literal("stripe"),
        v.literal("circle"),
        v.literal("arc"),
        v.literal("resend"),
        v.literal("twilio"),
        v.literal("whatsapp"),
        v.literal("uploadthing"),
        v.literal("inngest")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("received"),
        v.literal("processing"),
        v.literal("processed"),
        v.literal("failed"),
        v.literal("ignored")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("webhookEvents").order("desc");

    if (args.provider) {
      query = query.filter((q) => q.eq(q.field("provider"), args.provider));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.take(args.limit ?? 50);
  },
});

// Get failed webhook events (for retry processing)
export const listFailed = query({
  args: {
    provider: v.optional(
      v.union(
        v.literal("clerk"),
        v.literal("stripe"),
        v.literal("circle"),
        v.literal("arc"),
        v.literal("resend"),
        v.literal("twilio"),
        v.literal("whatsapp"),
        v.literal("uploadthing"),
        v.literal("inngest")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("webhookEvents")
      .withIndex("by_status", (q) => q.eq("status", "failed"));

    if (args.provider) {
      query = query.filter((q) => q.eq(q.field("provider"), args.provider));
    }

    return await query.take(args.limit ?? 50);
  },
});
