import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to generate unique tokens (replacing nanoid)
function generateToken(length: number = 24): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Get payment link by token
export const getByToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("paymentLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!link) return null;

    // Check if expired
    if (link.status === "expired" || link.expiresAt < Date.now()) {
      return { ...link, expired: true };
    }

    // Check if used
    if (link.status === "used") {
      return { ...link, alreadyUsed: true };
    }

    // Get claim details
    const claim = await ctx.db.get(link.claimId);
    if (!claim) return null;

    const client = await ctx.db.get(claim.clientId);

    return {
      ...link,
      claim,
      client,
      expired: false,
      alreadyUsed: false,
    };
  },
});

// Create payment link
export const create = mutation({
  args: {
    claimId: v.id("claims"),
    userId: v.id("users"),
    expiresIn: v.optional(v.number()), // seconds, default 7 days
    methods: v.optional(
      v.array(
        v.union(
          v.literal("card"),
          v.literal("bank_transfer"),
          v.literal("usdc")
        )
      )
    ),
    brandingEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Get claim to retrieve clientId, amount, and currency
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found");

    const token = generateToken(24);
    const expiresIn = args.expiresIn ?? 7 * 24 * 60 * 60; // 7 days default

    const linkId = await ctx.db.insert("paymentLinks", {
      claimId: args.claimId,
      userId: args.userId,
      clientId: claim.clientId,
      token,
      amount: claim.amount - claim.amountPaid,
      currency: claim.currency,
      expiresAt: Date.now() + expiresIn * 1000,
      methods: args.methods ?? ["card", "bank_transfer", "usdc"],
      status: "active",
      views: 0,
      brandingEnabled: args.brandingEnabled ?? true,
      createdAt: Date.now(),
    });

    return { linkId, token };
  },
});

// Mark payment link as used
export const markUsed = mutation({
  args: {
    token: v.string(),
    paymentId: v.optional(v.id("payments")),
  },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("paymentLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!link) throw new Error("Payment link not found");
    if (link.status === "used") throw new Error("Payment link already used");
    if (link.expiresAt < Date.now()) throw new Error("Payment link expired");

    await ctx.db.patch(link._id, {
      status: "used",
      usedAt: Date.now(),
      paymentId: args.paymentId,
    });
  },
});

// Get payment links for a claim
export const listByClaim = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("paymentLinks")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .order("desc")
      .collect();
  },
});

// List all payment links for a user
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("used"),
        v.literal("expired"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("paymentLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc");

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.take(limit);
  },
});

// Track view on payment link
export const trackView = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const link = await ctx.db
      .query("paymentLinks")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (link) {
      await ctx.db.patch(link._id, {
        views: (link.views || 0) + 1,
        lastViewedAt: Date.now(),
      });
    }
  },
});

// Get active payment links by amount (for matching incoming Arc payments)
export const getByAmount = query({
  args: {
    amount: v.number(),
    status: v.optional(v.string()),
    tolerance: v.optional(v.number()), // Amount tolerance for matching (default 0.01)
  },
  handler: async (ctx, args) => {
    const tolerance = args.tolerance ?? 0.01;
    const minAmount = args.amount - tolerance;
    const maxAmount = args.amount + tolerance;

    // Get active payment links
    let links = await ctx.db
      .query("paymentLinks")
      .filter((q) => q.eq(q.field("status"), args.status ?? "active"))
      .collect();

    // Filter by amount within tolerance
    links = links.filter(
      (link) => link.amount >= minAmount && link.amount <= maxAmount
    );

    // Sort by most recent first
    links.sort((a, b) => b.createdAt - a.createdAt);

    return links;
  },
});

// Delete expired links (cleanup job)
export const cleanupExpired = mutation({
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("paymentLinks")
      .filter((q) =>
        q.and(
          q.lt(q.field("expiresAt"), now),
          q.eq(q.field("status"), "active")
        )
      )
      .collect();

    // Mark as expired instead of deleting
    await Promise.all(
      expired.map((link) => ctx.db.patch(link._id, { status: "expired" }))
    );

    return expired.length;
  },
});
