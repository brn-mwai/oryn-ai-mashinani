import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable validators
const currencyValidator = v.union(
  v.literal("KES"),
  v.literal("USD"),
  v.literal("EUR"),
  v.literal("GBP"),
  v.literal("CAD"),
  v.literal("AUD"),
  v.literal("USDC"),
  v.literal("EURC")
);

const aiModelValidator = v.union(
  v.literal("gemini-2.0-flash"),
  v.literal("gemini-1.5-pro"),
  v.literal("gpt-4o"),
  v.literal("gpt-4o-mini"),
  v.literal("claude-sonnet-4-20250514"),
  v.literal("claude-haiku"),
  v.literal("llama-3.3-70b"),
  v.literal("llama-4-scout"),
  v.literal("ocr-groq") // OCR + Groq fallback
);

// User persona types
const userTypeValidator = v.union(
  v.literal("freelancer"),
  v.literal("agency"),
  v.literal("saas"),
  v.literal("creator"),
  v.literal("consultant")
);

// Subscription tiers
const subscriptionTierValidator = v.union(
  v.literal("starter"),
  v.literal("professional"),
  v.literal("enterprise"),
  v.literal("custom")
);

// User limits schema (configurable per tier)
const userLimitsValidator = v.object({
  monthlyClaimsLimit: v.number(),
  monthlyCollectionLimit: v.number(),
  aiActionsLimit: v.number(),
  teamMembersLimit: v.number(),
  channels: v.array(v.string()), // ["email"] or ["email", "sms", "whatsapp"]
  maxEscalationLevel: v.number(), // 2 for freelancer, 4 for agency
  apiAccess: v.boolean(),
  whiteLabel: v.boolean(),
});

// Usage tracking schema
const usageTrackingValidator = v.object({
  claimsCreated: v.number(),
  amountCollected: v.number(),
  aiActionsUsed: v.number(),
  resetDate: v.number(),
});

// Onboarding state schema
const onboardingStateValidator = v.object({
  completed: v.boolean(),
  currentStep: v.number(),
  completedAt: v.optional(v.number()),
});

// NLP command status
const nlpCommandStatusValidator = v.union(
  v.literal("processing"),
  v.literal("awaiting_confirmation"),
  v.literal("executed"),
  v.literal("failed")
);

// NLP action status
const nlpActionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("executing"),
  v.literal("completed"),
  v.literal("failed")
);

// Team member role
const teamRoleValidator = v.union(
  v.literal("owner"),
  v.literal("admin"),
  v.literal("member")
);

export default defineSchema({
  // ============================================
  // Users
  // ============================================
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("super_admin")),

    // User persona type
    userType: v.optional(userTypeValidator),

    // Subscription tier
    subscriptionTier: v.optional(subscriptionTierValidator),

    // Usage limits (configurable per tier)
    limits: v.optional(userLimitsValidator),

    // Current month usage tracking
    currentUsage: v.optional(usageTrackingValidator),

    // Onboarding state
    onboardingState: v.optional(onboardingStateValidator),

    // Organization reference (for team members)
    organizationId: v.optional(v.id("organizations")),

    // Payment provider IDs
    stripeCustomerId: v.optional(v.string()),
    stripeAccountId: v.optional(v.string()), // For Stripe Connect payouts
    circleWalletSetId: v.optional(v.string()), // Circle wallet set for multi-chain wallets

    // Settings
    settings: v.object({
      emailNotifications: v.boolean(),
      smsNotifications: v.boolean(),
      whatsappNotifications: v.boolean(),
      deliveryConfirmations: v.boolean(), // Notify when messages delivered to clients
      timezone: v.string(),
      currency: currencyValidator,
      preferredAiModel: v.optional(aiModelValidator),
      autoEscalation: v.boolean(),
      escalationSchedule: v.optional(v.object({
        delayDays: v.array(v.number()), // e.g., [7, 14, 21, 30] days between escalations
      })),
    }),

    // KYC Status (for payouts)
    kycStatus: v.optional(v.union(
      v.literal("not_started"),
      v.literal("pending"),
      v.literal("verified"),
      v.literal("rejected")
    )),
    kycSubmittedAt: v.optional(v.number()),
    kycVerifiedAt: v.optional(v.number()),

    // Referral
    referralCode: v.string(),
    referredBy: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastLoginAt: v.optional(v.number()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_referral_code", ["referralCode"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_account", ["stripeAccountId"])
    .index("by_user_type", ["userType"])
    .index("by_organization", ["organizationId"]),

  // ============================================
  // Organizations (For Agency/SaaS team support)
  // ============================================
  organizations: defineTable({
    name: v.string(),
    ownerId: v.id("users"),
    logoUrl: v.optional(v.string()),
    brandColor: v.optional(v.string()),
    customDomain: v.optional(v.string()),
    settings: v.optional(v.object({
      whiteLabel: v.boolean(),
      defaultEscalationSchedule: v.optional(v.array(v.number())),
      automationRules: v.optional(v.any()),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_custom_domain", ["customDomain"]),

  // ============================================
  // Team Members (Organization membership)
  // ============================================
  teamMembers: defineTable({
    organizationId: v.id("organizations"),
    userId: v.id("users"),
    role: teamRoleValidator,
    permissions: v.optional(v.object({
      canManageClaims: v.boolean(),
      canManageClients: v.boolean(),
      canSendMessages: v.boolean(),
      canViewReports: v.boolean(),
      canManageTeam: v.boolean(),
      canAccessApi: v.boolean(),
    })),
    invitedBy: v.optional(v.id("users")),
    invitedAt: v.number(),
    joinedAt: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("suspended")
    ),
  })
    .index("by_org", ["organizationId"])
    .index("by_user", ["userId"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  // ============================================
  // NLP Commands (Track NLP command execution)
  // ============================================
  nlpCommands: defineTable({
    userId: v.id("users"),
    rawInput: v.string(),

    // Classification
    intent: v.string(),
    confidence: v.number(),

    // Resolved entities
    entities: v.object({
      clientId: v.optional(v.id("clients")),
      claimId: v.optional(v.id("claims")),
      clientName: v.optional(v.string()),
      amount: v.optional(v.number()),
      channel: v.optional(v.string()),
      dueDate: v.optional(v.number()),
    }),

    // Action plan
    actions: v.array(v.object({
      type: v.string(),
      status: nlpActionStatusValidator,
      params: v.optional(v.any()),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
      executedAt: v.optional(v.number()),
    })),

    // Status
    status: nlpCommandStatusValidator,

    // Confirmation (for high-risk actions)
    requiresConfirmation: v.boolean(),
    confirmationMessage: v.optional(v.string()),
    confirmedAt: v.optional(v.number()),

    // Response
    response: v.optional(v.string()),

    // Metadata
    model: v.string(),
    tokensUsed: v.number(),
    durationMs: v.number(),
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_intent", ["intent"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // User Stats (Pre-computed aggregations)
  // ============================================
  userStats: defineTable({
    userId: v.id("users"),
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("all_time")
    ),
    periodStart: v.number(),

    // Claim metrics
    totalClaims: v.number(),
    activeClaims: v.number(),
    totalOwed: v.number(),
    totalCollected: v.number(),
    collectionRate: v.number(),

    // Message metrics
    messagesByChannel: v.object({
      email: v.number(),
      sms: v.number(),
      whatsapp: v.number(),
    }),

    // AI metrics
    aiActionsUsed: v.number(),

    // Timestamps
    lastUpdated: v.number(),
  })
    .index("by_user_period", ["userId", "period"])
    .index("by_user_period_start", ["userId", "period", "periodStart"]),

  // ============================================
  // Clients (Debtors)
  // ============================================
  clients: defineTable({
    userId: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    whatsapp: v.optional(v.string()), // WhatsApp number (may differ from phone)
    preferredChannel: v.optional(v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("whatsapp")
    )),
    address: v.optional(
      v.object({
        street: v.optional(v.string()),
        city: v.optional(v.string()),
        state: v.optional(v.string()),
        postalCode: v.optional(v.string()),
        country: v.string(),
      })
    ),
    notes: v.optional(v.string()),
    totalOwed: v.number(),
    totalPaid: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("owing"),
      v.literal("paid"),
      v.literal("archived")
    ),

    // Communication tracking
    lastContactedAt: v.optional(v.number()),
    lastResponseAt: v.optional(v.number()),
    responseRate: v.optional(v.number()), // 0-100 percentage

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_email", ["email"])
    .index("by_phone", ["phone"])
    .index("by_whatsapp", ["whatsapp"]),

  // ============================================
  // Claims
  // ============================================
  claims: defineTable({
    userId: v.id("users"),
    clientId: v.id("clients"),
    title: v.string(),
    description: v.optional(v.string()),
    amount: v.number(),
    amountPaid: v.number(), // Partial payments supported
    currency: currencyValidator,
    dueDate: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("active"),
      v.literal("paused"),
      v.literal("collected"),
      v.literal("partial"), // Partially paid
      v.literal("written_off"),
      v.literal("disputed")
    ),

    // Escalation
    escalationLevel: v.union(
      v.literal(0), // Initial friendly
      v.literal(1), // Follow-up
      v.literal(2), // Firm
      v.literal(3), // Final notice
      v.literal(4)  // Collection/legal
    ),
    lastEscalatedAt: v.optional(v.number()),
    nextEscalationAt: v.optional(v.number()),

    // Reminder tracking
    reminderCount: v.number(),
    lastReminderAt: v.optional(v.number()),
    lastReminderChannel: v.optional(v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("whatsapp")
    )),

    // Documents
    documentIds: v.array(v.id("documents")),
    primaryDocumentId: v.optional(v.id("documents")), // Main contract/invoice

    // AI extracted data
    extractedData: v.optional(v.object({
      clientName: v.optional(v.string()),
      clientEmail: v.optional(v.string()),
      clientPhone: v.optional(v.string()),
      invoiceNumber: v.optional(v.string()),
      terms: v.optional(v.string()),
      items: v.optional(v.array(v.object({
        description: v.string(),
        amount: v.number(),
      }))),
    })),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    collectedAt: v.optional(v.number()),
    lastPaymentAt: v.optional(v.number()), // Last partial/full payment timestamp

    // Blockchain transaction tracking (Circle Arc)
    lastTransactionHash: v.optional(v.string()), // Last payment tx hash
    forwardTransactionHash: v.optional(v.string()), // Forward to merchant tx hash

    // Flagging for review
    flaggedForReview: v.optional(v.boolean()),
    flagReason: v.optional(v.string()),
    flagMetadata: v.optional(v.any()),
    flaggedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_client", ["clientId"])
    .index("by_due_date", ["dueDate"])
    .index("by_status_and_due_date", ["status", "dueDate"])
    .index("by_next_escalation", ["nextEscalationAt"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["userId", "status"],
    }),

  // ============================================
  // Payments
  // ============================================
  payments: defineTable({
    claimId: v.id("claims"),
    userId: v.id("users"),
    clientId: v.id("clients"),
    amount: v.number(),
    fee: v.optional(v.number()), // Platform fee
    netAmount: v.optional(v.number()), // Amount after fees
    currency: currencyValidator,
    method: v.union(
      v.literal("card"),
      v.literal("mpesa"),
      v.literal("bank_transfer"),
      v.literal("ach"),
      v.literal("usdc"),
      v.literal("apple_pay"),
      v.literal("google_pay"),
      v.literal("link"),
      v.literal("other")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
      v.literal("disputed")
    ),

    // Payment provider references
    stripePaymentIntentId: v.optional(v.string()),
    stripeChargeId: v.optional(v.string()),
    circlePaymentId: v.optional(v.string()),
    circleTransferId: v.optional(v.string()),
    transactionHash: v.optional(v.string()), // Blockchain tx hash for USDC
    chain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc") // Future Circle Arc
    )),

    // Geolocation for D3.js mapping (Admin Dashboard)
    geo: v.optional(v.object({
      ip: v.optional(v.string()),
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      region: v.optional(v.string()),
      city: v.optional(v.string()),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
      isp: v.optional(v.string()),
    })),

    // Fraud detection
    riskScore: v.optional(v.number()), // 0-100 from Stripe Radar
    fraudFlags: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),
    refundedAt: v.optional(v.number()),

    metadata: v.optional(v.any()),
  })
    .index("by_claim", ["claimId"])
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_method", ["method"])
    .index("by_stripe_payment_intent", ["stripePaymentIntentId"])
    .index("by_circle_transfer", ["circleTransferId"])
    .index("by_country", ["geo.countryCode"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Wallets
  // ============================================
  wallets: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()), // User-defined wallet name
    type: v.union(
      v.literal("fiat"),
      v.literal("usdc")
    ),

    // Balances
    balance: v.number(),
    pendingBalance: v.number(), // Pending payouts/transfers
    holdBalance: v.number(), // On hold (disputes, etc.)
    lifetimeDeposits: v.number(),
    lifetimeWithdrawals: v.number(),

    currency: currencyValidator,

    // Stripe (for fiat wallets)
    stripeAccountId: v.optional(v.string()), // Stripe Connect account
    stripeAccountStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("enabled"),
      v.literal("restricted"),
      v.literal("disabled")
    )),
    stripeBankAccountId: v.optional(v.string()),

    // Circle (for USDC wallets)
    circleWalletId: v.optional(v.string()),
    circleWalletSetId: v.optional(v.string()),
    circleAddress: v.optional(v.string()), // Blockchain address
    circleChain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc") // Circle Arc L1 - Primary chain for Oryn
    )),

    // Circle Arc specific fields
    arcWalletId: v.optional(v.string()), // Arc-native wallet ID
    arcAddress: v.optional(v.string()), // Arc blockchain address
    arcPrivateKey: v.optional(v.string()), // Encrypted private key for signing Arc transactions
    arcEnabled: v.optional(v.boolean()), // Is Arc enabled for this wallet

    // Auto-forward policy (Circle)
    autoForwardEnabled: v.optional(v.boolean()),
    autoForwardAddress: v.optional(v.string()),
    autoForwardThreshold: v.optional(v.number()),
    autoForwardChain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc")
    )),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_circle_wallet", ["circleWalletId"])
    .index("by_circle_address", ["circleAddress"])
    .index("by_stripe_account", ["stripeAccountId"])
    .index("by_arc_wallet", ["arcWalletId"])
    .index("by_arc_address", ["arcAddress"])
    .index("by_chain", ["circleChain"]),

  // ============================================
  // Linked Cards (for off-ramping to bank)
  // ============================================
  linkedCards: defineTable({
    userId: v.id("users"),

    // Card details (tokenized - we never store full card numbers)
    last4: v.string(),
    brand: v.union(
      v.literal("Visa"),
      v.literal("Mastercard"),
      v.literal("Amex"),
      v.literal("Discover"),
      v.literal("Card")
    ),
    expiryMonth: v.string(),
    expiryYear: v.string(),
    holderName: v.string(),

    // Billing address
    billingAddress: v.optional(v.object({
      street: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
      zip: v.optional(v.string()),
      country: v.optional(v.string()),
    })),

    // External token (from payment processor like Stripe)
    stripePaymentMethodId: v.optional(v.string()),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("removed")
    ),

    // Verification status
    verified: v.boolean(),
    verifiedAt: v.optional(v.number()),

    // Default card for offramp
    isDefault: v.boolean(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    lastUsedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_stripe_payment_method", ["stripePaymentMethodId"]),

  // ============================================
  // Transactions
  // ============================================
  transactions: defineTable({
    walletId: v.id("wallets"),
    userId: v.id("users"),
    paymentId: v.optional(v.id("payments")), // Link to payment if applicable
    claimId: v.optional(v.id("claims")), // Link to claim if applicable

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
    currency: currencyValidator,

    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),

    // External references
    stripePayoutId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    circleTransferId: v.optional(v.string()),
    transactionHash: v.optional(v.string()), // Blockchain tx hash

    // Blockchain details (for USDC/crypto transactions)
    chain: v.optional(v.union(
      v.literal("ethereum"),
      v.literal("polygon"),
      v.literal("solana"),
      v.literal("avalanche"),
      v.literal("arc") // Circle Arc L1
    )),
    blockNumber: v.optional(v.number()),
    confirmations: v.optional(v.number()),
    finalized: v.optional(v.boolean()), // Arc has sub-second finality

    // Arc-specific fields
    arcTransactionId: v.optional(v.string()),
    arcFeeUsdc: v.optional(v.number()), // Arc fees are in USDC

    // Details
    reference: v.optional(v.string()),
    description: v.optional(v.string()),
    failureReason: v.optional(v.string()),

    // Transfer details
    destinationAddress: v.optional(v.string()), // For crypto transfers
    relatedTransactionId: v.optional(v.id("transactions")), // Link to related tx

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),

    metadata: v.optional(v.any()),
  })
    .index("by_wallet", ["walletId"])
    .index("by_user", ["userId"])
    .index("by_payment", ["paymentId"])
    .index("by_claim", ["claimId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_stripe_payout", ["stripePayoutId"])
    .index("by_circle_transfer", ["circleTransferId"])
    .index("by_chain", ["chain"])
    .index("by_arc_transaction", ["arcTransactionId"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Documents
  // ============================================
  documents: defineTable({
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    name: v.string(),
    type: v.union(
      v.literal("contract"),
      v.literal("invoice"),
      v.literal("receipt"),
      v.literal("proof"),
      v.literal("image"),
      v.literal("video"),
      v.literal("other")
    ),

    // Storage
    storageId: v.optional(v.id("_storage")), // Convex storage
    uploadThingKey: v.optional(v.string()), // UploadThing file key
    url: v.string(),
    size: v.number(),
    mimeType: v.string(),

    // AI Parsing
    parsingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    parsedContent: v.optional(v.string()),
    parsedAt: v.optional(v.number()),
    parsingModel: v.optional(aiModelValidator), // Which AI model parsed it
    parsingAttempts: v.number(), // Fallback tracking

    // Extracted structured data (flexible format from AI parsing)
    extractedData: v.optional(v.any()),

    // Vector embedding for semantic search
    embedding: v.optional(v.array(v.float64())),
    embeddingModel: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),

    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_claim", ["claimId"])
    .index("by_type", ["type"])
    .index("by_parsing_status", ["parsingStatus"])
    .index("by_uploadthing_key", ["uploadThingKey"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["userId"],
    }),

  // ============================================
  // Messages
  // ============================================
  messages: defineTable({
    claimId: v.id("claims"),
    userId: v.id("users"),
    clientId: v.id("clients"),

    // Channel and direction
    channel: v.union(
      v.literal("email"),
      v.literal("sms"),
      v.literal("whatsapp")
    ),
    direction: v.union(v.literal("inbound"), v.literal("outbound")),

    // Content
    content: v.string(),
    subject: v.optional(v.string()), // Email subject
    templateName: v.optional(v.string()), // WhatsApp template name
    templateParams: v.optional(v.any()), // WhatsApp template parameters

    // Recipient
    recipient: v.string(), // Email, phone, or WhatsApp number

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("queued"),
      v.literal("sending"),
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("failed"),
      v.literal("read"),
      v.literal("bounced"),
      v.literal("complained") // Spam complaint
    ),
    failureReason: v.optional(v.string()),

    // Escalation context
    escalationLevel: v.optional(v.number()),
    tone: v.optional(v.union(
      v.literal("friendly"),
      v.literal("professional"),
      v.literal("firm"),
      v.literal("urgent")
    )),

    // AI generation
    aiGenerated: v.boolean(),
    aiModel: v.optional(aiModelValidator),

    // Provider IDs
    resendId: v.optional(v.string()), // Resend email ID
    twilioSid: v.optional(v.string()), // Twilio message SID
    whatsappMsgId: v.optional(v.string()), // WhatsApp message ID

    // Owner notification tracking
    ownerNotified: v.boolean(), // Has owner been notified of delivery?
    ownerNotifiedAt: v.optional(v.number()),
    ownerNotificationId: v.optional(v.id("notifications")),

    // Engagement tracking
    openedAt: v.optional(v.number()), // Email opened
    clickedAt: v.optional(v.number()), // Link clicked
    clickedLinks: v.optional(v.array(v.string())),

    // Timestamps
    createdAt: v.number(),
    queuedAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    deliveredAt: v.optional(v.number()),
    readAt: v.optional(v.number()),

    metadata: v.optional(v.any()),
  })
    .index("by_claim", ["claimId"])
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"])
    .index("by_status", ["status"])
    .index("by_channel", ["channel"])
    .index("by_resend_id", ["resendId"])
    .index("by_twilio_sid", ["twilioSid"])
    .index("by_whatsapp_msg_id", ["whatsappMsgId"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Notifications
  // ============================================
  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("payment_received"),
      v.literal("claim_status_change"),
      v.literal("claim_flagged"), // Claim flagged for review
      v.literal("message_delivered"), // Client received message
      v.literal("message_read"), // Client read message (WhatsApp)
      v.literal("message_failed"),
      v.literal("message_received"), // Inbound from client
      v.literal("escalation"),
      v.literal("document_parsed"),
      v.literal("document_failed"),
      v.literal("withdrawal_completed"),
      v.literal("withdrawal_failed"),
      v.literal("transfer_failed"), // Transfer/send failed
      v.literal("transfer_completed"), // Transfer/send completed
      v.literal("kyc_update"),
      v.literal("security_alert"),
      v.literal("referral_signup"),
      v.literal("referral_reward"),
      v.literal("system")
    ),
    title: v.string(),
    message: v.string(),
    read: v.boolean(),
    readAt: v.optional(v.number()),

    // Related entities
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    messageId: v.optional(v.id("messages")),
    documentId: v.optional(v.id("documents")),
    transactionId: v.optional(v.id("transactions")),

    link: v.optional(v.string()),

    // Priority for sorting
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),

    // Timestamps
    createdAt: v.number(),

    metadata: v.optional(v.any()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_read", ["userId", "read"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_claim", ["claimId"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Referrals
  // ============================================
  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("expired")
    ),
    rewardAmount: v.number(),
    rewardClaimed: v.boolean(),
    completedAt: v.optional(v.number()),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred", ["referredId"]),

  // ============================================
  // AI Actions (Audit Log)
  // ============================================
  aiActions: defineTable({
    userId: v.id("users"),
    claimId: v.optional(v.id("claims")),
    documentId: v.optional(v.id("documents")),
    messageId: v.optional(v.id("messages")),

    type: v.union(
      v.literal("document_parse"),
      v.literal("message_generate"),
      v.literal("escalation_decision"),
      v.literal("semantic_search"),
      v.literal("embedding_generate"),
      v.literal("tone_analysis"),
      v.literal("data_extraction"),
      v.literal("ocr")
    ),

    // Model info
    model: aiModelValidator,
    fallbackChain: v.optional(v.array(aiModelValidator)), // Models tried before success
    wasFallback: v.boolean(), // Did primary fail?

    // Request/Response
    input: v.any(),
    output: v.optional(v.any()),

    // Usage
    tokensInput: v.optional(v.number()),
    tokensOutput: v.optional(v.number()),
    tokensTotal: v.number(),
    costUsd: v.optional(v.number()), // Estimated cost

    // Performance
    durationMs: v.number(),
    latencyMs: v.optional(v.number()), // Time to first token

    // Status
    status: v.union(v.literal("success"), v.literal("error")),
    error: v.optional(v.string()),
    errorCode: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_claim", ["claimId"])
    .index("by_document", ["documentId"])
    .index("by_type", ["type"])
    .index("by_model", ["model"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Payment Links (for pay.oryn.cc)
  // ============================================
  paymentLinks: defineTable({
    claimId: v.id("claims"),
    userId: v.id("users"),
    clientId: v.id("clients"),
    token: v.string(), // Secure random token
    shortCode: v.optional(v.string()), // Short URL code

    amount: v.number(),
    currency: currencyValidator,

    // Allowed payment methods
    methods: v.array(
      v.union(
        v.literal("card"),
        v.literal("mpesa"),
        v.literal("bank_transfer"),
        v.literal("ach"),
        v.literal("usdc"),
        v.literal("apple_pay"),
        v.literal("google_pay")
      )
    ),

    // Status
    status: v.union(
      v.literal("active"),
      v.literal("used"),
      v.literal("expired"),
      v.literal("cancelled")
    ),

    // Usage
    views: v.number(),
    lastViewedAt: v.optional(v.number()),
    usedAt: v.optional(v.number()),
    paymentId: v.optional(v.id("payments")),

    // Expiration
    expiresAt: v.number(),

    // Customization
    customMessage: v.optional(v.string()),
    brandingEnabled: v.boolean(),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_token", ["token"])
    .index("by_short_code", ["shortCode"])
    .index("by_claim", ["claimId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_expires_at", ["expiresAt"]),

  // ============================================
  // Webhook Events (Audit/Debug)
  // ============================================
  webhookEvents: defineTable({
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
    eventType: v.string(), // e.g., "payment_intent.succeeded"
    eventId: v.optional(v.string()), // Provider's event ID

    // Payload
    payload: v.any(),

    // Processing
    status: v.union(
      v.literal("received"),
      v.literal("processing"),
      v.literal("processed"),
      v.literal("failed"),
      v.literal("ignored")
    ),
    processedAt: v.optional(v.number()),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()), // Additional processing metadata

    // Related entities (if identified)
    userId: v.optional(v.id("users")),
    claimId: v.optional(v.id("claims")),
    paymentId: v.optional(v.id("payments")),
    messageId: v.optional(v.id("messages")),

    // Request metadata
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
  })
    .index("by_provider", ["provider"])
    .index("by_event_type", ["eventType"])
    .index("by_event_id", ["eventId"])
    .index("by_status", ["status"])
    .index("by_user", ["userId"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Security Sessions (Audit Log)
  // ============================================
  securitySessions: defineTable({
    userId: v.id("users"),
    clerkSessionId: v.string(),

    // Session info
    ipAddress: v.string(),
    userAgent: v.string(),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    os: v.optional(v.string()),

    // Geolocation
    geo: v.optional(v.object({
      country: v.optional(v.string()),
      countryCode: v.optional(v.string()),
      region: v.optional(v.string()),
      city: v.optional(v.string()),
      lat: v.optional(v.number()),
      lng: v.optional(v.number()),
    })),

    // Security flags
    suspicious: v.boolean(),
    suspiciousReasons: v.optional(v.array(v.string())),

    // Activity
    lastActivityAt: v.number(),
    actionsCount: v.number(),

    // Timestamps
    createdAt: v.number(),
    endedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_clerk_session", ["clerkSessionId"])
    .index("by_ip", ["ipAddress"])
    .index("by_suspicious", ["suspicious"])
    .index("by_created_at", ["createdAt"]),

  // ============================================
  // Rate Limit Tracking
  // ============================================
  rateLimits: defineTable({
    identifier: v.string(), // IP, userId, or composite key
    action: v.string(), // e.g., "api:payments", "api:messages"
    windowStart: v.number(),
    count: v.number(),
    blocked: v.boolean(),
  })
    .index("by_identifier_and_action", ["identifier", "action"])
    .index("by_window_start", ["windowStart"]),

  // ============================================
  // System Settings (Admin)
  // ============================================
  systemSettings: defineTable({
    key: v.string(),
    value: v.any(),
    description: v.optional(v.string()),
    updatedBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

  // ============================================
  // Workflows (AI Automation Rules)
  // ============================================
  workflows: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    enabled: v.boolean(),

    // Workflow type
    type: v.union(
      v.literal("auto_reminder"),
      v.literal("smart_escalation"),
      v.literal("payment_confirmation"),
      v.literal("document_processing"),
      v.literal("multi_channel")
    ),

    // Trigger configuration
    trigger: v.object({
      event: v.union(
        v.literal("claim_overdue"),
        v.literal("payment_received"),
        v.literal("document_uploaded"),
        v.literal("scheduled"),
        v.literal("manual")
      ),
      conditions: v.optional(v.object({
        daysOverdue: v.optional(v.number()),
        minAmount: v.optional(v.number()),
        escalationLevel: v.optional(v.number()),
      })),
      schedule: v.optional(v.object({
        frequency: v.union(v.literal("daily"), v.literal("weekly")),
        time: v.string(), // "09:00"
        timezone: v.string(),
      })),
    }),

    // Actions to perform
    actions: v.array(v.object({
      type: v.union(
        v.literal("send_reminder"),
        v.literal("escalate_claim"),
        v.literal("send_thank_you"),
        v.literal("parse_document"),
        v.literal("create_claim"),
        v.literal("notify_user")
      ),
      config: v.optional(v.object({
        channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"))),
        tone: v.optional(v.union(v.literal("friendly"), v.literal("professional"), v.literal("firm"))),
        delayMinutes: v.optional(v.number()),
      })),
    })),

    // Statistics
    stats: v.object({
      totalRuns: v.number(),
      successfulRuns: v.number(),
      failedRuns: v.number(),
      lastRunAt: v.optional(v.number()),
    }),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "type"])
    .index("by_user_and_enabled", ["userId", "enabled"]),

  // ============================================================
  // THOUGHT SIGNATURES - Marathon Agent State Persistence
  // ============================================================
  // Enables the agent to maintain state across hours/days/weeks
  // Core requirement for Gemini 3 Marathon Agent track
  thoughtSignatures: defineTable({
    // References
    claimId: v.id("claims"),
    userId: v.id("users"),

    // Current thinking level (L1 → L2 → L3 → L4)
    level: v.union(
      v.literal("L1_PARSE"),      // Parse contract/invoice
      v.literal("L2_GENERATE"),   // Generate invoice/reminder
      v.literal("L3_COMMUNICATE"), // Send communications
      v.literal("L4_COLLECT"),    // Process payment
      v.literal("COLLECTED"),     // Terminal state - payment received
      v.literal("FAILED")         // Terminal state - collection failed
    ),

    // Agent's accumulated context about this claim
    context: v.object({
      // Client info extracted during L1
      clientName: v.optional(v.string()),
      clientEmail: v.optional(v.string()),
      clientPhone: v.optional(v.string()),

      // Invoice details
      invoiceAmount: v.number(),
      currency: v.string(),
      dueDate: v.optional(v.number()),
      daysSinceDue: v.number(),

      // Communication history summary
      attemptHistory: v.array(v.object({
        channel: v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp")),
        sentAt: v.number(),
        messageType: v.string(), // friendly, follow_up, firm, urgent, final
        result: v.union(
          v.literal("sent"),
          v.literal("delivered"),
          v.literal("opened"),
          v.literal("clicked"),
          v.literal("replied"),
          v.literal("bounced"),
          v.literal("failed"),
          v.literal("no_response")
        ),
        responseAt: v.optional(v.number()),
        responseSummary: v.optional(v.string()),
      })),

      // Client response analysis
      clientResponseSummary: v.optional(v.string()),
      clientSentiment: v.optional(v.union(
        v.literal("positive"),
        v.literal("neutral"),
        v.literal("negative"),
        v.literal("hostile"),
        v.literal("unknown")
      )),
      promisedPaymentDate: v.optional(v.number()),

      // Payment info
      paymentReceived: v.optional(v.number()),
      paymentTransactionHash: v.optional(v.string()),
    }),

    // What the agent plans to do next
    nextAction: v.object({
      action: v.union(
        v.literal("parse_document"),
        v.literal("generate_invoice"),
        v.literal("send_reminder"),
        v.literal("escalate"),
        v.literal("wait_for_response"),
        v.literal("wait_for_payment"),
        v.literal("try_alternate_channel"),
        v.literal("final_notice"),
        v.literal("mark_collected"),
        v.literal("mark_failed"),
        v.literal("none")
      ),
      channel: v.optional(v.union(v.literal("email"), v.literal("sms"), v.literal("whatsapp"))),
      scheduledFor: v.number(),
      reasoning: v.string(),
    }),

    // Self-correction tracking
    corrections: v.array(v.object({
      failedAction: v.string(),
      failureReason: v.string(),
      correctedTo: v.string(),
      correctedAt: v.number(),
      reasoning: v.string(),
    })),

    // Escalation tracking
    escalationLevel: v.union(
      v.literal(0), // Friendly
      v.literal(1), // Follow-up
      v.literal(2), // Firm
      v.literal(3), // Urgent
      v.literal(4)  // Final/Legal
    ),

    // Timestamps
    startedAt: v.number(),
    lastUpdatedAt: v.number(),
    completedAt: v.optional(v.number()),

    // Performance metrics
    totalActionsExecuted: v.number(),
    totalCorrections: v.number(),
    totalApiCalls: v.number(),
    totalTokensUsed: v.number(),
  })
    .index("by_claim", ["claimId"])
    .index("by_user", ["userId"])
    .index("by_user_and_level", ["userId", "level"])
    .index("by_scheduled_action", ["nextAction.scheduledFor"]),

  // ============================================================
  // AGENT SESSIONS - Track autonomous agent runs
  // ============================================================
  agentSessions: defineTable({
    thoughtSignatureId: v.id("thoughtSignatures"),
    userId: v.id("users"),
    claimId: v.id("claims"),

    // Session info
    sessionType: v.union(
      v.literal("scheduled"),    // Triggered by cron
      v.literal("webhook"),      // Triggered by external event
      v.literal("manual"),       // Triggered by user
      v.literal("correction")    // Self-correction run
    ),

    status: v.union(
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("paused")
    ),

    // Actions taken in this session
    actions: v.array(v.object({
      type: v.string(),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
      success: v.boolean(),
      result: v.optional(v.any()),
      error: v.optional(v.string()),
      tokensUsed: v.optional(v.number()),
    })),

    // AI model used
    model: v.string(),
    totalTokensUsed: v.number(),
    totalDurationMs: v.number(),

    // Error tracking
    error: v.optional(v.string()),
    errorStack: v.optional(v.string()),

    startedAt: v.number(),
    completedAt: v.optional(v.number()),
  })
    .index("by_thought_signature", ["thoughtSignatureId"])
    .index("by_user", ["userId"])
    .index("by_claim", ["claimId"])
    .index("by_status", ["status"]),
});
