# Oryn Platform - System Architecture

## Overview

This document defines the integration architecture and data flows for the Oryn platform. It shows how all services connect and communicate.

---

## 1. HIGH-LEVEL ARCHITECTURE

```
                                    ┌─────────────────────────────────────────────────────────┐
                                    │                     CLIENTS                              │
                                    │   Browser (Web)  │  Mobile  │  API Consumers            │
                                    └─────────────────────────────────────────────────────────┘
                                                        │
                                                        ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    EDGE / CDN (Vercel)                                        │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│   │  oryn.cc    │  │ app.oryn.cc │  │ pay.oryn.cc │  │admin.oryn.cc│                         │
│   │  (Landing)  │  │ (Dashboard) │  │  (Payment)  │  │   (Admin)   │                         │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                         │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    │                   │                   │
                                    ▼                   ▼                   ▼
┌───────────────────────────┐  ┌─────────────────────────────┐  ┌───────────────────────────────┐
│      AUTHENTICATION       │  │        API LAYER            │  │         SECURITY              │
│         (Clerk)           │  │   Next.js API Routes        │  │         (Arcjet)              │
│                           │  │   Convex Functions          │  │   - Rate Limiting             │
│  - User Sessions          │  │   Inngest Functions         │  │   - Bot Protection            │
│  - JWT Tokens             │  │                             │  │   - Shield WAF                │
│  - RBAC                   │  │                             │  │                               │
└───────────────────────────┘  └─────────────────────────────┘  └───────────────────────────────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────────────────────────┐
        │                   │                   │                   │                   │
        ▼                   ▼                   ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   DATABASE    │  │   PAYMENTS    │  │ NOTIFICATIONS │  │ AI SERVICES   │  │ FILE STORAGE  │
│   (Convex)    │  │               │  │               │  │               │  │ (UploadThing) │
│               │  │ Stripe (Fiat) │  │ Resend (Email)│  │ Gemini (Main) │  │               │
│ - Users       │  │ Circle (USDC) │  │ Twilio (SMS)  │  │ OpenAI (Fallback)│               │
│ - Claims      │  │               │  │ WhatsApp      │  │ Claude (Fallback)│               │
│ - Wallets     │  │               │  │               │  │ Groq (Fast)   │  │               │
│ - Messages    │  │               │  │               │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │                   │                   │
        └───────────────────┴───────────────────┴───────────────────┴───────────────────┘
                                                │
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BACKGROUND PROCESSING (Inngest)                                   │
│   - User Onboarding Workflow                                                                   │
│   - Claim Escalation Engine (Daily Cron)                                                       │
│   - Payment Processing Workflow                                                                │
│   - Message Delivery Workflow                                                                  │
│   - Document Parsing Pipeline                                                                  │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
                                                │
                                                ▼
┌───────────────────────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY                                                     │
│   ┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐          │
│   │  PostHog    │       │   Sentry    │       │   IPinfo    │       │   D3.js     │          │
│   │ (Analytics) │       │  (Errors)   │       │ (Geolocation)│      │ (Viz)       │          │
│   └─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘          │
└───────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA FLOW DIAGRAMS

### 2.1 User Registration Flow

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   Browser   │──────▶│   Clerk     │──────▶│   Webhook   │──────▶│   Inngest   │
│  (Sign Up)  │       │ (Auth)      │       │  /api/clerk │       │ user.created│
└─────────────┘       └─────────────┘       └─────────────┘       └─────────────┘
                                                                          │
                      ┌───────────────────────────────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────────────────────────────────────────┐
        │                    INNGEST WORKFLOW                           │
        │  Step 1: Create User in Convex                               │
        │    └─▶ users.create({ clerkId, email, name })                │
        │                                                               │
        │  Step 2: Create Circle Wallet                                 │
        │    └─▶ Circle API: POST /wallets                             │
        │    └─▶ wallets.create({ userId, circleWalletId })            │
        │                                                               │
        │  Step 3: Send Welcome Email                                   │
        │    └─▶ Resend: Welcome to Oryn                               │
        │                                                               │
        │  Step 4: Track Event                                          │
        │    └─▶ PostHog: user_created                                 │
        └──────────────────────────────────────────────────────────────┘
```

**Database Records Created:**
- `users` table: User profile linked to Clerk
- `wallets` table: Fiat and USDC wallet records
- `notifications` table: Welcome notification

---

### 2.2 Claim Creation Flow

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Dashboard  │──────▶│ UploadThing │──────▶│   Convex    │
│   Upload    │       │   (File)    │       │  documents  │
│  Contract   │       └─────────────┘       └─────────────┘
└─────────────┘               │                    │
                              │                    │
                              ▼                    │
                      ┌─────────────┐              │
                      │   Inngest   │◀─────────────┘
                      │doc.uploaded │
                      └─────────────┘
                              │
        ┌─────────────────────┴─────────────────────┐
        │                                           │
        ▼                                           ▼
┌───────────────┐                          ┌───────────────┐
│  AI PARSING   │                          │   FALLBACK    │
│   Gemini      │─── fails? ──────────────▶│   Chain       │
│               │                          │               │
└───────────────┘                          │ 1. OpenAI     │
        │                                  │ 2. Claude     │
        │ success                          │ 3. OCR+Groq   │
        │                                  └───────────────┘
        │                                          │
        └────────────────────┬─────────────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │   Convex    │
                      │   claims    │
                      │  .create()  │
                      └─────────────┘
                             │
                             ▼
                      ┌─────────────┐
                      │   Convex    │
                      │ embeddings  │
                      │  .create()  │
                      └─────────────┘
```

**Data Extracted from Document:**
```typescript
{
  clientName: string;      // Debtor name
  clientEmail?: string;    // Debtor email
  clientPhone?: string;    // Debtor phone
  amount: number;          // Amount owed
  currency: string;        // USD, EUR, etc.
  dueDate?: string;        // Payment due date
  description?: string;    // Invoice/contract description
  terms?: string;          // Payment terms
  rawText: string;         // Full extracted text
  embedding: number[];     // Vector embedding for search
}
```

---

### 2.3 Payment Collection Flow (Fiat - Stripe)

```
                                        ┌─────────────────────────────┐
                                        │      CLIENT PAYS            │
                                        │    pay.oryn.cc/[id]         │
                                        └─────────────────────────────┘
                                                      │
                                                      ▼
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                                  STRIPE CHECKOUT                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │
│  │    Card     │  │     ACH     │  │ Apple/Google│  │    Link     │                   │
│  │   Payment   │  │   Debit     │  │     Pay     │  │   Wallet    │                   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘                   │
└───────────────────────────────────────────────────────────────────────────────────────┘
                                                      │
                                                      │ Webhook
                                                      ▼
                                        ┌─────────────────────────────┐
                                        │   /api/webhooks/stripe      │
                                        │   payment_intent.succeeded  │
                                        └─────────────────────────────┘
                                                      │
                                                      ▼
                                        ┌─────────────────────────────┐
                                        │        Inngest              │
                                        │   payment.received          │
                                        └─────────────────────────────┘
                                                      │
        ┌─────────────────────────────────────────────┴────────────────────────────────┐
        │                                                                              │
        ▼                                                                              ▼
┌───────────────────┐                                                    ┌───────────────────┐
│   Step 1: Verify  │                                                    │   Step 4: Notify  │
│   Stripe payment  │                                                    │   Owner (Email)   │
│   metadata        │                                                    │                   │
└───────────────────┘                                                    │  Subject: Payment │
        │                                                                │  Received!        │
        ▼                                                                │  $X from [Client] │
┌───────────────────┐                                                    └───────────────────┘
│   Step 2: Update  │                                                              ▲
│   Convex records  │                                                              │
│                   │                                                              │
│  - payments.create│──────────────────────────────────────────────────────────────┤
│  - claims.update  │                                                              │
│    (status:paid)  │                                                              │
│  - wallets.credit │                                                              │
└───────────────────┘                                                              │
        │                                                                          │
        ▼                                                                          │
┌───────────────────┐                                                              │
│   Step 3: Create  │──────────────────────────────────────────────────────────────┘
│   Notification    │
│   in Convex       │
└───────────────────┘
```

---

### 2.4 Payment Collection Flow (USDC - Circle)

```
┌─────────────────────────────────┐
│      CLIENT SELECTS USDC        │
│    pay.oryn.cc/[id]?method=usdc │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Display Owner's Circle Wallet │
│   Address for the Chain         │
│   (Polygon, Ethereum, Solana)   │
└─────────────────────────────────┘
                │
                │ Client sends USDC
                ▼
┌─────────────────────────────────┐
│      Circle Blockchain          │
│      Monitors Transfer          │
└─────────────────────────────────┘
                │
                │ Webhook
                ▼
┌─────────────────────────────────┐
│   /api/webhooks/circle          │
│   transfers.complete            │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│        Inngest                  │
│   payment.usdc.received         │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────┐
│                INNGEST WORKFLOW                      │
│  Step 1: Verify transfer on chain                   │
│  Step 2: Match to payment by address + amount       │
│  Step 3: Update Convex (payment, claim, wallet)     │
│  Step 4: Notify owner via email                     │
│  Step 5: Send confirmation to client (if email)     │
└─────────────────────────────────────────────────────┘
```

---

### 2.5 Message Delivery Flow (Multi-Channel)

```
┌─────────────────────────────────┐
│     Owner Sends Reminder        │
│   (from Dashboard)              │
│   Channel: Email/SMS/WhatsApp   │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   AI Message Generation         │
│   (Gemini/Groq)                 │
│   - Tone: friendly/firm/urgent  │
│   - Context: escalation level   │
│   - Include payment link        │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Convex: messages.create()     │
│   status: "queued"              │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│        Inngest                  │
│   message.queued                │
└─────────────────────────────────┘
                │
        ┌───────┴───────┬───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│    EMAIL      │ │     SMS       │ │   WHATSAPP    │
│   (Resend)    │ │   (Twilio)    │ │   (Meta)      │
└───────────────┘ └───────────────┘ └───────────────┘
        │               │               │
        │ Webhook       │ Callback      │ Webhook
        ▼               ▼               ▼
┌─────────────────────────────────────────────────────┐
│           /api/webhooks/[provider]                   │
│   - Resend: email.delivered                         │
│   - Twilio: MessageStatus=delivered                 │
│   - WhatsApp: statuses.delivered                    │
└─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│                 INNGEST WORKFLOW                     │
│   message.delivered                                  │
│                                                      │
│   Step 1: Update message status in Convex           │
│   Step 2: Create notification for owner             │
│   Step 3: Send confirmation email to owner          │
│           "Your [channel] to [client] was delivered"│
│   Step 4: Track in PostHog                          │
└─────────────────────────────────────────────────────┘
```

---

### 2.6 Automatic Escalation Flow

```
┌─────────────────────────────────┐
│   Inngest Cron: Daily 9:00 AM   │
│   claim.escalation.check        │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Query Convex: Get all claims  │
│   WHERE status = "active"       │
│   AND dueDate < today           │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│   FOR EACH overdue claim:                                    │
│                                                              │
│   ┌───────────────────────────────────────────────────────┐ │
│   │   AI Escalation Analysis (Gemini)                     │ │
│   │                                                        │ │
│   │   Input:                                               │ │
│   │   - daysSinceDue                                       │ │
│   │   - totalReminders                                     │ │
│   │   - lastReminderDaysAgo                                │ │
│   │   - currentEscalationLevel                             │ │
│   │   - paymentHistory                                     │ │
│   │   - clientResponseHistory                              │ │
│   │                                                        │ │
│   │   Output:                                              │ │
│   │   - shouldEscalate: boolean                            │ │
│   │   - suggestedAction: string                            │ │
│   │   - reasoning: string                                  │ │
│   └───────────────────────────────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│   ┌───────────────────────────────────────────────────────┐ │
│   │   IF shouldEscalate:                                  │ │
│   │                                                        │ │
│   │   1. Update claim.escalationLevel++                    │ │
│   │   2. Generate new message with escalated tone          │ │
│   │   3. Select best channel based on history              │ │
│   │   4. Queue message for delivery                        │ │
│   │   5. Log AI decision in aiActions table                │ │
│   │   6. Notify owner of escalation                        │ │
│   └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Escalation Levels:**
| Level | Tone    | Days Since Due | Action                          |
|-------|---------|----------------|----------------------------------|
| 0     | Friendly| 0-7            | Initial reminder                 |
| 1     | Professional | 7-14      | Follow-up reminder               |
| 2     | Firm    | 14-21          | Mention late fees/consequences   |
| 3     | Urgent  | 21-30          | Final notice before action       |
| 4     | Final   | 30+            | Collection agency mention        |

---

### 2.7 Owner Withdrawal Flow

```
┌─────────────────────────────────┐
│   Owner Requests Withdrawal     │
│   Dashboard → Wallet → Withdraw │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Validate:                     │
│   - Available balance           │
│   - KYC completed               │
│   - Bank account linked         │
│   - No pending holds            │
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Convex: transactions.create() │
│   type: "withdrawal"            │
│   status: "pending"             │
└─────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌───────────────┐ ┌───────────────┐
│    FIAT       │ │    USDC       │
│   Stripe      │ │   Circle      │
│   Payout      │ │   Transfer    │
└───────────────┘ └───────────────┘
        │               │
        │ Webhook       │ Webhook
        ▼               ▼
┌─────────────────────────────────┐
│   /api/webhooks/[provider]      │
│   payout.paid / transfer.complete│
└─────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────┐
│   Update Convex:                │
│   - transactions.status = "completed"│
│   - wallets.debit()             │
│   - Notify owner via email      │
└─────────────────────────────────┘
```

---

## 3. DATABASE SCHEMA RELATIONSHIPS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    DATABASE SCHEMA                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     users       │       │    wallets      │       │  transactions   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id             │◀──┐   │ _id             │       │ _id             │
│ clerkId         │   │   │ userId ─────────┼──────▶│ walletId ───────┼──▶ wallets._id
│ email           │   │   │ type (fiat/usdc)│       │ type            │
│ name            │   │   │ balance         │       │ amount          │
│ role            │   │   │ circleWalletId  │       │ status          │
│ stripeCustomerId│   │   │ stripeAccountId │       │ stripePayoutId  │
│ settings        │   │   └─────────────────┘       │ circleTransferId│
└─────────────────┘   │                             └─────────────────┘
        │             │
        │             │   ┌─────────────────┐       ┌─────────────────┐
        │             │   │    clients      │       │    payments     │
        │             │   ├─────────────────┤       ├─────────────────┤
        │             └───┤ userId ─────────┼──────▶│ _id             │
        │                 │ _id             │◀──────┤ claimId ────────┼──▶ claims._id
        │                 │ name            │       │ clientId ───────┼──▶ clients._id
        │                 │ email           │       │ amount          │
        │                 │ phone           │       │ method          │
        │                 │ whatsapp        │       │ stripePaymentId │
        │                 │ totalOwed       │       │ circleTransferId│
        │                 │ totalPaid       │       │ status          │
        │                 └─────────────────┘       └─────────────────┘
        │                         │
        │                         │
        ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    claims       │       │   messages      │       │   documents     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id             │◀──────┤ claimId ────────┤       │ _id             │
│ userId ─────────┼──────▶│ _id             │       │ claimId ────────┼──▶ claims._id
│ clientId ───────┼──────▶│ channel         │       │ userId ─────────┼──▶ users._id
│ documentId ─────┼──────▶│ content         │       │ fileUrl         │
│ amount          │       │ status          │       │ mimeType        │
│ currency        │       │ deliveredAt     │       │ parsedContent   │
│ status          │       │ resendId        │       │ embedding       │
│ escalationLevel │       │ twilioSid       │       │ extractedData   │
│ dueDate         │       │ whatsappMsgId   │       └─────────────────┘
└─────────────────┘       └─────────────────┘
        │
        │
        ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  notifications  │       │   aiActions     │       │   referrals     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ _id             │       │ _id             │       │ _id             │
│ userId ─────────┼──────▶│ userId ─────────┼──────▶│ referrerId ─────┼──▶ users._id
│ type            │       │ claimId ────────┼──────▶│ referredId ─────┼──▶ users._id
│ title           │       │ actionType      │       │ code            │
│ message         │       │ input           │       │ status          │
│ read            │       │ output          │       │ rewardAmount    │
│ claimId         │       │ model           │       │ rewardPaidAt    │
│ paymentId       │       │ tokensUsed      │       └─────────────────┘
└─────────────────┘       │ reasoning       │
                          └─────────────────┘
```

---

## 4. WEBHOOK ROUTING ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              WEBHOOK ENDPOINTS                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/clerk                │
                    │   Verify: Svix signature                    │
                    ├─────────────────────────────────────────────┤
                    │   Events:                                   │
                    │   - user.created → inngest.send()           │
                    │   - user.updated → convex.users.update()    │
                    │   - user.deleted → convex.users.softDelete()│
                    │   - session.* → audit log                   │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/stripe               │
                    │   Verify: Stripe signature                  │
                    ├─────────────────────────────────────────────┤
                    │   Events:                                   │
                    │   - payment_intent.succeeded                │
                    │   - payment_intent.failed                   │
                    │   - payout.paid                             │
                    │   - radar.early_fraud_warning               │
                    │   All → inngest.send()                      │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/circle               │
                    │   Verify: Circle signature                  │
                    ├─────────────────────────────────────────────┤
                    │   Events:                                   │
                    │   - wallets.created                         │
                    │   - transfers.complete                      │
                    │   - transfers.failed                        │
                    │   All → inngest.send()                      │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/resend               │
                    │   Verify: Resend signature                  │
                    ├─────────────────────────────────────────────┤
                    │   Events:                                   │
                    │   - email.delivered → notify owner          │
                    │   - email.bounced → escalate                │
                    │   - email.complained → pause outreach       │
                    │   - email.opened → track engagement         │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/twilio               │
                    │   Verify: X-Twilio-Signature                │
                    ├─────────────────────────────────────────────┤
                    │   Events (via StatusCallback):              │
                    │   - delivered → notify owner                │
                    │   - failed → escalate                       │
                    │   - undelivered → retry                     │
                    └─────────────────────────────────────────────┘

                    ┌─────────────────────────────────────────────┐
                    │          /api/webhooks/whatsapp             │
                    │   Verify: X-Hub-Signature-256               │
                    ├─────────────────────────────────────────────┤
                    │   Events:                                   │
                    │   - statuses.delivered → notify owner       │
                    │   - statuses.read → track engagement        │
                    │   - messages → inbound reply handling       │
                    └─────────────────────────────────────────────┘
```

---

## 5. SECURITY ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY LAYERS                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                        ┌─────────────────────────────────┐
                        │          EDGE LAYER             │
                        │     Vercel + Cloudflare         │
                        │                                 │
                        │  - DDoS protection              │
                        │  - SSL/TLS termination          │
                        │  - Geographic filtering         │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │       APPLICATION LAYER         │
                        │           Arcjet                │
                        │                                 │
                        │  - Bot detection                │
                        │  - Rate limiting                │
                        │  - Shield WAF                   │
                        │  - Email validation             │
                        │  - PII detection                │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │      AUTHENTICATION LAYER       │
                        │           Clerk                 │
                        │                                 │
                        │  - Session validation           │
                        │  - JWT verification             │
                        │  - MFA enforcement              │
                        │  - RBAC checks                  │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │       API AUTHORIZATION         │
                        │      Next.js Middleware         │
                        │                                 │
                        │  - Route protection             │
                        │  - Role validation              │
                        │  - Resource ownership checks    │
                        └─────────────────────────────────┘
                                      │
                                      ▼
                        ┌─────────────────────────────────┐
                        │         DATA LAYER              │
                        │          Convex                 │
                        │                                 │
                        │  - Row-level security           │
                        │  - Query authorization          │
                        │  - Mutation validation          │
                        │  - Audit logging                │
                        └─────────────────────────────────┘

Rate Limiting Rules:
┌─────────────────────────────────────────────────────────────────────────┐
│  Route                    │  Limit          │  Algorithm               │
├───────────────────────────┼─────────────────┼──────────────────────────┤
│  /api/auth/*              │  10/min         │  Sliding window          │
│  /api/payments/*          │  5/min          │  Fixed window            │
│  /api/claims/*            │  30/min         │  Sliding window          │
│  /api/ai/*                │  20/min         │  Token bucket            │
│  /api/messages/*          │  10/min         │  Sliding window          │
│  /pay/*                   │  10/min         │  Sliding window          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. INNGEST WORKFLOW DEFINITIONS

```typescript
// User Onboarding Workflow
inngest.createFunction(
  { id: "user-onboarding" },
  { event: "clerk/user.created" },
  async ({ event, step }) => {
    // Step 1: Create user in Convex
    const user = await step.run("create-convex-user", async () => {
      return convex.mutation(api.users.create, {
        clerkId: event.data.id,
        email: event.data.email_addresses[0].email_address,
        name: `${event.data.first_name} ${event.data.last_name}`,
      });
    });

    // Step 2: Create Circle wallet
    const wallet = await step.run("create-circle-wallet", async () => {
      return circleClient.createWallet({ userId: user._id });
    });

    // Step 3: Link wallet to user
    await step.run("link-wallet", async () => {
      return convex.mutation(api.wallets.create, {
        userId: user._id,
        type: "usdc",
        circleWalletId: wallet.id,
        circleAddress: wallet.address,
      });
    });

    // Step 4: Send welcome email
    await step.run("send-welcome-email", async () => {
      return resend.emails.send({
        to: user.email,
        subject: "Welcome to Oryn",
        react: WelcomeEmail({ name: user.name }),
      });
    });

    // Step 5: Track analytics
    await step.run("track-signup", async () => {
      return posthog.capture({
        distinctId: user._id,
        event: "user_created",
      });
    });
  }
);

// Claim Escalation Workflow (Daily Cron)
inngest.createFunction(
  { id: "claim-escalation-check" },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ step }) => {
    // Step 1: Get all overdue claims
    const overdueClaims = await step.run("get-overdue-claims", async () => {
      return convex.query(api.claims.getOverdue);
    });

    // Step 2: Process each claim
    for (const claim of overdueClaims) {
      await step.run(`analyze-claim-${claim._id}`, async () => {
        const analysis = await aiClient.analyzeEscalation({
          daysSinceDue: getDaysSinceDue(claim.dueDate),
          totalReminders: claim.reminderCount,
          lastReminderDaysAgo: getLastReminderDaysAgo(claim),
          currentEscalationLevel: claim.escalationLevel,
        });

        if (analysis.shouldEscalate) {
          // Escalate the claim
          await convex.mutation(api.claims.escalate, {
            claimId: claim._id,
            newLevel: claim.escalationLevel + 1,
            reasoning: analysis.reasoning,
          });

          // Queue new message
          await inngest.send({
            name: "message.queued",
            data: {
              claimId: claim._id,
              escalationLevel: claim.escalationLevel + 1,
            },
          });
        }
      });
    }
  }
);

// Payment Processing Workflow
inngest.createFunction(
  { id: "payment-processing" },
  { event: "stripe/payment_intent.succeeded" },
  async ({ event, step }) => {
    const { claimId, clientId } = event.data.metadata;

    // Step 1: Create payment record
    const payment = await step.run("create-payment", async () => {
      return convex.mutation(api.payments.create, {
        claimId,
        clientId,
        amount: event.data.amount / 100,
        method: "stripe",
        stripePaymentId: event.data.id,
        status: "completed",
      });
    });

    // Step 2: Update claim status
    await step.run("update-claim", async () => {
      return convex.mutation(api.claims.markPaid, { claimId });
    });

    // Step 3: Credit owner wallet
    await step.run("credit-wallet", async () => {
      const claim = await convex.query(api.claims.get, { id: claimId });
      return convex.mutation(api.wallets.credit, {
        userId: claim.userId,
        amount: event.data.amount / 100,
        type: "fiat",
        transactionId: payment._id,
      });
    });

    // Step 4: Notify owner
    await step.run("notify-owner", async () => {
      const claim = await convex.query(api.claims.get, { id: claimId });
      const owner = await convex.query(api.users.get, { id: claim.userId });
      const client = await convex.query(api.clients.get, { id: clientId });

      return resend.emails.send({
        to: owner.email,
        subject: `Payment Received: $${(event.data.amount / 100).toFixed(2)} from ${client.name}`,
        react: PaymentReceivedEmail({
          amount: event.data.amount / 100,
          clientName: client.name,
          claimId,
        }),
      });
    });
  }
);

// Message Delivery Workflow
inngest.createFunction(
  { id: "message-delivery" },
  { event: "message.queued" },
  async ({ event, step }) => {
    const { messageId, channel } = event.data;

    // Step 1: Get message details
    const message = await step.run("get-message", async () => {
      return convex.query(api.messages.get, { id: messageId });
    });

    // Step 2: Send via appropriate channel
    let deliveryResult;
    switch (channel) {
      case "email":
        deliveryResult = await step.run("send-email", async () => {
          return resend.emails.send({
            to: message.recipient,
            subject: message.subject,
            html: message.content,
          });
        });
        break;
      case "sms":
        deliveryResult = await step.run("send-sms", async () => {
          return twilioClient.messages.create({
            to: message.recipient,
            from: process.env.TWILIO_PHONE_NUMBER,
            body: message.content,
            statusCallback: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio`,
          });
        });
        break;
      case "whatsapp":
        deliveryResult = await step.run("send-whatsapp", async () => {
          return sendWhatsAppMessage({
            to: message.recipient,
            template: message.templateName,
            params: message.templateParams,
          });
        });
        break;
    }

    // Step 3: Update message with provider ID
    await step.run("update-message", async () => {
      return convex.mutation(api.messages.updateDelivery, {
        messageId,
        providerId: deliveryResult.id || deliveryResult.sid,
        status: "sent",
      });
    });
  }
);
```

---

## 7. ADMIN DASHBOARD - TRANSACTION MAPPING

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN: TRANSACTION GEOGRAPHY                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Data Flow:
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Payment       │──────▶│   IPinfo        │──────▶│   Convex        │
│   Received      │       │   Lookup        │       │  Store Geo      │
│   (IP Address)  │       │   (lat, lng,    │       │  (payments.geo) │
│                 │       │    country)     │       │                 │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │   Admin Query   │
                                                    │   payments.     │
                                                    │   byGeography() │
                                                    └─────────────────┘
                                                            │
                                                            ▼
                                                    ┌─────────────────┐
                                                    │   D3.js         │
                                                    │   World Map     │
                                                    │   Visualization │
                                                    └─────────────────┘

D3.js Visualization Features:
- World map with transaction hotspots (circles sized by amount)
- Choropleth map showing payments by country
- Animated transaction flow lines
- Zoom and pan capabilities
- Tooltips with transaction details
- Time-based filtering (last 7d, 30d, 90d, all time)
- Fraud detection highlights (impossible travel, high-risk countries)
```

---

## 8. SERVICE DEPENDENCIES

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE DEPENDENCY GRAPH                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Critical Path (Must be running):
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Clerk  │────▶│ Convex  │────▶│ Vercel  │
│  (Auth) │     │  (DB)   │     │ (Host)  │
└─────────┘     └─────────┘     └─────────┘

Payment Path:
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Stripe  │────▶│ Inngest │────▶│ Convex  │
│         │     │         │     │         │
└─────────┘     └─────────┘     └─────────┘
     │
     │ (USDC alternative)
     ▼
┌─────────┐
│ Circle  │
└─────────┘

Notification Path:
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Resend  │     │ Twilio  │     │WhatsApp │
│ (Email) │     │  (SMS)  │     │ (WA)    │
└─────────┘     └─────────┘     └─────────┘
     │               │               │
     └───────────────┴───────────────┘
                     │
                     ▼
              ┌─────────────┐
              │   Inngest   │
              │  (Workflow) │
              └─────────────┘

AI Path:
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Gemini  │────▶│ OpenAI  │────▶│ Claude  │────▶│  Groq   │
│ (Main)  │     │(Fallback)│    │(Fallback)│    │(Fallback)│
└─────────┘     └─────────┘     └─────────┘     └─────────┘

Graceful Degradation:
- Clerk down → Users cannot log in (critical)
- Convex down → App non-functional (critical)
- Stripe down → Fiat payments fail → Circle available
- Circle down → USDC payments fail → Stripe available
- Resend down → Email fails → SMS/WhatsApp available
- Gemini down → AI parsing uses OpenAI/Claude/Groq
- PostHog down → Analytics fail → App continues working
- Sentry down → Error tracking fails → App continues working
```

---

## 9. DEPLOYMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              VERCEL DEPLOYMENT                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌───────────────────────────────────────────┐
                    │             Vercel Project                │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │           apps/landing              │  │
                    │  │           oryn.cc                   │  │
                    │  │           (Production)               │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │          apps/dashboard             │  │
                    │  │          app.oryn.cc                │  │
                    │  │          (Production)               │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │            apps/pay                 │  │
                    │  │          pay.oryn.cc                │  │
                    │  │          (Production)               │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    │  ┌─────────────────────────────────────┐  │
                    │  │           apps/admin                │  │
                    │  │         admin.oryn.cc               │  │
                    │  │          (Production)               │  │
                    │  └─────────────────────────────────────┘  │
                    │                                           │
                    └───────────────────────────────────────────┘

Branch Preview Deployments:
- PR branches → preview URLs (e.g., pr-123-oryn.vercel.app)
- Automatic preview for all apps
- Environment variables scoped per environment

Environment Variable Scopes:
- Production: All real API keys
- Preview: Sandbox/test API keys
- Development: Local development keys
```

---

## 10. MONITORING & ALERTING

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MONITORING STACK                                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

Metrics Collection:
┌─────────────────────────────────────────────────────────────────────────┐
│                               PostHog                                    │
│  Events:                                                                 │
│  - claim_created { amount, currency, client_id }                        │
│  - payment_received { amount, method, claim_id }                        │
│  - message_sent { channel, claim_id, escalation_level }                 │
│  - document_uploaded { type, size, parsing_success }                    │
│  - withdrawal_requested { amount, method }                              │
│  - ai_parsing_fallback { primary_model, fallback_model, reason }        │
│                                                                          │
│  User Properties:                                                        │
│  - total_claims, total_collected, wallet_balance                        │
└─────────────────────────────────────────────────────────────────────────┘

Error Tracking:
┌─────────────────────────────────────────────────────────────────────────┐
│                               Sentry                                     │
│  Contexts:                                                               │
│  - User ID, Claim ID, Payment ID                                        │
│  - API provider (Stripe, Circle, Resend, etc.)                          │
│  - Webhook event type                                                    │
│                                                                          │
│  Alert Rules:                                                            │
│  - Error rate > 1% → Slack alert                                        │
│  - Payment failures > 3/hour → PagerDuty                                │
│  - AI parsing failures > 10% → Email alert                              │
└─────────────────────────────────────────────────────────────────────────┘

Uptime Monitoring:
┌─────────────────────────────────────────────────────────────────────────┐
│                       Health Check Endpoints                             │
│                                                                          │
│  /api/health → Basic health check                                       │
│  /api/health/db → Convex connectivity                                   │
│  /api/health/payments → Stripe + Circle status                          │
│  /api/health/ai → Gemini availability                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This architecture document defines:

1. **High-level system topology** with all services
2. **Data flows** for all major user journeys
3. **Database relationships** between all tables
4. **Webhook routing** for all external services
5. **Security layers** from edge to data
6. **Inngest workflow definitions** for background processing
7. **Admin visualization** requirements with D3.js
8. **Service dependencies** and graceful degradation
9. **Deployment strategy** on Vercel
10. **Monitoring and alerting** configuration

Next step: Review and refine the database schema to ensure it supports all these data flows.
