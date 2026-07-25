// Database-specific types for Convex
// These map to the Convex schema

import type {
  User,
  Client,
  Claim,
  Payment,
  Wallet,
  Transaction,
  Document,
  Message,
  Notification,
  Referral,
  AIAction,
  Organization,
  TeamMember,
  NLPCommand,
  UserStats,
} from "./index";

// Convex document types with _id and _creationTime
export interface ConvexDoc<T> extends Omit<T, "id" | "createdAt"> {
  _id: string;
  _creationTime: number;
}

export type UserDoc = ConvexDoc<User>;
export type ClientDoc = ConvexDoc<Client>;
export type ClaimDoc = ConvexDoc<Claim>;
export type PaymentDoc = ConvexDoc<Payment>;
export type WalletDoc = ConvexDoc<Wallet>;
export type TransactionDoc = ConvexDoc<Transaction>;
export type DocumentDoc = ConvexDoc<Document>;
export type MessageDoc = ConvexDoc<Message>;
export type NotificationDoc = ConvexDoc<Notification>;
export type ReferralDoc = ConvexDoc<Referral>;
export type AIActionDoc = ConvexDoc<AIAction>;
export type OrganizationDoc = ConvexDoc<Organization>;
export type TeamMemberDoc = ConvexDoc<TeamMember>;
export type NLPCommandDoc = ConvexDoc<NLPCommand>;
export type UserStatsDoc = ConvexDoc<UserStats>;

// Query result types
export interface DashboardStats {
  totalClaims: number;
  activeClaims: number;
  collectedClaims: number;
  totalOwed: number;
  totalCollected: number;
  collectionRate: number;
  claimsByStatus: Record<string, number>;
  recentPayments: PaymentDoc[];
  upcomingDueDates: ClaimDoc[];
}

export interface WalletOverview {
  wallet: WalletDoc;
  recentTransactions: TransactionDoc[];
  pendingWithdrawals: number;
  totalEarnings: number;
  totalWithdrawn: number;
}

export interface ClaimTimeline {
  claim: ClaimDoc;
  client: ClientDoc;
  messages: MessageDoc[];
  payments: PaymentDoc[];
  documents: DocumentDoc[];
  aiActions: AIActionDoc[];
}

// Aggregation types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface CollectionsByMonth {
  month: string;
  collected: number;
  outstanding: number;
}

export interface ClaimsByChannel {
  channel: string;
  count: number;
  successRate: number;
}

// Filter types for queries
export interface DateRange {
  start: number;
  end: number;
}

export interface AmountRange {
  min?: number;
  max?: number;
}
