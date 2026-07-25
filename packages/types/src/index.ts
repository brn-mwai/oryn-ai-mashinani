// User types
export interface User {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: UserRole;
  walletId?: string;
  userType?: UserType;
  subscriptionTier?: SubscriptionTier;
  limits?: UserLimits;
  currentUsage?: UsageTracking;
  onboardingState?: OnboardingState;
  organizationId?: string;
  settings: UserSettings;
  referralCode: string;
  referredBy?: string;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = "user" | "admin" | "super_admin";

export type UserType = "freelancer" | "creator" | "consultant" | "agency" | "saas";

export type SubscriptionTier = "starter" | "professional" | "enterprise" | "custom";

export interface UserLimits {
  monthlyClaimsLimit: number;
  monthlyCollectionLimit: number;
  aiActionsLimit: number;
  teamMembersLimit: number;
  channels: string[];
  maxEscalationLevel: number;
  apiAccess: boolean;
  whiteLabel: boolean;
}

export interface UsageTracking {
  claimsCreated: number;
  amountCollected: number;
  aiActionsUsed: number;
  resetDate: number;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  completedAt?: number;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  whatsappNotifications: boolean;
  timezone: string;
  currency: Currency;
}

export type Currency = "KES" | "USD" | "EUR" | "GBP" | "CAD" | "AUD";

// Client (Debtor) types
export interface Client {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  notes?: string;
  totalOwed: number;
  totalPaid: number;
  status: ClientStatus;
  createdAt: number;
  updatedAt: number;
}

export type ClientStatus = "active" | "owing" | "paid" | "archived";

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country: string;
}

// Claim types
export interface Claim {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  currency: Currency;
  dueDate?: number;
  status: ClaimStatus;
  escalationLevel: EscalationLevel;
  documents: string[];
  messages: string[];
  payments: string[];
  createdAt: number;
  updatedAt: number;
}

export type ClaimStatus = "draft" | "active" | "paused" | "collected" | "written_off";

export type EscalationLevel = 0 | 1 | 2 | 3 | 4;

// Payment types
export interface Payment {
  id: string;
  claimId: string;
  userId: string;
  clientId: string;
  amount: number;
  currency: Currency;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  circlePaymentId?: string;
  transactionHash?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  completedAt?: number;
}

export type PaymentMethod = "card" | "bank_transfer" | "usdc" | "arc_usdc" | "apple_pay" | "google_pay" | "other";

// Blockchain chains supported
export type BlockchainChain = "ethereum" | "polygon" | "solana" | "avalanche" | "arc";

// Arc-specific types
export interface ArcWalletInfo {
  walletId: string;
  address: string;
  chainId: number;
  balanceUsdc: number;
  balanceEurc?: number;
}

export interface ArcTransactionInfo {
  transactionId: string;
  hash: string;
  status: "pending" | "confirmed" | "finalized" | "failed";
  from: string;
  to: string;
  amount: number;
  token: "USDC" | "EURC";
  feeUsdc: number;
  blockNumber?: number;
  timestamp: number;
  finalized: boolean;
}

export type PaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded";

// Wallet types
export interface Wallet {
  id: string;
  userId: string;
  circleWalletId?: string;
  balance: number;
  pendingBalance: number;
  currency: Currency;
  createdAt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  walletId: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  status: TransactionStatus;
  reference?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export type TransactionType = "deposit" | "withdrawal" | "payment_received" | "fee" | "refund";

export type TransactionStatus = "pending" | "completed" | "failed";

// Document types
export interface Document {
  id: string;
  userId: string;
  claimId?: string;
  name: string;
  type: DocumentType;
  url: string;
  size: number;
  mimeType: string;
  parsedContent?: string;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export type DocumentType = "contract" | "invoice" | "receipt" | "proof" | "other";

// Message types
export interface Message {
  id: string;
  claimId: string;
  userId: string;
  clientId: string;
  channel: MessageChannel;
  direction: "inbound" | "outbound";
  content: string;
  status: MessageStatus;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export type MessageChannel = "email" | "sms" | "whatsapp";

export type MessageStatus = "draft" | "queued" | "sent" | "delivered" | "failed" | "read";

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export type NotificationType =
  | "payment_received"
  | "claim_status_change"
  | "message_received"
  | "escalation"
  | "system"
  | "referral";

// Referral types
export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  status: ReferralStatus;
  rewardAmount: number;
  rewardClaimed: boolean;
  createdAt: number;
  completedAt?: number;
}

export type ReferralStatus = "pending" | "completed" | "expired";

// AI Action types
export interface AIAction {
  id: string;
  userId: string;
  claimId?: string;
  type: AIActionType;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  model: AIModel;
  tokensUsed: number;
  durationMs: number;
  status: "success" | "error";
  error?: string;
  createdAt: number;
}

export type AIActionType =
  | "document_parse"
  | "message_generate"
  | "escalation_decision"
  | "semantic_search"
  | "tone_analysis"
  | "nlp_classification"
  | "entity_resolution";

export type AIModel = "gemini-2.0-flash" | "gemini-1.5-pro" | "llama-3.3-70b" | "gpt-4o" | "gpt-4o-mini";

// Organization types (for Agency/SaaS team support)
export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  brandColor?: string;
  customDomain?: string;
  settings?: OrganizationSettings;
  createdAt: number;
  updatedAt: number;
}

export interface OrganizationSettings {
  whiteLabel: boolean;
  defaultEscalationSchedule?: number[];
  automationRules?: Record<string, unknown>;
}

// Team member types
export interface TeamMember {
  id: string;
  organizationId: string;
  userId: string;
  role: TeamRole;
  permissions?: TeamPermissions;
  invitedBy?: string;
  invitedAt: number;
  joinedAt?: number;
  status: TeamMemberStatus;
}

export type TeamRole = "owner" | "admin" | "member";

export type TeamMemberStatus = "pending" | "active" | "suspended";

export interface TeamPermissions {
  canManageClaims: boolean;
  canManageClients: boolean;
  canSendMessages: boolean;
  canViewReports: boolean;
  canManageTeam: boolean;
  canAccessApi: boolean;
}

// NLP Command types
export interface NLPCommand {
  id: string;
  userId: string;
  rawInput: string;
  intent: NLPIntent;
  confidence: number;
  entities: NLPEntities;
  actions: NLPAction[];
  status: NLPCommandStatus;
  requiresConfirmation: boolean;
  confirmationMessage?: string;
  confirmedAt?: number;
  response?: string;
  model: string;
  tokensUsed: number;
  durationMs: number;
  createdAt: number;
  completedAt?: number;
}

// NLP Intent types - all supported command intents
export type NLPIntent =
  | "SEND_REMINDER"
  | "CREATE_CLAIM"
  | "CHECK_STATUS"
  | "ESCALATE_CLAIM"
  | "UPDATE_CLAIM"
  | "PAUSE_CLAIM"
  | "ADD_CLIENT"
  | "REQUEST_PAYMENT"
  | "WITHDRAW_FUNDS"
  | "GET_STATS"
  // Wallet intents
  | "CHECK_WALLET"
  | "SEND_USDC"
  | "FORWARD_PAYMENT"
  | "HOLD_PAYMENT"
  | "GET_WALLET_ADDRESS"
  | "CREATE_WALLET"
  | "UNKNOWN";

export interface NLPEntities {
  clientId?: string;
  claimId?: string;
  clientName?: string;
  amount?: number;
  channel?: string;
  dueDate?: number;
  // Wallet entities
  walletId?: string;
  walletAddress?: string;
  destinationAddress?: string;
  walletChain?: "arc" | "ethereum" | "polygon" | "solana" | "avalanche";
  paymentId?: string;
  transactionHash?: string;
}

export interface NLPAction {
  type: NLPActionType;
  status: NLPActionStatus;
  params?: Record<string, unknown>;
  result?: Record<string, unknown>;
  error?: string;
  executedAt?: number;
}

export type NLPActionType =
  | "GENERATE_MESSAGE"
  | "SEND_MESSAGE"
  | "CREATE_CLAIM"
  | "UPDATE_CLAIM"
  | "ESCALATE_CLAIM"
  | "PAUSE_CLAIM"
  | "CREATE_CLIENT"
  | "RESOLVE_CLIENT"
  | "RESOLVE_CLAIM"
  | "CREATE_PAYMENT_LINK"
  | "INITIATE_WITHDRAWAL"
  | "LOG_AI_ACTION"
  | "FETCH_STATS"
  // Wallet action types
  | "RESOLVE_WALLET"
  | "CHECK_WALLET_BALANCE"
  | "SEND_USDC_TRANSACTION"
  | "FORWARD_PAYMENT"
  | "HOLD_PAYMENT"
  | "GET_WALLET_ADDRESS"
  | "CREATE_ARC_WALLET";

export type NLPActionStatus = "pending" | "executing" | "completed" | "failed";

export type NLPCommandStatus = "processing" | "awaiting_confirmation" | "executed" | "failed";

// User Stats types
export interface UserStats {
  id: string;
  userId: string;
  period: StatsPeriod;
  periodStart: number;
  totalClaims: number;
  activeClaims: number;
  totalOwed: number;
  totalCollected: number;
  collectionRate: number;
  messagesByChannel: MessagesByChannel;
  aiActionsUsed: number;
  lastUpdated: number;
}

export type StatsPeriod = "daily" | "weekly" | "monthly" | "all_time";

export interface MessagesByChannel {
  email: number;
  sms: number;
  whatsapp: number;
}

// High-risk actions that require confirmation
export const HIGH_RISK_ACTIONS: NLPActionType[] = [
  "ESCALATE_CLAIM", // Level 4 escalation
  "INITIATE_WITHDRAWAL", // > $1000
  "SEND_USDC_TRANSACTION", // Sending crypto
  "FORWARD_PAYMENT", // Forwarding payments
];

export const HIGH_RISK_INTENTS: NLPIntent[] = [
  "ESCALATE_CLAIM",
  "WITHDRAW_FUNDS",
];

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
