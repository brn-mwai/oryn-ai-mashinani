import type {
  Claim,
  Client,
  Document,
  Message,
  Payment,
  Transaction,
  User,
  PaginationParams,
  Currency,
  ClaimStatus,
  MessageChannel,
  PaymentMethod,
} from "./index";

// ============================================
// Claims API
// ============================================

export interface CreateClaimRequest {
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  currency?: Currency;
  dueDate?: number;
  documentIds?: string[];
}

export interface UpdateClaimRequest {
  title?: string;
  description?: string;
  amount?: number;
  dueDate?: number;
  status?: ClaimStatus;
}

export interface ClaimsListParams extends PaginationParams {
  status?: ClaimStatus | ClaimStatus[];
  clientId?: string;
  minAmount?: number;
  maxAmount?: number;
  dueBefore?: number;
  dueAfter?: number;
}

// ============================================
// Clients API
// ============================================

export interface CreateClientRequest {
  name: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  notes?: string;
}

export interface UpdateClientRequest {
  name?: string;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  notes?: string;
}

export interface ClientsListParams extends PaginationParams {
  status?: string;
  search?: string;
}

// ============================================
// Messages API
// ============================================

export interface SendMessageRequest {
  claimId: string;
  channel: MessageChannel;
  content: string;
  scheduledFor?: number;
}

export interface GenerateMessageRequest {
  claimId: string;
  channel: MessageChannel;
  tone: "friendly" | "professional" | "firm" | "urgent";
  includePaymentLink?: boolean;
}

export interface GenerateMessageResponse {
  content: string;
  suggestedSubject?: string;
  tokensUsed: number;
}

// ============================================
// Payments API
// ============================================

export interface CreatePaymentIntentRequest {
  claimId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  returnUrl: string;
}

export interface CreatePaymentIntentResponse {
  clientSecret?: string;
  paymentUrl?: string;
  paymentId: string;
}

export interface PaymentLinkRequest {
  claimId: string;
  expiresIn?: number; // seconds
  methods?: PaymentMethod[];
}

export interface PaymentLinkResponse {
  url: string;
  expiresAt: number;
}

// ============================================
// Wallet API
// ============================================

export interface WithdrawRequest {
  amount: number;
  method: "bank_transfer" | "usdc";
  destination: BankAccount | WalletAddress;
}

export interface BankAccount {
  type: "bank";
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}

export interface WalletAddress {
  type: "wallet";
  address: string;
  chain: "ethereum" | "polygon" | "solana";
}

export interface TransactionsListParams extends PaginationParams {
  type?: string;
  status?: string;
  startDate?: number;
  endDate?: number;
}

// ============================================
// Documents API
// ============================================

export interface UploadDocumentRequest {
  file: File;
  claimId?: string;
  type?: string;
}

export interface ParseDocumentRequest {
  documentId: string;
  extractFields?: string[];
}

export interface ParseDocumentResponse {
  parsedContent: string;
  extractedData: Record<string, unknown>;
  confidence: number;
  tokensUsed: number;
}

// ============================================
// Search API
// ============================================

export interface SemanticSearchRequest {
  query: string;
  scope?: ("claims" | "clients" | "documents" | "messages")[];
  limit?: number;
}

export interface SemanticSearchResponse {
  results: SearchResult[];
  tokensUsed: number;
}

export interface SearchResult {
  type: "claim" | "client" | "document" | "message";
  id: string;
  title: string;
  snippet: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// ============================================
// Admin API
// ============================================

export interface AdminUsersListParams extends PaginationParams {
  role?: string;
  status?: string;
  search?: string;
}

export interface AdminUpdateUserRequest {
  role?: string;
  status?: "active" | "suspended" | "banned";
}

export interface AdminStatsResponse {
  totalUsers: number;
  totalClaims: number;
  totalCollected: number;
  activeClaimsValue: number;
  newUsersThisMonth: number;
  claimsThisMonth: number;
}

// ============================================
// Webhooks
// ============================================

export interface ClerkWebhookEvent {
  type: "user.created" | "user.updated" | "user.deleted";
  data: {
    id: string;
    email_addresses: { email_address: string }[];
    first_name?: string;
    last_name?: string;
    image_url?: string;
  };
}

export interface StripeWebhookEvent {
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

export interface CircleWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}
