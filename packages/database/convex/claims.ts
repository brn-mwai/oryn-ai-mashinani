import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List claims for a user with cursor pagination
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("collected"),
        v.literal("written_off")
      )
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.id("claims")),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 20, 100); // Cap at 100

    let query;
    if (args.status) {
      query = ctx.db
        .query("claims")
        .withIndex("by_user_and_status", (q) =>
          q.eq("userId", args.userId).eq("status", args.status!)
        )
        .order("desc");
    } else {
      query = ctx.db
        .query("claims")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc");
    }

    const claims = await query.take(limit + 1);
    const hasMore = claims.length > limit;
    const data = hasMore ? claims.slice(0, limit) : claims;
    const nextCursor = hasMore ? data[data.length - 1]._id : null;

    return {
      data,
      hasMore,
      nextCursor,
    };
  },
});

// Get single claim
export const get = query({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get claim with related data
export const getWithDetails = query({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) return null;

    const [client, messages, payments, documents] = await Promise.all([
      ctx.db.get(claim.clientId),
      ctx.db
        .query("messages")
        .withIndex("by_claim", (q) => q.eq("claimId", args.id))
        .collect(),
      ctx.db
        .query("payments")
        .withIndex("by_claim", (q) => q.eq("claimId", args.id))
        .collect(),
      Promise.all(claim.documentIds.map((id) => ctx.db.get(id))),
    ]);

    return {
      claim,
      client,
      messages,
      payments,
      documents: documents.filter(Boolean),
    };
  },
});

// Create new claim
export const create = mutation({
  args: {
    userId: v.id("users"),
    clientId: v.id("clients"),
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    currency: v.optional(
      v.union(
        v.literal("KES"),
        v.literal("USD"),
        v.literal("EUR"),
        v.literal("GBP"),
        v.literal("CAD"),
        v.literal("AUD"),
        v.literal("USDC"),
        v.literal("EURC")
      )
    ),
    dueDate: v.optional(v.number()),
    documentIds: v.optional(v.array(v.id("documents"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const claimId = await ctx.db.insert("claims", {
      userId: args.userId,
      clientId: args.clientId,
      title: args.title,
      description: args.description,
      amount: args.amount,
      amountPaid: 0,
      currency: args.currency ?? "USD",
      dueDate: args.dueDate,
      status: "draft",
      escalationLevel: 0,
      reminderCount: 0,
      documentIds: args.documentIds ?? [],
      createdAt: now,
      updatedAt: now,
    });

    // Update client's total owed
    const client = await ctx.db.get(args.clientId);
    if (client) {
      await ctx.db.patch(args.clientId, {
        totalOwed: client.totalOwed + args.amount,
        status: "owing",
        updatedAt: Date.now(),
      });
    }

    return claimId;
  },
});

// Update claim
export const update = mutation({
  args: {
    id: v.id("claims"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    amount: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("collected"),
        v.literal("written_off")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const claim = await ctx.db.get(id);
    if (!claim) throw new Error("Claim not found");

    // Handle amount change for client totals
    if (updates.amount !== undefined && updates.amount !== claim.amount) {
      const client = await ctx.db.get(claim.clientId);
      if (client) {
        const diff = updates.amount - claim.amount;
        await ctx.db.patch(claim.clientId, {
          totalOwed: client.totalOwed + diff,
          updatedAt: Date.now(),
        });
      }
    }

    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Activate claim (start collection)
export const activate = mutation({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");
    if (claim.status !== "draft" && claim.status !== "paused") {
      throw new Error("Claim cannot be activated");
    }

    await ctx.db.patch(args.id, {
      status: "active",
      escalationLevel: 0,
      updatedAt: Date.now(),
    });
  },
});

// Pause claim
export const pause = mutation({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "paused",
      updatedAt: Date.now(),
    });
  },
});

// Escalate claim
export const escalate = mutation({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");
    if (claim.escalationLevel >= 4) {
      throw new Error("Claim already at maximum escalation");
    }

    const newLevel = (claim.escalationLevel + 1) as 0 | 1 | 2 | 3 | 4;
    await ctx.db.patch(args.id, {
      escalationLevel: newLevel,
      updatedAt: Date.now(),
    });

    return newLevel;
  },
});

// Mark claim as collected
export const markCollected = mutation({
  args: { id: v.id("claims") },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      status: "collected",
      amountPaid: claim.amount,
      collectedAt: now,
      updatedAt: now,
    });

    // Update client status
    const client = await ctx.db.get(claim.clientId);
    if (client) {
      const newOwed = client.totalOwed - claim.amount;
      await ctx.db.patch(claim.clientId, {
        totalOwed: newOwed,
        totalPaid: client.totalPaid + claim.amount,
        status: newOwed <= 0 ? "paid" : "owing",
        updatedAt: Date.now(),
      });
    }
  },
});

// Record partial or full payment on a claim
export const recordPayment = mutation({
  args: {
    id: v.id("claims"),
    amount: v.number(),
    paymentId: v.optional(v.id("payments")),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");

    const newAmountPaid = (claim.amountPaid || 0) + args.amount;
    const now = Date.now();

    // Check if fully paid
    const isFullyPaid = newAmountPaid >= claim.amount;

    await ctx.db.patch(args.id, {
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "collected" : claim.status,
      collectedAt: isFullyPaid ? now : claim.collectedAt,
      lastPaymentAt: now,
      updatedAt: now,
    });

    // Update client totals
    const client = await ctx.db.get(claim.clientId);
    if (client) {
      const newOwed = Math.max(0, client.totalOwed - args.amount);
      await ctx.db.patch(claim.clientId, {
        totalOwed: newOwed,
        totalPaid: client.totalPaid + args.amount,
        status: newOwed <= 0 ? "paid" : "owing",
        updatedAt: now,
      });
    }

    // Create notification for user
    await ctx.db.insert("notifications", {
      userId: claim.userId,
      type: "payment_received",
      title: "Payment Received",
      message: `Received $${args.amount.toFixed(2)} for "${claim.title}"`,
      read: false,
      link: `/dashboard/claims/${args.id}`,
      priority: "normal",
      claimId: args.id,
      paymentId: args.paymentId,
      createdAt: now,
    });

    return { newAmountPaid, isFullyPaid };
  },
});

// Search claims
export const search = query({
  args: {
    userId: v.id("users"),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("claims")
      .withSearchIndex("search_title", (q) =>
        q.search("title", args.query).eq("userId", args.userId)
      )
      .take(args.limit ?? 10);

    return results;
  },
});

// Get dashboard stats
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const active = claims.filter((c) => c.status === "active");
    const collected = claims.filter((c) => c.status === "collected");
    const paused = claims.filter((c) => c.status === "paused");

    const totalOwed = active.reduce((sum, c) => sum + (c.amount ?? 0), 0);
    const totalCollected = collected.reduce((sum, c) => sum + (c.amount ?? 0), 0);

    return {
      totalClaims: claims.length,
      activeClaims: active.length,
      collectedClaims: collected.length,
      pausedClaims: paused.length,
      totalOwed,
      totalCollected,
      collectionRate: claims.length > 0
        ? (collected.length / claims.length) * 100
        : 0,
    };
  },
});

// Get dashboard stats with date range filtering
export const getStatsWithDateRange = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Return empty stats if no userId provided
    if (!args.userId) {
      return {
        totalClaims: 0,
        activeClaims: 0,
        collectedClaims: 0,
        pausedClaims: 0,
        totalOwed: 0,
        totalCollected: 0,
        collectionRate: 0,
      };
    }

    // Store userId after guard for type narrowing
    const userId = args.userId;

    // Verify user exists before querying
    const user = await ctx.db.get(userId);
    if (!user) {
      return {
        totalClaims: 0,
        activeClaims: 0,
        collectedClaims: 0,
        pausedClaims: 0,
        totalOwed: 0,
        totalCollected: 0,
        collectionRate: 0,
      };
    }

    let claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined || args.endDate !== undefined) {
      claims = claims.filter((c) => {
        const createdAt = c.createdAt;
        if (args.startDate && createdAt < args.startDate) return false;
        if (args.endDate && createdAt > args.endDate) return false;
        return true;
      });
    }

    const active = claims.filter((c) => c.status === "active");
    const collected = claims.filter((c) => c.status === "collected");
    const paused = claims.filter((c) => c.status === "paused");

    const totalOwed = active.reduce((sum, c) => sum + (c.amount ?? 0), 0);
    const totalCollected = collected.reduce((sum, c) => sum + (c.amount ?? 0), 0);

    return {
      totalClaims: claims.length,
      activeClaims: active.length,
      collectedClaims: collected.length,
      pausedClaims: paused.length,
      totalOwed,
      totalCollected,
      collectionRate: claims.length > 0
        ? (collected.length / claims.length) * 100
        : 0,
    };
  },
});

// Mark payment received from Arc blockchain
export const markPaymentReceived = mutation({
  args: {
    id: v.id("claims"),
    paymentAmount: v.number(),
    transactionHash: v.string(),
    forwardTransactionHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");

    const newAmountPaid = (claim.amountPaid || 0) + args.paymentAmount;
    const isFullyPaid = newAmountPaid >= claim.amount;
    const now = Date.now();

    await ctx.db.patch(args.id, {
      amountPaid: newAmountPaid,
      status: isFullyPaid ? "collected" : claim.status,
      collectedAt: isFullyPaid ? now : claim.collectedAt,
      lastPaymentAt: now,
      lastTransactionHash: args.transactionHash,
      forwardTransactionHash: args.forwardTransactionHash,
      updatedAt: now,
    });

    // Update client totals
    const client = await ctx.db.get(claim.clientId);
    if (client) {
      const newOwed = Math.max(0, client.totalOwed - args.paymentAmount);
      await ctx.db.patch(claim.clientId, {
        totalOwed: newOwed,
        totalPaid: client.totalPaid + args.paymentAmount,
        status: newOwed <= 0 ? "paid" : "owing",
        updatedAt: now,
      });
    }

    // Create notification for user
    await ctx.db.insert("notifications", {
      userId: claim.userId,
      type: "payment_received",
      title: "Payment Received on Arc",
      message: `Received $${args.paymentAmount.toFixed(2)} for "${claim.title}" - settled on Arc blockchain`,
      read: false,
      link: `/dashboard/claims/${args.id}`,
      priority: "normal",
      claimId: args.id,
      createdAt: now,
    });

    return { newAmountPaid, isFullyPaid };
  },
});

// Flag claim for manual review (policy hold)
export const flagForReview = mutation({
  args: {
    id: v.id("claims"),
    reason: v.string(),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const claim = await ctx.db.get(args.id);
    if (!claim) throw new Error("Claim not found");

    const now = Date.now();
    await ctx.db.patch(args.id, {
      flaggedForReview: true,
      flagReason: args.reason,
      flagMetadata: args.metadata,
      flaggedAt: now,
      updatedAt: now,
    });

    // Create notification for user
    await ctx.db.insert("notifications", {
      userId: claim.userId,
      type: "claim_flagged",
      title: "Claim Flagged for Review",
      message: `"${claim.title}" has been flagged: ${args.reason}`,
      read: false,
      link: `/dashboard/claims/${args.id}`,
      priority: "high",
      claimId: args.id,
      createdAt: now,
    });
  },
});

// List claims by client
export const listByClient = query({
  args: {
    clientId: v.id("clients"),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("active"),
        v.literal("paused"),
        v.literal("collected"),
        v.literal("written_off")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("claims")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId));

    if (args.status) {
      query = query.filter((q) => q.eq(q.field("status"), args.status));
    }

    return await query.order("desc").take(limit);
  },
});
