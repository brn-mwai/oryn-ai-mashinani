import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get wallet for user (returns first wallet)
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// List all wallets for user (fiat and usdc)
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get wallet by ID
export const get = query({
  args: { id: v.id("wallets") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get wallet overview with transactions
export const getOverview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) return null;

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .order("desc")
      .take(20);

    const allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();

    const totalEarnings = allTransactions
      .filter((t) => t.type === "payment_received" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingWithdrawals = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "pending")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      wallet,
      recentTransactions: transactions,
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
    };
  },
});

// Get wallet overview with date range filtering for charts
export const getOverviewWithDateRange = query({
  args: {
    userId: v.optional(v.id("users")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!args.userId) return null;

    // Store userId after guard for type narrowing
    const userId = args.userId;

    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!wallet) return null;

    let allTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", wallet._id))
      .collect();

    // Filter by date range if provided
    if (args.startDate !== undefined || args.endDate !== undefined) {
      allTransactions = allTransactions.filter((t) => {
        const createdAt = t.createdAt;
        if (args.startDate && createdAt < args.startDate) return false;
        if (args.endDate && createdAt > args.endDate) return false;
        return true;
      });
    }

    // Sort by date descending for recent transactions
    const sortedTransactions = [...allTransactions].sort(
      (a, b) => b.createdAt - a.createdAt
    );

    const totalEarnings = allTransactions
      .filter((t) => t.type === "payment_received" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingWithdrawals = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "pending")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Group transactions by day for chart data
    const paymentsByDay = new Map<string, number>();
    allTransactions
      .filter((t) => t.type === "payment_received" && t.status === "completed")
      .forEach((t) => {
        const date = new Date(t.createdAt).toISOString().split("T")[0];
        paymentsByDay.set(date, (paymentsByDay.get(date) || 0) + t.amount);
      });

    const chartData = Array.from(paymentsByDay.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      wallet,
      recentTransactions: sortedTransactions.slice(0, 20),
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
      chartData,
    };
  },
});

// List transactions
export const listTransactions = query({
  args: {
    walletId: v.id("wallets"),
    type: v.optional(
      v.union(
        v.literal("deposit"),
        v.literal("withdrawal"),
        v.literal("payment_received"),
        v.literal("fee"),
        v.literal("refund")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db
      .query("transactions")
      .withIndex("by_wallet", (q) => q.eq("walletId", args.walletId));

    if (args.type) {
      query = query.filter((q) => q.eq(q.field("type"), args.type));
    }

    return await query.order("desc").take(limit);
  },
});

// Request withdrawal
export const requestWithdrawal = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    method: v.union(v.literal("bank_transfer"), v.literal("usdc")),
    destination: v.any(), // Bank account or wallet address
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!wallet) throw new Error("Wallet not found");
    if (wallet.balance < args.amount) {
      throw new Error("Insufficient balance");
    }

    // Minimum withdrawal amount
    if (args.amount < 10) {
      throw new Error("Minimum withdrawal amount is $10");
    }

    // Update wallet balance
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance - args.amount,
      pendingBalance: wallet.pendingBalance + args.amount,
      updatedAt: Date.now(),
    });

    // Create pending transaction
    const transactionId = await ctx.db.insert("transactions", {
      walletId: wallet._id,
      userId: args.userId,
      type: "withdrawal",
      amount: -args.amount,
      currency: wallet.currency,
      status: "pending",
      description: `Withdrawal via ${args.method}`,
      metadata: {
        method: args.method,
        destination: args.destination,
      },
      createdAt: Date.now(),
    });

    return transactionId;
  },
});

// Complete withdrawal (called by webhook or admin)
export const completeWithdrawal = mutation({
  args: {
    transactionId: v.id("transactions"),
    success: v.boolean(),
    reference: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status !== "pending") {
      throw new Error("Transaction is not pending");
    }

    const wallet = await ctx.db.get(transaction.walletId);
    if (!wallet) throw new Error("Wallet not found");

    const amount = Math.abs(transaction.amount);

    if (args.success) {
      // Mark as completed
      await ctx.db.patch(args.transactionId, {
        status: "completed",
        reference: args.reference,
      });

      // Update wallet pending balance
      await ctx.db.patch(wallet._id, {
        pendingBalance: wallet.pendingBalance - amount,
        updatedAt: Date.now(),
      });
    } else {
      // Mark as failed and refund
      await ctx.db.patch(args.transactionId, {
        status: "failed",
        metadata: { ...transaction.metadata, error: args.error },
      });

      // Refund to available balance
      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + amount,
        pendingBalance: wallet.pendingBalance - amount,
        updatedAt: Date.now(),
      });

      // Create notification about failed withdrawal
      await ctx.db.insert("notifications", {
        userId: transaction.userId,
        type: "withdrawal_failed",
        title: "Withdrawal Failed",
        message: args.error ?? "Your withdrawal request could not be processed",
        read: false,
        link: "/wallet",
        priority: "high",
        transactionId: args.transactionId,
        createdAt: Date.now(),
      });
    }
  },
});

// Update Circle wallet ID and address
export const setCircleWalletId = mutation({
  args: {
    id: v.id("wallets"),
    circleWalletId: v.string(),
    circleAddress: v.optional(v.string()),
    circleWalletSetId: v.optional(v.string()),
    circleChain: v.optional(
      v.union(
        v.literal("ethereum"),
        v.literal("polygon"),
        v.literal("solana"),
        v.literal("avalanche"),
        v.literal("arc")
      )
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      circleWalletId: args.circleWalletId,
      circleAddress: args.circleAddress,
      circleWalletSetId: args.circleWalletSetId,
      circleChain: args.circleChain,
      updatedAt: Date.now(),
    });
  },
});

// Update Arc wallet details
export const setArcWalletDetails = mutation({
  args: {
    id: v.id("wallets"),
    arcWalletId: v.string(),
    arcAddress: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      arcWalletId: args.arcWalletId,
      arcAddress: args.arcAddress,
      arcEnabled: true,
      circleChain: "arc",
      updatedAt: Date.now(),
    });
  },
});

// Get wallet by type for user
export const getByUserAndType = query({
  args: {
    userId: v.id("users"),
    type: v.union(v.literal("fiat"), v.literal("usdc")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user_and_type", (q) =>
        q.eq("userId", args.userId).eq("type", args.type)
      )
      .first();
  },
});

// Ensure user has both wallets (for migration/existing users)
export const ensureWallets = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const existingWallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const hasFiat = existingWallets.some((w) => w.type === "fiat");
    const hasUsdc = existingWallets.some((w) => w.type === "usdc");
    const now = Date.now();

    const created: string[] = [];

    // Create fiat wallet if missing
    if (!hasFiat) {
      await ctx.db.insert("wallets", {
        userId: args.userId,
        type: "fiat",
        balance: 0,
        pendingBalance: 0,
        holdBalance: 0,
        lifetimeDeposits: 0,
        lifetimeWithdrawals: 0,
        currency: "USD",
        createdAt: now,
        updatedAt: now,
      });
      created.push("fiat");
    }

    // Create USDC wallet if missing
    if (!hasUsdc) {
      await ctx.db.insert("wallets", {
        userId: args.userId,
        type: "usdc",
        balance: 0,
        pendingBalance: 0,
        holdBalance: 0,
        lifetimeDeposits: 0,
        lifetimeWithdrawals: 0,
        currency: "USDC",
        circleChain: "arc",
        arcEnabled: true,
        createdAt: now,
        updatedAt: now,
      });
      created.push("usdc");
    }

    return { created, existing: existingWallets.map((w) => w.type) };
  },
});

// Create additional USDC wallet (for multi-wallet support)
export const createUsdcWallet = mutation({
  args: {
    userId: v.id("users"),
    name: v.optional(v.string()),
    circleWalletId: v.optional(v.string()),
    circleWalletSetId: v.optional(v.string()),
    circleAddress: v.optional(v.string()),
    circleChain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc")
    )),
    arcWalletId: v.optional(v.string()),
    arcAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const walletId = await ctx.db.insert("wallets", {
      userId: args.userId,
      type: "usdc",
      name: args.name,
      balance: 0,
      pendingBalance: 0,
      holdBalance: 0,
      lifetimeDeposits: 0,
      lifetimeWithdrawals: 0,
      currency: "USDC",
      circleWalletId: args.circleWalletId,
      circleWalletSetId: args.circleWalletSetId,
      circleAddress: args.circleAddress,
      circleChain: args.circleChain,
      arcWalletId: args.arcWalletId,
      arcAddress: args.arcAddress,
      arcEnabled: !!args.arcAddress,
      createdAt: now,
      updatedAt: now,
    });

    return walletId;
  },
});

// List all USDC wallets for a user (for multi-wallet support)
export const listUsdcWallets = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("type"), "usdc"))
      .collect();
  },
});

// Transfer between wallets or external address
export const createTransfer = mutation({
  args: {
    fromWalletId: v.id("wallets"),
    userId: v.id("users"),
    amount: v.number(),
    destinationAddress: v.string(),
    destinationType: v.union(v.literal("internal"), v.literal("external")),
    toWalletId: v.optional(v.id("wallets")),
    chain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc")
    )),
    circleTransferId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const fromWallet = await ctx.db.get(args.fromWalletId);
    if (!fromWallet) throw new Error("Source wallet not found");
    if (fromWallet.userId !== args.userId) throw new Error("Unauthorized");
    if (fromWallet.balance < args.amount) throw new Error("Insufficient balance");

    const now = Date.now();

    // Deduct from source wallet
    await ctx.db.patch(args.fromWalletId, {
      balance: fromWallet.balance - args.amount,
      pendingBalance: fromWallet.pendingBalance + args.amount,
      updatedAt: now,
    });

    // Create outbound transaction
    const transactionId = await ctx.db.insert("transactions", {
      walletId: args.fromWalletId,
      userId: args.userId,
      type: "transfer_out",
      amount: -args.amount,
      currency: fromWallet.currency,
      status: "pending",
      description: `Transfer to ${args.destinationAddress.slice(0, 8)}...`,
      chain: args.chain,
      destinationAddress: args.destinationAddress,
      circleTransferId: args.circleTransferId,
      metadata: {
        destinationType: args.destinationType,
        toWalletId: args.toWalletId,
      },
      createdAt: now,
    });

    // If internal transfer, credit the destination wallet
    if (args.destinationType === "internal" && args.toWalletId) {
      const toWallet = await ctx.db.get(args.toWalletId);
      if (toWallet) {
        await ctx.db.patch(args.toWalletId, {
          balance: toWallet.balance + args.amount,
          updatedAt: now,
        });

        // Create inbound transaction for destination
        await ctx.db.insert("transactions", {
          walletId: args.toWalletId,
          userId: toWallet.userId,
          type: "transfer_in",
          amount: args.amount,
          currency: toWallet.currency,
          status: "completed",
          description: `Transfer from ${fromWallet.circleAddress?.slice(0, 8) || fromWallet.arcAddress?.slice(0, 8) || "wallet"}...`,
          chain: args.chain,
          relatedTransactionId: transactionId,
          createdAt: now,
        });

        // Complete the outbound transaction immediately for internal transfers
        await ctx.db.patch(transactionId, {
          status: "completed",
        });

        // Move from pending back to processed
        await ctx.db.patch(args.fromWalletId, {
          pendingBalance: fromWallet.pendingBalance,
          updatedAt: now,
        });
      }
    }

    return transactionId;
  },
});

// Complete external transfer (called by webhook)
export const completeTransfer = mutation({
  args: {
    transactionId: v.id("transactions"),
    success: v.boolean(),
    transactionHash: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("Transaction not found");
    if (transaction.status !== "pending") throw new Error("Transaction not pending");

    const wallet = await ctx.db.get(transaction.walletId);
    if (!wallet) throw new Error("Wallet not found");

    const amount = Math.abs(transaction.amount);

    if (args.success) {
      await ctx.db.patch(args.transactionId, {
        status: "completed",
        transactionHash: args.transactionHash,
      });

      await ctx.db.patch(wallet._id, {
        pendingBalance: wallet.pendingBalance - amount,
        lifetimeWithdrawals: wallet.lifetimeWithdrawals + amount,
        updatedAt: Date.now(),
      });
    } else {
      // Refund on failure
      await ctx.db.patch(args.transactionId, {
        status: "failed",
        metadata: { ...transaction.metadata, error: args.error },
      });

      await ctx.db.patch(wallet._id, {
        balance: wallet.balance + amount,
        pendingBalance: wallet.pendingBalance - amount,
        updatedAt: Date.now(),
      });

      // Notify user
      await ctx.db.insert("notifications", {
        userId: transaction.userId,
        type: "transfer_failed",
        title: "Transfer Failed",
        message: args.error || "Your transfer could not be completed",
        read: false,
        link: "/dashboard/wallet",
        priority: "high",
        transactionId: args.transactionId,
        createdAt: Date.now(),
      });
    }
  },
});

// Add balance to wallet (for incoming payments)
export const addBalance = mutation({
  args: {
    id: v.id("wallets"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db.get(args.id);
    if (!wallet) throw new Error("Wallet not found");

    await ctx.db.patch(args.id, {
      balance: wallet.balance + args.amount,
      lifetimeDeposits: wallet.lifetimeDeposits + args.amount,
      updatedAt: Date.now(),
    });

    return { newBalance: wallet.balance + args.amount };
  },
});

// Get full wallet overview with both wallet types
export const getFullOverview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const wallets = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const fiatWallet = wallets.find((w) => w.type === "fiat");
    const usdcWallet = wallets.find((w) => w.type === "usdc");

    // Get transactions for both wallets
    const walletIds = wallets.map((w) => w._id);
    const allTransactions = [];

    for (const walletId of walletIds) {
      const transactions = await ctx.db
        .query("transactions")
        .withIndex("by_wallet", (q) => q.eq("walletId", walletId))
        .collect();
      allTransactions.push(...transactions);
    }

    // Sort by date descending
    allTransactions.sort((a, b) => b.createdAt - a.createdAt);

    // Calculate totals
    const totalFiatBalance = fiatWallet?.balance || 0;
    const totalUsdcBalance = usdcWallet?.balance || 0;

    const totalEarnings = allTransactions
      .filter((t) => t.type === "payment_received" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawn = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const pendingWithdrawals = allTransactions
      .filter((t) => t.type === "withdrawal" && t.status === "pending")
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return {
      fiatWallet,
      usdcWallet,
      totalBalance: totalFiatBalance + totalUsdcBalance,
      totalFiatBalance,
      totalUsdcBalance,
      recentTransactions: allTransactions.slice(0, 20),
      totalEarnings,
      totalWithdrawn,
      pendingWithdrawals,
      hasArcEnabled: usdcWallet?.arcEnabled || false,
    };
  },
});
