import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// List payments for a user
export const list = query({
  args: {
    userId: v.id("users"),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed"),
        v.literal("refunded")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) =>
        args.status ? q.eq(q.field("status"), args.status) : true
      )
      .take(limit);
  },
});

// Get payments for a claim
export const listByClaim = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_claim", (q) => q.eq("claimId", args.claimId))
      .collect();
  },
});

// Get single payment
export const get = query({
  args: { id: v.id("payments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get payment by Stripe payment intent
export const getByStripePaymentIntent = query({
  args: { paymentIntentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_stripe_payment_intent", (q) =>
        q.eq("stripePaymentIntentId", args.paymentIntentId)
      )
      .first();
  },
});

// Create payment record
export const create = mutation({
  args: {
    claimId: v.id("claims"),
    userId: v.id("users"),
    clientId: v.id("clients"),
    amount: v.number(),
    currency: v.union(
      v.literal("KES"),
      v.literal("USD"),
      v.literal("EUR"),
      v.literal("GBP"),
      v.literal("CAD"),
      v.literal("AUD"),
      v.literal("USDC"),
      v.literal("EURC")
    ),
    method: v.union(
      v.literal("card"),
      v.literal("bank_transfer"),
      v.literal("usdc"),
      v.literal("other")
    ),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
    stripePaymentIntentId: v.optional(v.string()),
    circlePaymentId: v.optional(v.string()),
    transactionHash: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const status = args.status || "pending";
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
      claimId: args.claimId,
      userId: args.userId,
      clientId: args.clientId,
      amount: args.amount,
      currency: args.currency,
      method: args.method,
      status: status,
      stripePaymentIntentId: args.stripePaymentIntentId,
      circlePaymentId: args.circlePaymentId,
      transactionHash: args.transactionHash,
      metadata: args.metadata,
      createdAt: now,
      completedAt: status === "completed" ? now : undefined,
    });

    // If payment is completed, update claim and wallet
    if (status === "completed") {
      // Get the claim
      const claim = await ctx.db.get(args.claimId);
      if (claim) {
        // Update claim amountPaid
        const newAmountPaid = (claim.amountPaid || 0) + args.amount;
        const updates: Record<string, unknown> = {
          amountPaid: newAmountPaid,
          updatedAt: now,
        };

        // Mark as collected if fully paid
        if (newAmountPaid >= claim.amount) {
          updates.status = "collected";
        }

        await ctx.db.patch(args.claimId, updates);

        // Update client
        const client = await ctx.db.get(claim.clientId);
        if (client) {
          const newOwed = Math.max(0, client.totalOwed - args.amount);
          await ctx.db.patch(claim.clientId, {
            totalOwed: newOwed,
            totalPaid: (client.totalPaid || 0) + args.amount,
            status: newOwed <= 0 ? "paid" : "owing",
            updatedAt: now,
          });
        }
      }

      // Credit user's wallet
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("type"), "usdc"))
        .first();

      if (wallet) {
        // Lower fee for USDC (1%)
        const feeRate = args.method === "usdc" ? 0.01 : 0.029;
        const fixedFee = args.method === "card" ? 0.30 : 0;
        const fee = args.amount * feeRate + fixedFee;
        const netAmount = args.amount - fee;

        await ctx.db.patch(wallet._id, {
          balance: (wallet.balance || 0) + netAmount,
          updatedAt: now,
        });

        // Create transaction record
        await ctx.db.insert("transactions", {
          walletId: wallet._id,
          userId: args.userId,
          type: "payment_received",
          amount: netAmount,
          currency: args.currency,
          status: "completed",
          reference: paymentId,
          description: `Payment received via ${args.method}`,
          transactionHash: args.transactionHash,
          createdAt: now,
          completedAt: now,
        });
      }

      // Create notification
      await ctx.db.insert("notifications", {
        userId: args.userId,
        type: "payment_received",
        title: "Payment Received",
        message: `You received a payment of $${args.amount.toFixed(2)} via ${args.method.toUpperCase()}`,
        read: false,
        link: `/dashboard/claims/${args.claimId}`,
        priority: "normal",
        claimId: args.claimId,
        paymentId: paymentId,
        createdAt: now,
      });
    }

    return paymentId;
  },
});

// Update payment status
export const updateStatus = mutation({
  args: {
    id: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionHash: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db.get(args.id);
    if (!payment) throw new Error("Payment not found");

    const updates: Record<string, unknown> = { status: args.status };

    if (args.transactionHash) {
      updates.transactionHash = args.transactionHash;
    }

    if (args.metadata) {
      updates.metadata = { ...payment.metadata, ...args.metadata };
    }

    if (args.status === "completed") {
      updates.completedAt = Date.now();
    }

    await ctx.db.patch(args.id, updates);

    // If completed, update claim and wallet
    if (args.status === "completed") {
      // Get the claim and mark it collected if fully paid
      const claim = await ctx.db.get(payment.claimId);
      if (claim) {
        const payments = await ctx.db
          .query("payments")
          .withIndex("by_claim", (q) => q.eq("claimId", payment.claimId))
          .filter((q) => q.eq(q.field("status"), "completed"))
          .collect();

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;

        if (totalPaid >= claim.amount) {
          await ctx.db.patch(payment.claimId, {
            status: "collected",
            updatedAt: Date.now(),
          });

          // Update client
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
        }
      }

      // Credit user's wallet
      const wallet = await ctx.db
        .query("wallets")
        .withIndex("by_user", (q) => q.eq("userId", payment.userId))
        .first();
      if (wallet) {
          // Calculate fee (2.9% + $0.30 for card, 1% for USDC)
          const feeRate = payment.method === "usdc" ? 0.01 : 0.029;
          const fixedFee = payment.method === "card" ? 0.30 : 0;
          const fee = payment.amount * feeRate + fixedFee;
          const netAmount = payment.amount - fee;

          await ctx.db.patch(wallet._id, {
            balance: wallet.balance + netAmount,
            updatedAt: Date.now(),
          });

          const txNow = Date.now();
          // Create transaction record
          await ctx.db.insert("transactions", {
            walletId: wallet._id,
            userId: payment.userId,
            type: "payment_received",
            amount: netAmount,
            currency: payment.currency,
            status: "completed",
            reference: `${payment._id}`,
            description: `Payment received for claim`,
            createdAt: txNow,
            completedAt: txNow,
          });

          // Record fee transaction
          if (fee > 0) {
            await ctx.db.insert("transactions", {
              walletId: wallet._id,
              userId: payment.userId,
              type: "fee",
              amount: -fee,
              currency: payment.currency,
              status: "completed",
              reference: `${payment._id}`,
              description: `Processing fee`,
              createdAt: txNow,
              completedAt: txNow,
            });
          }
      }

      // Create notification
      await ctx.db.insert("notifications", {
        userId: payment.userId,
        type: "payment_received",
        title: "Payment Received",
        message: `You received a payment of $${payment.amount.toFixed(2)}`,
        read: false,
        link: `/claims/${payment.claimId}`,
        priority: "normal",
        claimId: payment.claimId,
        paymentId: payment._id,
        createdAt: Date.now(),
      });
    }
  },
});

// Get recent payments for dashboard
export const getRecent = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("payments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .order("desc")
      .take(args.limit ?? 5);
  },
});
