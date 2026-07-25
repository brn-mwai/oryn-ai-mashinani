import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get referrals made by user
export const listByReferrer = query({
  args: { referrerId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.referrerId))
      .collect();
  },
});

// Get referral stats for a user
export const getStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();

    const pending = referrals.filter((r) => r.status === "pending");
    const completed = referrals.filter((r) => r.status === "completed");
    const totalEarned = completed.reduce((sum, r) => sum + r.rewardAmount, 0);
    const unclaimed = completed.filter((r) => !r.rewardClaimed);

    // Get user's referral code
    const user = await ctx.db.get(args.userId);

    return {
      referralCode: user?.referralCode ?? "",
      totalReferrals: referrals.length,
      pendingReferrals: pending.length,
      completedReferrals: completed.length,
      totalEarned,
      unclaimedRewards: unclaimed.reduce((sum, r) => sum + r.rewardAmount, 0),
    };
  },
});

// Complete a referral (called when referred user makes first payment)
export const complete = mutation({
  args: { referredId: v.id("users") },
  handler: async (ctx, args) => {
    const referral = await ctx.db
      .query("referrals")
      .withIndex("by_referred", (q) => q.eq("referredId", args.referredId))
      .first();

    if (!referral) return null;
    if (referral.status !== "pending") return null;

    await ctx.db.patch(referral._id, {
      status: "completed",
      completedAt: Date.now(),
    });

    // Notify the referrer
    await ctx.db.insert("notifications", {
      userId: referral.referrerId,
      type: "referral_reward",
      title: "Referral Completed!",
      message: `Your referral has made their first payment. You earned $${referral.rewardAmount}!`,
      read: false,
      link: "/settings/referrals",
      priority: "normal",
      createdAt: Date.now(),
    });

    return referral._id;
  },
});

// Claim referral reward
export const claimReward = mutation({
  args: { referralId: v.id("referrals") },
  handler: async (ctx, args) => {
    const referral = await ctx.db.get(args.referralId);
    if (!referral) throw new Error("Referral not found");
    if (referral.status !== "completed") {
      throw new Error("Referral not yet completed");
    }
    if (referral.rewardClaimed) {
      throw new Error("Reward already claimed");
    }

    // Get referrer's wallet
    const wallet = await ctx.db
      .query("wallets")
      .withIndex("by_user", (q) => q.eq("userId", referral.referrerId))
      .first();
    if (!wallet) throw new Error("User wallet not found");

    // Credit the reward
    await ctx.db.patch(wallet._id, {
      balance: wallet.balance + referral.rewardAmount,
      updatedAt: Date.now(),
    });

    // Create transaction
    const txNow = Date.now();
    await ctx.db.insert("transactions", {
      walletId: wallet._id,
      userId: referral.referrerId,
      type: "referral_reward",
      amount: referral.rewardAmount,
      currency: wallet.currency,
      status: "completed",
      reference: `${referral._id}`,
      description: "Referral reward",
      createdAt: txNow,
      completedAt: txNow,
    });

    // Mark as claimed
    await ctx.db.patch(args.referralId, { rewardClaimed: true });

    return referral.rewardAmount;
  },
});

// Expire old pending referrals (30 days)
export const expireOld = mutation({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    const oldPending = await ctx.db
      .query("referrals")
      .filter((q) =>
        q.and(
          q.eq(q.field("status"), "pending"),
          q.lt(q.field("_creationTime"), thirtyDaysAgo)
        )
      )
      .collect();

    await Promise.all(
      oldPending.map((r) => ctx.db.patch(r._id, { status: "expired" }))
    );

    return oldPending.length;
  },
});
