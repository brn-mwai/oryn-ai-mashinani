import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List messages for a claim
export const listByClaim = query({
  args: {
    claimId: v.id("claims"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// Get single message
export const get = query({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get message by provider-specific ID (for webhook updates)
export const getByResendId = query({
  args: { resendId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_resend_id", (q) => q.eq("resendId", args.resendId))
      .first();
  },
});

export const getByTwilioSid = query({
  args: { twilioSid: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_twilio_sid", (q) => q.eq("twilioSid", args.twilioSid))
      .first();
  },
});

export const getByWhatsappMsgId = query({
  args: { whatsappMsgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_whatsapp_msg_id", (q) => q.eq("whatsappMsgId", args.whatsappMsgId))
      .first();
  },
});

// Create message
export const create = mutation({
  args: {
    claimId: v.id("claims"),
    userId: v.id("users"),
    clientId: v.id("clients"),
    channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp")),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),
    content: v.string(),
    subject: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("queued"),
        v.literal("sent"),
        v.literal("delivered"),
        v.literal("failed"),
        v.literal("read")
      )
    ),
    resendId: v.optional(v.string()),
    twilioSid: v.optional(v.string()),
    whatsappMsgId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Get client to determine recipient
    const client = await ctx.db.get(args.clientId);
    let recipient = "";
    if (client) {
      if (args.channel === "email") recipient = client.email ?? "";
      else if (args.channel === "sms") recipient = client.phone ?? "";
      else if (args.channel === "whatsapp") recipient = client.whatsapp ?? client.phone ?? "";
    }

    return await ctx.db.insert("messages", {
      claimId: args.claimId,
      userId: args.userId,
      clientId: args.clientId,
      channel: args.channel,
      direction: args.direction,
      content: args.content,
      subject: args.subject,
      recipient,
      status: args.status ?? "draft",
      aiGenerated: false,
      ownerNotified: false,
      createdAt: Date.now(),
      resendId: args.resendId,
      twilioSid: args.twilioSid,
      whatsappMsgId: args.whatsappMsgId,
      metadata: args.metadata,
    });
  },
});

// Update message status
export const updateStatus = mutation({
  args: {
    id: v.id("messages"),
    status: v.union(
      v.literal("draft"),
      v.literal("queued"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("read")
    ),
    resendId: v.optional(v.string()),
    twilioSid: v.optional(v.string()),
    whatsappMsgId: v.optional(v.string()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, metadata, ...updates } = args;
    const message = await ctx.db.get(id);
    if (!message) throw new Error("Message not found");

    await ctx.db.patch(id, {
      ...updates,
      metadata: metadata
        ? { ...message.metadata, ...metadata }
        : message.metadata,
    });
  },
});

// Queue message for sending
export const queue = mutation({
  args: { id: v.id("messages") },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (!message) throw new Error("Message not found");
    if (message.status !== "draft") {
      throw new Error("Only draft messages can be queued");
    }

    await ctx.db.patch(args.id, { status: "queued" });
  },
});

// Mark message as sent with provider-specific ID
export const markSent = mutation({
  args: {
    id: v.id("messages"),
    resendId: v.optional(v.string()),
    twilioSid: v.optional(v.string()),
    whatsappMsgId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = {
      status: "sent",
      sentAt: Date.now(),
    };

    if (args.resendId) updates.resendId = args.resendId;
    if (args.twilioSid) updates.twilioSid = args.twilioSid;
    if (args.whatsappMsgId) updates.whatsappMsgId = args.whatsappMsgId;

    await ctx.db.patch(args.id, updates);
  },
});

// List messages by user
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"))),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.channel) {
      query = query.filter((q) => q.eq(q.field("channel"), args.channel));
    }

    return await query.take(args.limit ?? 50);
  },
});

// Get message counts by channel for a user
export const getStatsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const byChannel = {
      email: messages.filter((m) => m.channel === "email").length,
      sms: messages.filter((m) => m.channel === "sms").length,
      whatsapp: messages.filter((m) => m.channel === "whatsapp").length,
    };

    const byStatus = {
      sent: messages.filter((m) => m.status === "sent").length,
      delivered: messages.filter((m) => m.status === "delivered").length,
      failed: messages.filter((m) => m.status === "failed").length,
    };

    return { ...byChannel, delivered: byStatus.delivered, total: messages.length };
  },
});
