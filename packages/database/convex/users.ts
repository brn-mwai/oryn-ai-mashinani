import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper to generate referral codes (replacing nanoid)
function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Inline user limits to avoid module loading issues
type UserType = "freelancer" | "creator" | "consultant" | "agency" | "saas";

function getLimitsForUserType(userType: UserType) {
  const limits: Record<UserType, any> = {
    freelancer: {
      monthlyClaimsLimit: 20,
      monthlyCollectionLimit: 10000,
      aiActionsLimit: 100,
      teamMembersLimit: 1,
      channels: ["email"],
      maxEscalationLevel: 2,
      apiAccess: false,
      whiteLabel: false,
    },
    creator: {
      monthlyClaimsLimit: 50,
      monthlyCollectionLimit: 25000,
      aiActionsLimit: 200,
      teamMembersLimit: 3,
      channels: ["email", "whatsapp"],
      maxEscalationLevel: 2,
      apiAccess: false,
      whiteLabel: false,
    },
    consultant: {
      monthlyClaimsLimit: 100,
      monthlyCollectionLimit: 50000,
      aiActionsLimit: 500,
      teamMembersLimit: 5,
      channels: ["email", "sms", "whatsapp"],
      maxEscalationLevel: 3,
      apiAccess: true,
      whiteLabel: false,
    },
    agency: {
      monthlyClaimsLimit: 200,
      monthlyCollectionLimit: 100000,
      aiActionsLimit: 1000,
      teamMembersLimit: 10,
      channels: ["email", "sms", "whatsapp"],
      maxEscalationLevel: 4,
      apiAccess: true,
      whiteLabel: true,
    },
    saas: {
      monthlyClaimsLimit: 1000,
      monthlyCollectionLimit: 500000,
      aiActionsLimit: 5000,
      teamMembersLimit: 50,
      channels: ["email", "sms", "whatsapp"],
      maxEscalationLevel: 4,
      apiAccess: true,
      whiteLabel: true,
    },
  };
  return limits[userType];
}

function getInitialUsage() {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  return {
    claimsCreated: 0,
    amountCollected: 0,
    aiActionsUsed: 0,
    resetDate: nextMonth.getTime(),
  };
}

function getInitialOnboardingState() {
  return {
    completed: false,
    currentStep: 0,
    completedAt: undefined,
  };
}

function shouldResetUsage(resetDate: number): boolean {
  return Date.now() >= resetDate;
}

function canCreateClaim(currentUsage: { claimsCreated: number }, limits: { monthlyClaimsLimit: number }): boolean {
  return currentUsage.claimsCreated < limits.monthlyClaimsLimit;
}

function canUseAiAction(currentUsage: { aiActionsUsed: number }, limits: { aiActionsLimit: number }): boolean {
  return currentUsage.aiActionsUsed < limits.aiActionsLimit;
}

// Get current user by Clerk ID
export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

// Get user by ID
export const get = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Create new user (from Clerk webhook)
export const create = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const referralCode = generateReferralCode();
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
      role: "user",
      // User type will be set during onboarding
      userType: undefined,
      subscriptionTier: "starter",
      // Default limits until user type is selected
      limits: undefined,
      currentUsage: getInitialUsage(),
      onboardingState: getInitialOnboardingState(),
      settings: {
        emailNotifications: true,
        smsNotifications: true,
        whatsappNotifications: true,
        deliveryConfirmations: true,
        timezone: "America/New_York",
        currency: "USD",
        autoEscalation: true,
      },
      referralCode,
      referredBy: args.referredBy,
      createdAt: now,
      updatedAt: now,
    });

    // Create fiat wallet for user
    await ctx.db.insert("wallets", {
      userId,
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

    // Create USDC wallet for user (Circle/Arc blockchain)
    await ctx.db.insert("wallets", {
      userId,
      type: "usdc",
      balance: 0,
      pendingBalance: 0,
      holdBalance: 0,
      lifetimeDeposits: 0,
      lifetimeWithdrawals: 0,
      currency: "USDC",
      circleChain: "arc", // Default to Arc L1 blockchain
      arcEnabled: true,
      createdAt: now,
      updatedAt: now,
    });

    // Handle referral if applicable
    const referredByCode = args.referredBy;
    if (referredByCode) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", referredByCode))
        .first();

      if (referrer) {
        await ctx.db.insert("referrals", {
          referrerId: referrer._id,
          referredId: userId,
          status: "pending",
          rewardAmount: 10, // $10 referral reward
          rewardClaimed: false,
        });
      }
    }

    return userId;
  },
});

// Update user profile
export const update = mutation({
  args: {
    id: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

// Update user's organization name
export const updateOrganizationName = mutation({
  args: {
    userId: v.id("users"),
    organizationName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    if (user.organizationId) {
      // Update existing organization
      await ctx.db.patch(user.organizationId, {
        name: args.organizationName,
        updatedAt: Date.now(),
      });
    } else {
      // Create new organization and link to user
      const orgId = await ctx.db.insert("organizations", {
        name: args.organizationName,
        ownerId: args.userId,
        settings: {
          whiteLabel: false,
          defaultEscalationSchedule: [5, 10, 15, 20],
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      await ctx.db.patch(args.userId, {
        organizationId: orgId,
        updatedAt: Date.now(),
      });
    }
  },
});

// Update user's Clerk ID (for dev/migration purposes)
export const updateClerkId = mutation({
  args: {
    id: v.id("users"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      clerkId: args.clerkId,
      updatedAt: Date.now(),
    });
  },
});

// Update user settings
export const updateSettings = mutation({
  args: {
    id: v.id("users"),
    settings: v.object({
      emailNotifications: v.optional(v.boolean()),
      smsNotifications: v.optional(v.boolean()),
      whatsappNotifications: v.optional(v.boolean()),
      deliveryConfirmations: v.optional(v.boolean()),
      timezone: v.optional(v.string()),
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
      autoEscalation: v.optional(v.boolean()),
      preferredAiModel: v.optional(
        v.union(
          v.literal("gemini-2.0-flash"),
          v.literal("gemini-1.5-pro"),
          v.literal("gpt-4o"),
          v.literal("gpt-4o-mini"),
          v.literal("claude-sonnet-4-20250514"),
          v.literal("claude-haiku"),
          v.literal("llama-3.3-70b"),
          v.literal("llama-4-scout"),
          v.literal("ocr-groq")
        )
      ),
      escalationSchedule: v.optional(
        v.object({
          delayDays: v.array(v.number()),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      settings: {
        ...user.settings,
        ...args.settings,
      },
      updatedAt: Date.now(),
    });
  },
});

// Admin: List all users
export const list = query({
  args: {
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const users = await ctx.db.query("users").take(limit);
    return users;
  },
});

// Admin: Update user role
export const updateRole = mutation({
  args: {
    id: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("super_admin")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// User Type & Onboarding
// ============================================

// Set user type (during onboarding)
export const setUserType = mutation({
  args: {
    id: v.id("users"),
    userType: v.union(
      v.literal("freelancer"),
      v.literal("agency"),
      v.literal("saas"),
      v.literal("creator"),
      v.literal("consultant")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    // Get limits for this user type
    const limits = getLimitsForUserType(args.userType as UserType);

    await ctx.db.patch(args.id, {
      userType: args.userType,
      limits: {
        ...limits,
        channels: [...limits.channels],
      },
      updatedAt: Date.now(),
    });
  },
});

// Advance onboarding step
export const advanceOnboarding = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    const currentState = user.onboardingState || getInitialOnboardingState();
    const newStep = currentState.currentStep + 1;

    await ctx.db.patch(args.id, {
      onboardingState: {
        ...currentState,
        currentStep: newStep,
      },
      updatedAt: Date.now(),
    });
  },
});

// Complete onboarding
export const completeOnboarding = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      onboardingState: {
        completed: true,
        currentStep: user.onboardingState?.currentStep || 0,
        completedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });
  },
});

// Get onboarding status
export const getOnboardingStatus = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    return {
      userType: user.userType,
      onboardingState: user.onboardingState || getInitialOnboardingState(),
      limits: user.limits,
    };
  },
});

// ============================================
// Usage Tracking
// ============================================

// Increment claim count
export const incrementClaimUsage = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    let currentUsage = user.currentUsage || getInitialUsage();

    // Check if usage should be reset
    if (shouldResetUsage(currentUsage.resetDate)) {
      currentUsage = getInitialUsage();
    }

    // Check limit
    if (user.limits && !canCreateClaim(currentUsage, user.limits)) {
      throw new Error("Monthly claim limit reached. Please upgrade your plan.");
    }

    await ctx.db.patch(args.id, {
      currentUsage: {
        ...currentUsage,
        claimsCreated: currentUsage.claimsCreated + 1,
      },
      updatedAt: Date.now(),
    });
  },
});

// Increment AI action count
export const incrementAiUsage = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    let currentUsage = user.currentUsage || getInitialUsage();

    // Check if usage should be reset
    if (shouldResetUsage(currentUsage.resetDate)) {
      currentUsage = getInitialUsage();
    }

    // Check limit
    if (user.limits && !canUseAiAction(currentUsage, user.limits)) {
      throw new Error("Monthly AI actions limit reached. Please upgrade your plan.");
    }

    await ctx.db.patch(args.id, {
      currentUsage: {
        ...currentUsage,
        aiActionsUsed: currentUsage.aiActionsUsed + 1,
      },
      updatedAt: Date.now(),
    });
  },
});

// Add to collected amount
export const addCollectedAmount = mutation({
  args: {
    id: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    let currentUsage = user.currentUsage || getInitialUsage();

    // Check if usage should be reset
    if (shouldResetUsage(currentUsage.resetDate)) {
      currentUsage = getInitialUsage();
    }

    await ctx.db.patch(args.id, {
      currentUsage: {
        ...currentUsage,
        amountCollected: currentUsage.amountCollected + args.amount,
      },
      updatedAt: Date.now(),
    });
  },
});

// Get usage stats
export const getUsageStats = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;

    const currentUsage = user.currentUsage || getInitialUsage();
    const limits = user.limits;

    return {
      currentUsage,
      limits,
      percentages: limits ? {
        claims: Math.round((currentUsage.claimsCreated / limits.monthlyClaimsLimit) * 100),
        aiActions: Math.round((currentUsage.aiActionsUsed / limits.aiActionsLimit) * 100),
        collection: Math.round((currentUsage.amountCollected / limits.monthlyCollectionLimit) * 100),
      } : null,
    };
  },
});

// Reset usage (called by scheduled job at month start)
export const resetMonthlyUsage = mutation({
  args: {
    id: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      currentUsage: getInitialUsage(),
      updatedAt: Date.now(),
    });
  },
});

// ============================================
// Subscription Management
// ============================================

// Update subscription tier
export const updateSubscriptionTier = mutation({
  args: {
    id: v.id("users"),
    tier: v.union(
      v.literal("starter"),
      v.literal("professional"),
      v.literal("enterprise"),
      v.literal("custom")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.id, {
      subscriptionTier: args.tier,
      updatedAt: Date.now(),
    });
  },
});

// Check if user can perform action
export const checkLimit = query({
  args: {
    id: v.id("users"),
    action: v.union(
      v.literal("create_claim"),
      v.literal("use_ai"),
      v.literal("use_channel"),
      v.literal("escalate")
    ),
    value: v.optional(v.union(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return { allowed: false, reason: "User not found" };

    const limits = user.limits;
    const currentUsage = user.currentUsage || getInitialUsage();

    if (!limits) {
      return { allowed: false, reason: "No limits configured. Please complete onboarding." };
    }

    switch (args.action) {
      case "create_claim":
        if (currentUsage.claimsCreated >= limits.monthlyClaimsLimit) {
          return {
            allowed: false,
            reason: `Monthly claim limit reached (${limits.monthlyClaimsLimit}). Please upgrade your plan.`,
          };
        }
        return { allowed: true };

      case "use_ai":
        if (currentUsage.aiActionsUsed >= limits.aiActionsLimit) {
          return {
            allowed: false,
            reason: `Monthly AI actions limit reached (${limits.aiActionsLimit}). Please upgrade your plan.`,
          };
        }
        return { allowed: true };

      case "use_channel":
        const channel = args.value as string;
        if (!limits.channels.includes(channel)) {
          return {
            allowed: false,
            reason: `${channel} is not available on your plan. Available channels: ${limits.channels.join(", ")}`,
          };
        }
        return { allowed: true };

      case "escalate":
        const level = args.value as number;
        if (level > limits.maxEscalationLevel) {
          return {
            allowed: false,
            reason: `Escalation level ${level} is not available on your plan. Maximum: ${limits.maxEscalationLevel}`,
          };
        }
        return { allowed: true };

      default:
        return { allowed: true };
    }
  },
});

// ============================================
// Complete Onboarding with All Data
// ============================================

// Save all onboarding data at once
export const saveOnboardingData = mutation({
  args: {
    id: v.id("users"),
    userType: v.union(
      v.literal("freelancer"),
      v.literal("agency"),
      v.literal("saas"),
      v.literal("creator"),
      v.literal("consultant")
    ),
    personal: v.object({
      firstName: v.string(),
      lastName: v.string(),
      phone: v.optional(v.string()),
    }),
    business: v.object({
      businessName: v.string(),
      businessType: v.optional(v.string()),
      website: v.optional(v.string()),
      country: v.string(),
      streetAddress: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zipCode: v.optional(v.string()),
    }),
    preferences: v.object({
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
      autoEscalation: v.boolean(),
      escalationSchedule: v.optional(v.string()), // gentle, balanced, aggressive
    }),
    notifications: v.object({
      channels: v.object({
        email: v.boolean(),
        sms: v.boolean(),
        whatsapp: v.boolean(),
      }),
      preferences: v.object({
        deliveryConfirmations: v.boolean(),
        paymentAlerts: v.boolean(),
        weeklyDigest: v.boolean(),
      }),
      timezone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found");

    // Get limits for this user type
    const limits = getLimitsForUserType(args.userType as UserType);

    // Map escalation schedule string to delay days
    const escalationDelays: Record<string, number[]> = {
      gentle: [7, 14, 21, 30],
      balanced: [5, 10, 15, 20],
      aggressive: [3, 7, 10, 14],
    };

    // Update user with all onboarding data
    await ctx.db.patch(args.id, {
      firstName: args.personal.firstName,
      lastName: args.personal.lastName,
      phone: args.personal.phone,
      userType: args.userType,
      subscriptionTier: "starter",
      limits: {
        ...limits,
        channels: [...limits.channels],
      },
      settings: {
        emailNotifications: args.notifications.channels.email,
        smsNotifications: args.notifications.channels.sms,
        whatsappNotifications: args.notifications.channels.whatsapp,
        deliveryConfirmations: args.notifications.preferences.deliveryConfirmations,
        timezone: args.notifications.timezone,
        currency: args.preferences.currency,
        autoEscalation: args.preferences.autoEscalation,
        escalationSchedule: args.preferences.escalationSchedule ? {
          delayDays: escalationDelays[args.preferences.escalationSchedule] || escalationDelays.balanced,
        } : undefined,
      },
      onboardingState: {
        completed: true,
        currentStep: 6,
        completedAt: Date.now(),
      },
      updatedAt: Date.now(),
    });

    // Create organization if user is an agency or SaaS
    if (args.userType === "agency" || args.userType === "saas") {
      const orgId = await ctx.db.insert("organizations", {
        name: args.business.businessName,
        ownerId: args.id,
        settings: {
          whiteLabel: false,
          defaultEscalationSchedule: args.preferences.escalationSchedule
            ? escalationDelays[args.preferences.escalationSchedule]
            : escalationDelays.balanced,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Link organization to user
      await ctx.db.patch(args.id, {
        organizationId: orgId,
      });
    }

    return { success: true };
  },
});
