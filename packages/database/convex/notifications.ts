import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List notifications for a user
export const list = query({
  args: {
    userId: v.id("users"),
    unreadOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    if (args.unreadOnly) {
      return await ctx.db
        .query("notifications")
        .withIndex("by_user_and_read", (q) =>
          q.eq("userId", args.userId).eq("read", false)
        )
        .order("desc")
        .take(limit);
    }

    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Get unread count
export const getUnreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    return unread.length;
  },
});

// Create notification
export const create = mutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("payment_received"),
      v.literal("claim_status_change"),
      v.literal("message_delivered"),
      v.literal("message_read"),
      v.literal("message_failed"),
      v.literal("message_received"),
      v.literal("escalation"),
      v.literal("document_parsed"),
      v.literal("document_failed"),
      v.literal("withdrawal_completed"),
      v.literal("withdrawal_failed"),
      v.literal("kyc_update"),
      v.literal("security_alert"),
      v.literal("referral_signup"),
      v.literal("referral_reward"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    link: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("normal"), v.literal("high"), v.literal("urgent"))),
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    messageId: v.optional(v.id("messages")),
    documentId: v.optional(v.id("documents")),
    transactionId: v.optional(v.id("transactions")),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      read: false,
      link: args.link,
      priority: args.priority ?? "normal",
      claimId: args.claimId,
      paymentId: args.paymentId,
      messageId: args.messageId,
      documentId: args.documentId,
      transactionId: args.transactionId,
      metadata: args.metadata,
      createdAt: Date.now(),
    });
  },
});

// Mark as read
export const markAsRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { read: true });
  },
});

// Mark all as read for user
export const markAllAsRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("read", false)
      )
      .collect();

    await Promise.all(
      unread.map((n) => ctx.db.patch(n._id, { read: true }))
    );

    return unread.length;
  },
});

// Delete notification
export const remove = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Delete all read notifications for user
export const clearRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const read = await ctx.db
      .query("notifications")
      .withIndex("by_user_and_read", (q) =>
        q.eq("userId", args.userId).eq("read", true)
      )
      .collect();

    await Promise.all(read.map((n) => ctx.db.delete(n._id)));

    return read.length;
  },
});
