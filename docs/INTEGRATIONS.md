# Oryn Platform - Complete Integration Guide

## Overview

This document details **every integration provider** needed for the Oryn platform, what they do, what's required from each, and how they work together.

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Clerk
**Purpose:** Authentication, user management, multi-tenant support

**Documentation:** [clerk.com/docs](https://clerk.com/docs)

**What We Get:**
- User sign-up/sign-in (email, social, passkeys)
- Multi-factor authentication (MFA)
- Organizations for B2B multi-tenancy
- Role-based access control (RBAC)
- Session management across subdomains
- Webhooks for user sync to database
- Machine-to-machine (M2M) tokens for service auth

**API Keys Required:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx
```

**Webhook Events to Handle:**
- `user.created` → Create user in Convex, create Circle wallet
- `user.updated` → Sync profile changes
- `user.deleted` → Soft delete user data
- `session.created` → Audit log
- `organization.created` → Multi-tenant setup

**Capabilities:**
| Feature | Status |
|---------|--------|
| Email/password auth | ✅ |
| Social OAuth (Google, GitHub, etc.) | ✅ |
| Passkeys/WebAuthn | ✅ |
| MFA (TOTP, SMS) | ✅ |
| Organizations/Teams | ✅ |
| Custom roles & permissions | ✅ |
| Webhooks | ✅ |
| JWT templates for Convex | ✅ |

---

## 2. DATABASE & REAL-TIME

### 2.1 Convex
**Purpose:** Real-time database, serverless functions, file storage

**Documentation:** [docs.convex.dev](https://docs.convex.dev)

**What We Get:**
- Document-relational database with ACID transactions
- Real-time subscriptions via WebSockets
- Serverless query/mutation/action functions
- Built-in file storage
- Vector search for semantic search
- Scheduled jobs (cron)

**API Keys Required:**
```env
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx
```

**Capabilities:**
| Feature | Status |
|---------|--------|
| Real-time subscriptions | ✅ |
| ACID transactions | ✅ |
| Serverless functions | ✅ |
| File storage | ✅ |
| Vector search (1536 dims) | ✅ |
| Scheduled jobs | ✅ |
| Search indexes | ✅ |

---

## 3. PAYMENTS - FIAT

### 3.1 Stripe
**Purpose:** Card payments, bank transfers (ACH), payouts, fraud detection

**Documentation:** [docs.stripe.com](https://docs.stripe.com)

**What We Get:**
- Payment Intents for one-time payments
- Payment Links for no-code checkout
- Connect for marketplace payouts
- ACH Direct Debit for bank transfers
- Radar for AI fraud detection
- Webhooks for payment status
- Instant Payouts to connected accounts

**API Keys Required:**
```env
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Webhook Events to Handle:**
- `payment_intent.succeeded` → Credit wallet, mark claim collected
- `payment_intent.failed` → Notify user, retry logic
- `charge.refunded` → Process refund
- `payout.paid` → Confirm withdrawal
- `radar.early_fraud_warning` → Flag suspicious activity

**Capabilities:**
| Feature | Status |
|---------|--------|
| Card payments | ✅ |
| ACH bank transfers | ✅ |
| Apple Pay / Google Pay | ✅ |
| Payment Links | ✅ |
| Connect (marketplace payouts) | ✅ |
| Instant Payouts | ✅ |
| Radar fraud detection | ✅ |
| 3D Secure | ✅ |
| Disputes management | ✅ |

### 3.2 Stripe Radar (Fraud Detection)
**Purpose:** AI-powered fraud prevention

**What We Get:**
- Risk scores for every transaction
- Machine learning fraud detection
- Custom rules engine
- Radar Assistant (AI rule builder)
- Block lists and allow lists
- Advanced device fingerprinting

**No Additional Keys** - included with Stripe

---

## 4. PAYMENTS - CRYPTO/STABLECOIN

### 4.1 Circle (USDC)
**Purpose:** USDC payments, programmable wallets, instant settlement

**Documentation:** [developers.circle.com](https://developers.circle.com)

**What We Get:**
- Programmable Wallets (wallet-as-a-service)
- USDC and EURC support
- Multi-chain support (Ethereum, Polygon, Solana, Avalanche)
- Gasless transactions (Paymaster)
- Cross-chain transfers (CCTP)
- Auto-forward policies

**API Keys Required:**
```env
CIRCLE_API_KEY=xxx
CIRCLE_ENTITY_SECRET=xxx
```

**Webhook Events to Handle:**
- `wallets.created` → Link to user account
- `transfers.complete` → Credit wallet balance
- `transfers.failed` → Notify and retry

**Capabilities:**
| Feature | Status |
|---------|--------|
| USDC payments | ✅ |
| EURC payments | ✅ |
| Programmable wallets | ✅ |
| Gasless transactions | ✅ |
| Multi-chain (ETH, Polygon, Solana) | ✅ |
| Cross-chain transfers | ✅ |
| Auto-forward policies | ✅ |

### 4.2 Circle Arc (Coming 2026)
**Purpose:** L1 blockchain for stablecoin finance

**Documentation:** [arc.network](https://www.arc.network/)

**What We Get:**
- Sub-second finality
- Predictable fees
- Native Circle integration (CPN, USDC, EURC)
- Agentic AI payment support
- Real-time global settlement

**Partners:** Visa, Mastercard, Brex, Nuvei, AWS

**Status:** Public testnet (Fall 2025), Mainnet beta (2026)

---

## 5. NOTIFICATIONS - EMAIL

### 5.1 Resend
**Purpose:** Transactional email delivery

**Documentation:** [resend.com/docs](https://resend.com/docs)

**What We Get:**
- RESTful API and SDKs
- React Email integration
- Email templates
- Open/click tracking
- Webhooks for delivery status
- Inbound email parsing (2026)

**API Keys Required:**
```env
RESEND_API_KEY=re_xxx
```

**Webhook Events to Handle:**
- `email.sent` → Log sent
- `email.delivered` → Confirm delivery → **Notify owner**
- `email.bounced` → Mark invalid, escalate
- `email.complained` → Mark spam, pause outreach
- `email.opened` → Track engagement
- `email.clicked` → Track link clicks

**Email Types to Send:**
| Email Type | Trigger |
|------------|---------|
| Welcome email | User signs up |
| Payment reminder | Claim created/escalated |
| Payment received confirmation | Payment completed |
| **Owner delivery confirmation** | Client receives message |
| Withdrawal confirmation | Payout processed |
| Security alert | Suspicious activity |

---

## 6. NOTIFICATIONS - SMS

### 6.1 Twilio
**Purpose:** SMS delivery, delivery status tracking

**Documentation:** [twilio.com/docs](https://www.twilio.com/docs)

**What We Get:**
- SMS sending worldwide
- MMS support
- Delivery status callbacks
- Two-way messaging
- Short codes and toll-free numbers
- Message scheduling

**API Keys Required:**
```env
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

**Status Callback Events:**
- `queued` → Message accepted
- `sent` → Dispatched to carrier
- `delivered` → Confirmed delivery → **Notify owner**
- `failed` → Permanent failure, escalate
- `undelivered` → Temporary failure, retry

**Security:** Validate `X-Twilio-Signature` header

---

## 7. NOTIFICATIONS - WHATSAPP

### 7.1 WhatsApp Business API (Cloud)
**Purpose:** WhatsApp messaging, high engagement channel

**Documentation:** [business.whatsapp.com/developers](https://business.whatsapp.com/developers/developer-hub)

**What We Get:**
- Template messages (pre-approved)
- Session messages (24-hour window)
- Media messages (images, documents)
- Interactive messages (buttons, lists)
- Delivery/read receipts
- Webhook notifications

**API Keys Required:**
```env
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx
```

**Webhook Events to Handle:**
- `messages` → Inbound message from client
- `statuses.sent` → Message sent
- `statuses.delivered` → Delivered → **Notify owner**
- `statuses.read` → Read receipt → **Notify owner**
- `statuses.failed` → Delivery failed

**Message Templates Needed:**
1. Payment reminder (friendly)
2. Payment reminder (firm)
3. Payment link delivery
4. Payment confirmation
5. Thank you message

---

## 8. AI SERVICES - PRIMARY

### 8.1 Google Gemini
**Purpose:** Document parsing, message generation, semantic search

**Documentation:** [ai.google.dev/gemini-api/docs](https://ai.google.dev/gemini-api/docs)

**What We Get:**
- Multimodal understanding (text, images, PDFs, video)
- Document parsing up to 1000 pages
- Native PDF processing with OCR
- Text embeddings (1536 dimensions)
- JSON structured output
- Low latency inference

**API Keys Required:**
```env
GOOGLE_GENERATIVE_AI_API_KEY=xxx
```

**Models to Use:**
| Use Case | Model | Why |
|----------|-------|-----|
| Document parsing | `gemini-2.0-flash` | Fast, multimodal |
| Complex documents | `gemini-1.5-pro` | Higher accuracy |
| Embeddings | `text-embedding-004` | 1536 dims |
| Message generation | `gemini-2.0-flash` | Fast, cheap |

**Capabilities:**
| Feature | Status |
|---------|--------|
| PDF parsing (native) | ✅ |
| Image understanding | ✅ |
| Video understanding | ✅ |
| Structured JSON output | ✅ |
| Text embeddings | ✅ |
| Function calling | ✅ |

---

## 9. AI SERVICES - FALLBACKS

### 9.1 Groq
**Purpose:** Fast LLM inference fallback

**Documentation:** [console.groq.com/docs](https://console.groq.com/docs)

**What We Get:**
- Fastest inference (LPU hardware)
- Llama 4, Llama 3.3 70B models
- OpenAI-compatible API
- Low cost

**API Keys Required:**
```env
GROQ_API_KEY=gsk_xxx
```

**When to Use:**
- Gemini rate limited
- Gemini API errors
- Cost optimization for simple tasks

### 9.2 OpenAI (GPT-4o)
**Purpose:** Document parsing fallback, complex reasoning

**Documentation:** [platform.openai.com/docs](https://platform.openai.com/docs)

**What We Get:**
- GPT-4o with vision
- Native PDF support (100 pages, 32MB)
- Structured JSON output
- High accuracy parsing

**API Keys Required:**
```env
OPENAI_API_KEY=sk-xxx
```

**When to Use:**
- Gemini fails on complex documents
- Need higher parsing accuracy
- Specific document types

### 9.3 Anthropic Claude
**Purpose:** Document parsing fallback, long context

**Documentation:** [docs.anthropic.com](https://docs.anthropic.com)

**What We Get:**
- 1M token context window
- Vision capabilities
- 500MB file support
- Strong OCR reasoning

**API Keys Required:**
```env
ANTHROPIC_API_KEY=xxx
```

**When to Use:**
- Very long documents (100+ pages)
- Low quality scans
- Complex layouts

---

## 10. AI PARSING FALLBACK CHAIN

```
┌─────────────────────────────────────────────────────┐
│               DOCUMENT UPLOAD                        │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│  1. GEMINI 2.0 FLASH (Primary)                      │
│     - PDF: Native processing                         │
│     - Images: Direct vision                          │
│     - Video: Frame extraction                        │
└─────────────────────┬───────────────────────────────┘
                      │ Fails?
                      ▼
┌─────────────────────────────────────────────────────┐
│  2. OPENAI GPT-4O (First Fallback)                  │
│     - Native PDF support                             │
│     - Strong structured output                       │
└─────────────────────┬───────────────────────────────┘
                      │ Fails?
                      ▼
┌─────────────────────────────────────────────────────┐
│  3. CLAUDE SONNET (Second Fallback)                 │
│     - Long context (1M tokens)                       │
│     - Complex layout understanding                   │
└─────────────────────┬───────────────────────────────┘
                      │ Fails?
                      ▼
┌─────────────────────────────────────────────────────┐
│  4. OCR + LLM (Final Fallback)                      │
│     - Tesseract/Google Vision OCR                   │
│     - Text → Groq Llama for structuring             │
└─────────────────────────────────────────────────────┘
```

---

## 11. FILE STORAGE

### 11.1 UploadThing
**Purpose:** File uploads, CDN delivery

**Documentation:** [docs.uploadthing.com](https://docs.uploadthing.com)

**What We Get:**
- Type-safe file uploads
- Presigned URLs
- CDN-backed delivery
- Resumable uploads for large files
- File validation and access controls

**API Keys Required:**
```env
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx
```

**File Types to Support:**
| Type | Extensions | Max Size |
|------|------------|----------|
| Documents | PDF, DOC, DOCX | 50MB |
| Images | JPG, PNG, WEBP | 10MB |
| Contracts | PDF | 50MB |
| Receipts | JPG, PNG, PDF | 10MB |

---

## 12. SECURITY

### 12.1 Arcjet
**Purpose:** Bot protection, rate limiting, WAF

**Documentation:** [docs.arcjet.com](https://docs.arcjet.com)

**What We Get:**
- Bot detection and blocking
- Rate limiting (sliding window, token bucket)
- Shield WAF (attack protection)
- Email validation
- PII detection and redaction
- Local decision making (<1ms latency)

**API Keys Required:**
```env
ARCJET_KEY=ajkey_xxx
```

**Protection Rules:**
| Route | Protection |
|-------|------------|
| `/api/auth/*` | Rate limit: 10/min, Bot protection |
| `/api/payments/*` | Rate limit: 5/min, Shield WAF |
| `/api/claims/*` | Rate limit: 30/min |
| `/api/ai/*` | Rate limit: 20/min |
| `/pay/*` | Bot protection, Rate limit: 10/min |

### 12.2 Vercel KV + Upstash Ratelimit
**Purpose:** Distributed rate limiting

**Documentation:** [upstash.com/docs/redis/sdks/ratelimit-ts](https://upstash.com/docs/redis/sdks/ratelimit-ts/overview)

**What We Get:**
- Redis-based rate limiting
- Sliding window algorithm
- Multi-region support
- Per-user and per-IP limits

**API Keys Required:**
```env
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx
```

---

## 13. BACKGROUND JOBS & WORKFLOWS

### 13.1 Inngest
**Purpose:** Durable workflows, background jobs, scheduling

**Documentation:** [inngest.com/docs](https://www.inngest.com/docs)

**What We Get:**
- Event-driven functions
- Durable execution (retries, recovery)
- Step functions with state
- Cron scheduling
- Concurrency control
- Rate limiting built-in

**API Keys Required:**
```env
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx
```

**Workflows to Build:**
| Workflow | Trigger | Steps |
|----------|---------|-------|
| User onboarding | `user.created` | Create Convex user → Create Circle wallet → Send welcome email |
| Claim escalation | `cron: daily` | Check overdue claims → Decide escalation → Send messages |
| Payment processing | `payment.received` | Verify → Credit wallet → Update claim → Notify owner |
| Message delivery | `message.queued` | Select channel → Send → Track status → Notify owner |

### 13.2 Upstash QStash
**Purpose:** Serverless message queue, HTTP-based jobs

**Documentation:** [upstash.com/docs/qstash](https://upstash.com/docs/qstash)

**What We Get:**
- HTTP-based message delivery
- At-least-once delivery guarantee
- Scheduled messages
- Retry with backoff
- FIFO queues

**API Keys Required:**
```env
QSTASH_URL=xxx
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx
```

---

## 14. ANALYTICS & MONITORING

### 14.1 PostHog
**Purpose:** Product analytics, feature flags, session replay

**Documentation:** [posthog.com/docs](https://posthog.com/docs)

**What We Get:**
- Event tracking
- User identification
- Funnels and retention
- Feature flags
- A/B testing
- Session replay
- Heatmaps

**API Keys Required:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Events to Track:**
| Event | Properties |
|-------|------------|
| `claim_created` | amount, currency, client_id |
| `payment_received` | amount, method, claim_id |
| `message_sent` | channel, claim_id |
| `document_uploaded` | type, size |
| `withdrawal_requested` | amount, method |

### 14.2 Sentry
**Purpose:** Error monitoring, performance tracking

**Documentation:** [docs.sentry.io/platforms/javascript/guides/nextjs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

**What We Get:**
- Error tracking (client, server, edge)
- Performance monitoring
- Session replay on errors
- Source maps support
- Release tracking
- Alerting

**API Keys Required:**
```env
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx
```

---

## 15. GEOLOCATION & MAPPING (Admin Dashboard)

### 15.1 IPinfo
**Purpose:** IP geolocation for transaction mapping

**Documentation:** [ipinfo.io/developers](https://ipinfo.io/developers)

**What We Get:**
- IP to location (country, region, city)
- Coordinates (lat/long)
- ISP and connection type
- Fraud detection signals
- Impossible travel detection

**API Keys Required:**
```env
IPINFO_TOKEN=xxx
```

**Use Cases:**
- Map transaction origins on D3.js globe
- Detect suspicious login locations
- Flag impossible travel (fraud)

### 15.2 D3.js
**Purpose:** Transaction geography visualization

**Documentation:** [d3js.org](https://d3js.org/)

**What We Build:**
- World map with transaction hotspots
- Real-time transaction flow visualization
- Choropleth map by country/region
- Interactive tooltips with details

**No API Keys** - client-side library

---

## 16. COMPLETE ENVIRONMENT VARIABLES

```env
# ===========================================
# URLs
# ===========================================
NEXT_PUBLIC_LANDING_URL=https://oryn.cc
NEXT_PUBLIC_APP_URL=https://app.oryn.cc
NEXT_PUBLIC_PAY_URL=https://pay.oryn.cc
NEXT_PUBLIC_ADMIN_URL=https://admin.oryn.cc

# ===========================================
# Authentication (Clerk)
# ===========================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_xxx
CLERK_SECRET_KEY=sk_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# ===========================================
# Database (Convex)
# ===========================================
NEXT_PUBLIC_CONVEX_URL=https://xxx.convex.cloud
CONVEX_DEPLOY_KEY=xxx

# ===========================================
# Payments - Stripe
# ===========================================
STRIPE_SECRET_KEY=sk_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# ===========================================
# Payments - Circle
# ===========================================
CIRCLE_API_KEY=xxx
CIRCLE_ENTITY_SECRET=xxx

# ===========================================
# AI - Primary (Gemini)
# ===========================================
GOOGLE_GENERATIVE_AI_API_KEY=xxx

# ===========================================
# AI - Fallbacks
# ===========================================
GROQ_API_KEY=gsk_xxx
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=xxx

# ===========================================
# Notifications - Email (Resend)
# ===========================================
RESEND_API_KEY=re_xxx

# ===========================================
# Notifications - SMS (Twilio)
# ===========================================
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# ===========================================
# Notifications - WhatsApp
# ===========================================
WHATSAPP_ACCESS_TOKEN=xxx
WHATSAPP_PHONE_NUMBER_ID=xxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=xxx

# ===========================================
# File Storage (UploadThing)
# ===========================================
UPLOADTHING_SECRET=sk_live_xxx
UPLOADTHING_APP_ID=xxx

# ===========================================
# Security (Arcjet)
# ===========================================
ARCJET_KEY=ajkey_xxx

# ===========================================
# Rate Limiting (Vercel KV / Upstash)
# ===========================================
KV_REST_API_URL=xxx
KV_REST_API_TOKEN=xxx

# ===========================================
# Background Jobs (Inngest)
# ===========================================
INNGEST_EVENT_KEY=xxx
INNGEST_SIGNING_KEY=xxx

# ===========================================
# Background Jobs (QStash)
# ===========================================
QSTASH_URL=xxx
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=xxx
QSTASH_NEXT_SIGNING_KEY=xxx

# ===========================================
# Analytics (PostHog)
# ===========================================
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# ===========================================
# Error Monitoring (Sentry)
# ===========================================
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
SENTRY_ORG=xxx
SENTRY_PROJECT=xxx

# ===========================================
# Geolocation (IPinfo)
# ===========================================
IPINFO_TOKEN=xxx
```

---

## 17. OWNER NOTIFICATION FLOW

When a client receives any communication, the owner (user) should be notified:

```
┌──────────────────────────────────────────────────────────┐
│                  MESSAGE SENT TO CLIENT                   │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              CHANNEL DELIVERS MESSAGE                     │
│  - Resend (email) → webhook: email.delivered             │
│  - Twilio (SMS) → callback: delivered                    │
│  - WhatsApp → webhook: statuses.delivered                │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│              PROCESS DELIVERY WEBHOOK                     │
│  1. Update message status in Convex                      │
│  2. Create notification for owner                        │
│  3. Send confirmation email to owner via Resend          │
│  4. Update real-time dashboard                           │
└──────────────────────────────────────────────────────────┘
```

**Owner Confirmation Email Content:**
```
Subject: Message Delivered to [Client Name]

Your [email/SMS/WhatsApp] to [Client Name] was delivered.

Claim: [Claim Title]
Amount: $[Amount]
Channel: [Email/SMS/WhatsApp]
Delivered at: [Timestamp]

[View Claim Details →]
```

---

## 18. INTEGRATION PRIORITY ORDER

### Phase 1: Foundation (Must Have)
1. **Clerk** - Authentication
2. **Convex** - Database
3. **Stripe** - Fiat payments
4. **Resend** - Email

### Phase 2: Core Features
5. **Circle** - USDC payments
6. **Google Gemini** - AI parsing
7. **UploadThing** - File storage
8. **Twilio** - SMS

### Phase 3: Enhanced Features
9. **WhatsApp Business API**
10. **Arcjet** - Security
11. **Inngest** - Background jobs
12. **PostHog** - Analytics

### Phase 4: Advanced
13. **Groq/OpenAI/Claude** - AI fallbacks
14. **Sentry** - Error monitoring
15. **IPinfo + D3.js** - Transaction mapping
16. **Circle Arc** - When mainnet launches

---

## Sources

- [Clerk Documentation](https://clerk.com/docs)
- [Convex Developer Hub](https://docs.convex.dev)
- [Stripe Documentation](https://docs.stripe.com)
- [Circle Developer Docs](https://developers.circle.com)
- [Circle Arc Network](https://www.arc.network/)
- [Resend Documentation](https://resend.com/docs)
- [Twilio Messaging Webhooks](https://www.twilio.com/docs/usage/webhooks/messaging-webhooks)
- [WhatsApp Developer Hub](https://business.whatsapp.com/developers/developer-hub)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Groq Documentation](https://console.groq.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Anthropic Claude Documentation](https://docs.anthropic.com)
- [UploadThing Documentation](https://docs.uploadthing.com)
- [Arcjet Documentation](https://docs.arcjet.com)
- [Inngest Documentation](https://www.inngest.com/docs)
- [Upstash QStash](https://upstash.com/docs/qstash)
- [PostHog Documentation](https://posthog.com/docs)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [IPinfo API](https://ipinfo.io/developers)
- [D3.js](https://d3js.org/)
