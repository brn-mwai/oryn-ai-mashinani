# Oryn Platform - Database Schema Documentation

## Overview

Oryn uses **Convex** as its real-time database. This document describes all tables, their relationships, and how they integrate with external services.

**Schema Location:** `packages/database/convex/schema.ts`

---

## Table Summary

| Table | Description | Primary Integration |
|-------|-------------|---------------------|
| `users` | User accounts and settings | Clerk |
| `clients` | Debtors/people who owe money | - |
| `claims` | Invoices/debts being collected | - |
| `payments` | Payment transactions | Stripe, Circle |
| `wallets` | User wallet balances | Stripe Connect, Circle |
| `transactions` | Wallet transaction history | Stripe, Circle |
| `documents` | Uploaded files with AI parsing | UploadThing, Gemini |
| `messages` | Outreach messages | Resend, Twilio, WhatsApp |
| `notifications` | Real-time notifications | - |
| `referrals` | Referral program tracking | - |
| `aiActions` | AI action audit log | Gemini, OpenAI, Claude, Groq |
| `paymentLinks` | pay.oryn.cc links | - |
| `webhookEvents` | Webhook audit log | All providers |
| `securitySessions` | Login session tracking | Clerk, IPinfo |
| `rateLimits` | Rate limit tracking | Arcjet, Upstash |
| `systemSettings` | Admin configuration | - |

---

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ENTITY RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────┘

                                    ┌───────────┐
                                    │   users   │
                                    └─────┬─────┘
                                          │
          ┌───────────────┬───────────────┼───────────────┬───────────────┐
          │               │               │               │               │
          ▼               ▼               ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  clients  │   │  wallets  │   │ documents │   │notifications│  │ referrals │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘   └───────────┘   └───────────┘
          │               │               │
          │               │               │
          ▼               ▼               │
    ┌───────────┐   ┌───────────┐         │
    │  claims   │◀──│transactions│        │
    └─────┬─────┘   └───────────┘         │
          │                               │
          ├───────────────────────────────┘
          │
          ▼
    ┌───────────┐
    │ payments  │
    └─────┬─────┘
          │
          │
          ▼
    ┌───────────┐
    │ messages  │
    └───────────┘


Supporting Tables (not shown):
- paymentLinks → claims
- webhookEvents → users, claims, payments, messages
- securitySessions → users
- aiActions → users, claims, documents, messages
- rateLimits (standalone)
- systemSettings (standalone)
```

---

## Table Definitions

### 1. Users

Primary user account table, synced with Clerk.

```typescript
users: {
  // Identity
  clerkId: string;           // Clerk user ID (pk_...)
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  phone?: string;
  role: "user" | "admin" | "super_admin";

  // Payment Providers
  stripeCustomerId?: string;     // Stripe customer ID
  stripeAccountId?: string;      // Stripe Connect (for payouts)

  // Settings
  settings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    deliveryConfirmations: boolean;
    timezone: string;
    currency: Currency;
    preferredAiModel?: AIModel;
    autoEscalation: boolean;
    escalationSchedule?: {
      delayDays: number[];
    };
  };

  // KYC
  kycStatus?: "not_started" | "pending" | "verified" | "rejected";
  kycSubmittedAt?: number;
  kycVerifiedAt?: number;

  // Referral
  referralCode: string;
  referredBy?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;
  lastLoginAt?: number;
}
```

**Indexes:**
- `by_clerk_id` - Clerk webhook lookup
- `by_email` - User search
- `by_referral_code` - Referral tracking
- `by_stripe_customer` - Stripe webhook lookup
- `by_stripe_account` - Payout lookup

**Integration Flow:**
```
Clerk Webhook (user.created)
    → Create users record
    → Create Circle wallet
    → Send welcome email (Resend)
```

---

### 2. Clients

Debtors/people who owe money to users.

```typescript
clients: {
  userId: Id<"users">;           // Owner
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;             // May differ from phone
  preferredChannel?: "email" | "sms" | "whatsapp";
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  notes?: string;

  // Financials
  totalOwed: number;
  totalPaid: number;
  status: "active" | "owing" | "paid" | "archived";

  // Communication
  lastContactedAt?: number;
  lastResponseAt?: number;
  responseRate?: number;         // 0-100

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

**Status Flow:**
```
active → (claim created) → owing → (claim paid) → paid
                                                   ↓
                                              archived
```

---

### 3. Claims

Invoices/debts being collected.

```typescript
claims: {
  userId: Id<"users">;
  clientId: Id<"clients">;
  title: string;
  description?: string;

  // Financials
  amount: number;
  amountPaid: number;            // Partial payments
  currency: Currency;
  dueDate?: number;
  status: "draft" | "active" | "paused" | "collected" | "partial" | "written_off" | "disputed";

  // Escalation
  escalationLevel: 0 | 1 | 2 | 3 | 4;
  lastEscalatedAt?: number;
  nextEscalationAt?: number;

  // Reminders
  reminderCount: number;
  lastReminderAt?: number;
  lastReminderChannel?: "email" | "sms" | "whatsapp";

  // Documents
  documentIds: Id<"documents">[];
  primaryDocumentId?: Id<"documents">;

  // AI Extracted
  extractedData?: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    invoiceNumber?: string;
    terms?: string;
    items?: Array<{
      description: string;
      amount: number;
    }>;
  };

  // Timestamps
  createdAt: number;
  updatedAt: number;
  collectedAt?: number;
}
```

**Escalation Levels:**
| Level | Tone | Typical Timing | Action |
|-------|------|----------------|--------|
| 0 | Friendly | Day 0-7 | Initial reminder |
| 1 | Professional | Day 7-14 | Follow-up |
| 2 | Firm | Day 14-21 | Mention consequences |
| 3 | Urgent | Day 21-30 | Final notice |
| 4 | Final | Day 30+ | Collection/legal mention |

**Status Flow:**
```
draft → active ──→ collected
          │            ↑
          ├→ partial ──┤
          │            │
          ├→ paused    │
          │            │
          ├→ disputed  │
          │            │
          └→ written_off
```

---

### 4. Payments

Payment transactions from clients.

```typescript
payments: {
  claimId: Id<"claims">;
  userId: Id<"users">;
  clientId: Id<"clients">;

  // Amounts
  amount: number;
  fee?: number;                  // Platform fee
  netAmount?: number;            // After fees
  currency: Currency;

  // Method
  method: "card" | "bank_transfer" | "ach" | "usdc" | "apple_pay" | "google_pay" | "link" | "other";
  status: "pending" | "processing" | "completed" | "failed" | "refunded" | "disputed";

  // Provider References
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  circlePaymentId?: string;
  circleTransferId?: string;
  transactionHash?: string;      // Blockchain
  chain?: "ethereum" | "polygon" | "solana" | "avalanche" | "arc";

  // Geolocation (for D3.js mapping)
  geo?: {
    ip?: string;
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
    isp?: string;
  };

  // Fraud
  riskScore?: number;            // 0-100 from Radar
  fraudFlags?: string[];

  // Timestamps
  createdAt: number;
  completedAt?: number;
  refundedAt?: number;

  metadata?: any;
}
```

**Integration Flow:**
```
Client pays via pay.oryn.cc
    ↓
┌─────────────────┐    ┌─────────────────┐
│ Stripe Checkout │ OR │ Circle USDC     │
└────────┬────────┘    └────────┬────────┘
         │                      │
         ▼                      ▼
    Webhook received      Webhook received
         │                      │
         └──────────┬───────────┘
                    ▼
           payments.create()
                    │
                    ▼
           claims.update(status: collected)
                    │
                    ▼
           wallets.credit()
                    │
                    ▼
           notifications.create() → Owner email
```

---

### 5. Wallets

User wallet balances for fiat and USDC.

```typescript
wallets: {
  userId: Id<"users">;
  type: "fiat" | "usdc";

  // Balances
  balance: number;
  pendingBalance: number;
  holdBalance: number;
  lifetimeDeposits: number;
  lifetimeWithdrawals: number;

  currency: Currency;

  // Stripe (fiat)
  stripeAccountId?: string;
  stripeAccountStatus?: "pending" | "enabled" | "restricted" | "disabled";
  stripeBankAccountId?: string;

  // Circle (USDC)
  circleWalletId?: string;
  circleWalletSetId?: string;
  circleAddress?: string;        // Blockchain address
  circleChain?: "ethereum" | "polygon" | "solana" | "avalanche";

  // Auto-forward
  autoForwardEnabled?: boolean;
  autoForwardAddress?: string;
  autoForwardThreshold?: number;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}
```

**Wallet Types:**
- **Fiat**: USD balance from card/bank payments. Withdraws via Stripe Connect.
- **USDC**: Stablecoin balance from crypto payments. Withdraws via Circle.

---

### 6. Transactions

Wallet transaction history.

```typescript
transactions: {
  walletId: Id<"wallets">;
  userId: Id<"users">;
  paymentId?: Id<"payments">;
  claimId?: Id<"claims">;

  type: "deposit" | "withdrawal" | "payment_received" | "fee" | "refund" | "transfer_in" | "transfer_out" | "adjustment" | "referral_reward";

  amount: number;
  fee?: number;
  netAmount?: number;
  currency: Currency;

  status: "pending" | "processing" | "completed" | "failed" | "cancelled";

  // Provider References
  stripePayoutId?: string;
  stripeTransferId?: string;
  circleTransferId?: string;
  transactionHash?: string;

  reference?: string;
  description?: string;
  failureReason?: string;

  // Timestamps
  createdAt: number;
  completedAt?: number;

  metadata?: any;
}
```

---

### 7. Documents

Uploaded files with AI parsing.

```typescript
documents: {
  userId: Id<"users">;
  claimId?: Id<"claims">;
  name: string;
  type: "contract" | "invoice" | "receipt" | "proof" | "image" | "video" | "other";

  // Storage
  storageId?: Id<"_storage">;    // Convex storage
  uploadThingKey?: string;       // UploadThing
  url: string;
  size: number;
  mimeType: string;

  // AI Parsing
  parsingStatus: "pending" | "processing" | "completed" | "failed";
  parsedContent?: string;
  parsedAt?: number;
  parsingModel?: AIModel;
  parsingAttempts: number;       // Fallback tracking

  // Extracted Data
  extractedData?: {
    title?: string;
    date?: string;
    parties?: string[];
    amounts?: Array<{
      value: number;
      currency: string;
      description?: string;
    }>;
    dueDate?: string;
    terms?: string;
    summary?: string;
  };

  // Semantic Search
  embedding?: number[];          // 1536 dimensions
  embeddingModel?: string;

  // Timestamps
  createdAt: number;
  updatedAt: number;

  metadata?: any;
}
```

**AI Parsing Flow:**
```
Upload via UploadThing
    │
    ▼
documents.create(parsingStatus: "pending")
    │
    ▼
Inngest: document.uploaded event
    │
    ▼
┌─────────────────────────────────────────┐
│ AI Parsing Fallback Chain:              │
│ 1. Gemini 2.0 Flash (primary)           │
│ 2. OpenAI GPT-4o                        │
│ 3. Claude Sonnet                        │
│ 4. OCR + Groq                           │
└─────────────────────────────────────────┘
    │
    ▼
documents.update(parsingStatus: "completed", extractedData: {...})
    │
    ▼
Generate embedding for semantic search
```

---

### 8. Messages

Outreach messages to clients.

```typescript
messages: {
  claimId: Id<"claims">;
  userId: Id<"users">;
  clientId: Id<"clients">;

  // Channel
  channel: "email" | "sms" | "whatsapp";
  direction: "inbound" | "outbound";

  // Content
  content: string;
  subject?: string;              // Email
  templateName?: string;         // WhatsApp
  templateParams?: any;

  recipient: string;

  // Status
  status: "draft" | "queued" | "sending" | "sent" | "delivered" | "failed" | "read" | "bounced" | "complained";
  failureReason?: string;

  // Escalation Context
  escalationLevel?: number;
  tone?: "friendly" | "professional" | "firm" | "urgent";

  // AI
  aiGenerated: boolean;
  aiModel?: AIModel;

  // Provider IDs
  resendId?: string;
  twilioSid?: string;
  whatsappMsgId?: string;

  // Owner Notification
  ownerNotified: boolean;
  ownerNotifiedAt?: number;
  ownerNotificationId?: Id<"notifications">;

  // Engagement
  openedAt?: number;
  clickedAt?: number;
  clickedLinks?: string[];

  // Timestamps
  createdAt: number;
  queuedAt?: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;

  metadata?: any;
}
```

**Message Flow:**
```
User creates reminder in dashboard
    │
    ▼
AI generates message (Gemini/Groq)
    │
    ▼
messages.create(status: "queued")
    │
    ▼
Inngest: message.queued event
    │
    ├─→ Email: Resend API → resendId
    ├─→ SMS: Twilio API → twilioSid
    └─→ WhatsApp: Meta API → whatsappMsgId
    │
    ▼
Webhook: delivered
    │
    ▼
messages.update(status: "delivered")
    │
    ▼
notifications.create(type: "message_delivered")
    │
    ▼
Resend: Owner confirmation email
```

---

### 9. Notifications

Real-time in-app notifications.

```typescript
notifications: {
  userId: Id<"users">;
  type: "payment_received" | "claim_status_change" | "message_delivered" | "message_read" | "message_failed" | "message_received" | "escalation" | "document_parsed" | "document_failed" | "withdrawal_completed" | "withdrawal_failed" | "kyc_update" | "security_alert" | "referral_signup" | "referral_reward" | "system";
  title: string;
  message: string;
  read: boolean;
  readAt?: number;

  // Related Entities
  claimId?: Id<"claims">;
  paymentId?: Id<"payments">;
  messageId?: Id<"messages">;
  documentId?: Id<"documents">;
  transactionId?: Id<"transactions">;

  link?: string;
  priority: "low" | "normal" | "high" | "urgent";

  createdAt: number;
  metadata?: any;
}
```

---

### 10. AI Actions (Audit Log)

Audit log of all AI operations.

```typescript
aiActions: {
  userId: Id<"users">;
  claimId?: Id<"claims">;
  documentId?: Id<"documents">;
  messageId?: Id<"messages">;

  type: "document_parse" | "message_generate" | "escalation_decision" | "semantic_search" | "embedding_generate" | "tone_analysis" | "data_extraction" | "ocr";

  // Model Info
  model: AIModel;
  fallbackChain?: AIModel[];     // Models tried before success
  wassFallback: boolean;

  // Request/Response
  input: any;
  output?: any;

  // Usage
  tokensInput?: number;
  tokensOutput?: number;
  tokensTotal: number;
  costUsd?: number;

  // Performance
  durationMs: number;
  latencyMs?: number;

  // Status
  status: "success" | "error";
  error?: string;
  errorCode?: string;

  createdAt: number;
}
```

---

### 11. Webhook Events (Audit/Debug)

Audit log of all incoming webhooks.

```typescript
webhookEvents: {
  provider: "clerk" | "stripe" | "circle" | "resend" | "twilio" | "whatsapp" | "uploadthing" | "inngest";
  eventType: string;
  eventId?: string;

  payload: any;

  status: "received" | "processing" | "processed" | "failed" | "ignored";
  processedAt?: number;
  error?: string;

  // Related Entities
  userId?: Id<"users">;
  claimId?: Id<"claims">;
  paymentId?: Id<"payments">;
  messageId?: Id<"messages">;

  ipAddress?: string;
  userAgent?: string;

  createdAt: number;
}
```

---

### 12. Security Sessions

Login session tracking for security.

```typescript
securitySessions: {
  userId: Id<"users">;
  clerkSessionId: string;

  ipAddress: string;
  userAgent: string;
  device?: string;
  browser?: string;
  os?: string;

  geo?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };

  suspicious: boolean;
  suspiciousReasons?: string[];

  lastActivityAt: number;
  actionsCount: number;

  createdAt: number;
  endedAt?: number;
}
```

---

## Supported Currencies

```typescript
type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "USDC" | "EURC";
```

---

## Supported AI Models

```typescript
type AIModel =
  | "gemini-2.0-flash"
  | "gemini-1.5-pro"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "claude-sonnet-4-20250514"
  | "claude-haiku"
  | "llama-3.3-70b"
  | "llama-4-scout"
  | "ocr-groq";
```

---

## Vector Search

The `documents` table supports semantic search via Convex's vector index:

```typescript
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 1536,
  filterFields: ["userId"],
})
```

**Query Example:**
```typescript
const results = await ctx.db
  .query("documents")
  .withIndex("by_embedding", q =>
    q.vector(queryEmbedding)
      .filter(q.eq(q.field("userId"), userId))
  )
  .take(10);
```

---

## Data Retention

| Table | Retention | Notes |
|-------|-----------|-------|
| `users` | Indefinite | Soft delete only |
| `claims` | Indefinite | Legal records |
| `payments` | Indefinite | Financial records |
| `messages` | 7 years | Compliance |
| `webhookEvents` | 90 days | Debug/audit |
| `aiActions` | 90 days | Audit |
| `rateLimits` | 24 hours | Sliding window |
| `securitySessions` | 90 days | Security audit |

---

## Indexes Summary

All tables include strategic indexes for:
- **Primary lookups**: by_user, by_claim, by_client
- **Status filtering**: by_status, by_user_and_status
- **External ID lookups**: by_stripe_*, by_circle_*, by_resend_id, by_twilio_sid
- **Time-based queries**: by_created_at, by_due_date
- **Search**: Full-text search on claims.title, vector search on documents.embedding
