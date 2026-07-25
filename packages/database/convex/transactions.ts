import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a transaction record
export const create = mutation({
  args: {
    walletId: v.id("wallets"),
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    type: v.union(
      v.literal("deposit"),
      v.literal("withdrawal"),
      v.literal("payment_received"),
      v.literal("fee"),
      v.literal("refund"),
      v.literal("transfer_in"),
      v.literal("transfer_out"),
      v.literal("adjustment"),
      v.literal("referral_reward")
    ),
    amount: v.number(),
    fee: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    currency: v.union(
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("GBP"),
      v.literal("CAD"),
      v.literal("AUD"),
      v.literal("USDC"),
      v.literal("EURC")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    description: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
    chain: v.optional(
      v.union(
        v.literal("ethereum"),
        v.literal("polygon"),
        v.literal("solana"),
        v.literal("avalanche"),
        v.literal("arc")
      )
    ),
    fromAddress: v.optional(v.string()),
    toAddress: v.optional(v.string()),
    destinationAddress: v.optional(v.string()),
    circleTransferId: v.optional(v.string()),
    arcTransactionId: v.optional(v.string()),
    stripePayoutId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("transactions", {
      ...args,
      createdAt: now,
    });
  },
});

// Get transaction by ID
export const get = query({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// List transactions for a wallet
export const listByWallet = query({
  args: {
    walletId: v.id("wallets"),
    type: v.optional(
      v.union(
        v.literal("deposit"),
        v.literal("withdrawal"),
        v.literal("payment_received"),
        v.literal("fee"),
        v.literal("refund"),
        v.literal("transfer_in"),
        v.literal("transfer_out")
      )
    ),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("cancelled")
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("transactions")),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100);

    let query = ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId))
      .order("desc");

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    const transactions = await query.take(limit + 1);
    const hasMore = transactions.length > limit;
    const data = hasMore ? transactions.slice(0, limit) : transactions;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    return { data, hasMore, nextCursor };
  },
});

// List transactions for a user
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

// Update transaction status
export const updateStatus = mutation({
  args: {
    id: v.id("transactions"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    transactionHash: v.optional(v.string()),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const transaction = await ctx.db.get(id);
    if (!transaction) throw new Error("Transaction not found");

    await ctx.db.patch(id, {
      ...updates,
      metadata: updates.metadata
        ? { ...transaction.metadata, ...updates.metadata }
        : transaction.metadata,
    });
  },
});

// Get transaction by Arc transaction ID
export const getByArcTransactionId = query({
  args: { arcTransactionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("arcTransactionId"), args.arcTransactionId))
      .first();
  },
});

// Get transaction by transaction hash
export const getByTransactionHash = query({
  args: { transactionHash: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("transactionHash"), args.transactionHash))
      .first();
  },
});

// Get transactions for a claim
export const listByClaim = query({
  args: {
    claimId: v.id("claims"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    return await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("claimId"), args.claimId))
      .order("desc")
      .take(limit);
  },
});
