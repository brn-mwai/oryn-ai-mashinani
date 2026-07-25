/**
 * Circle Arc - L1 Blockchain for Stablecoin Finance
 *
 * Status: Public Testnet (October 2025), Mainnet Beta (2026)
 * Features:
 * - Sub-second deterministic finality (Malachite consensus)
 * - USDC as native gas (predictable dollar-denominated fees)
 * - Built-in FX engine for 24/7 stablecoin swaps
 * - Opt-in privacy with selectively shielded transactions
 * - Full EVM compatibility
 * - Native Circle platform integration (USDC, EURC, CCTP, Gateway)
 *
 * Partners: Visa, Mastercard, Brex, Nuvei, AWS, BlackRock, Anthropic
 *
 * Documentation: https://docs.arc.network
 * Explorer: https://testnet.arcscan.app
 * Faucet: https://faucet.circle.com
 */

import crypto from "crypto";

const arcApiKey = process.env.CIRCLE_ARC_API_KEY;
const arcNetwork = process.env.CIRCLE_ARC_NETWORK ?? "testnet";

// Arc Network Configuration
export const ARC_NETWORKS = {
  testnet: {
    chainId: 5042002,
    rpcUrl: "https://rpc.testnet.arc.network",
    wsUrl: "wss://rpc.testnet.arc.network",
    explorer: "https://testnet.arcscan.app",
    faucet: "https://faucet.circle.com",
    name: "Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  },
  mainnet: {
    chainId: 5042001, // TBD - placeholder
    rpcUrl: "https://rpc.arc.network",
    wsUrl: "wss://rpc.arc.network",
    explorer: "https://arcscan.app",
    faucet: null,
    name: "Arc Mainnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  },
} as const;

// Alternative RPC providers for redundancy
export const ARC_RPC_PROVIDERS = {
  testnet: {
    primary: "https://rpc.testnet.arc.network",
    blockdaemon: "https://rpc.blockdaemon.testnet.arc.network",
    drpc: "https://rpc.drpc.testnet.arc.network",
    quicknode: "https://rpc.quicknode.testnet.arc.network",
  },
} as const;

export interface ArcConfig {
  apiKey: string;
  network: "testnet" | "mainnet";
  chainId: number;
  rpcUrl: string;
  wsUrl: string;
  explorer: string;
}

export function getArcConfig(): ArcConfig {
  if (!arcApiKey) {
    throw new Error("CIRCLE_ARC_API_KEY not configured");
  }

  const network = arcNetwork as "testnet" | "mainnet";
  const networkConfig = ARC_NETWORKS[network];

  return {
    apiKey: arcApiKey,
    network,
    chainId: networkConfig.chainId,
    rpcUrl: networkConfig.rpcUrl,
    wsUrl: networkConfig.wsUrl,
    explorer: networkConfig.explorer,
  };
}

export function getArcNetworkConfig(network: "testnet" | "mainnet" = "testnet") {
  return ARC_NETWORKS[network];
}

export function getArcChainId(network: "testnet" | "mainnet" = "testnet"): number {
  return ARC_NETWORKS[network].chainId;
}

export function isArcConfigured(): boolean {
  return !!arcApiKey;
}

export function isArcMainnet(): boolean {
  return arcNetwork === "mainnet";
}

// Arc API request helper
export async function arcRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T> {
  const config = getArcConfig();

  const response = await fetch(`${config.rpcUrl}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "X-Arc-Network": config.network,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Circle Arc API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

// Arc supported tokens
export type ArcToken = "USDC" | "EURC";

// Arc transaction status
export type ArcTransactionStatus =
  | "pending"
  | "confirmed"
  | "finalized"
  | "failed";

export interface ArcTransaction {
  id: string;
  hash: string;
  status: ArcTransactionStatus;
  from: string;
  to: string;
  token: ArcToken;
  amount: string;
  fee: string;
  timestamp: string;
  blockNumber: number;
  confirmations: number;
}

export interface ArcWallet {
  id: string;
  address: string;
  balances: {
    token: ArcToken;
    amount: string;
  }[];
  createdAt: string;
}

// Create Arc wallet (when mainnet launches)
export async function createArcWallet(userId: string): Promise<ArcWallet> {
  return arcRequest<ArcWallet>("/v1/wallets", {
    method: "POST",
    body: { userId },
  });
}

// Get Arc wallet
export async function getArcWallet(walletId: string): Promise<ArcWallet> {
  return arcRequest<ArcWallet>(`/v1/wallets/${walletId}`);
}

// Get Arc wallet balance
export async function getArcBalance(
  walletId: string,
  token: ArcToken = "USDC"
): Promise<{ token: ArcToken; amount: string }> {
  const wallet = await getArcWallet(walletId);
  const balance = wallet.balances.find((b) => b.token === token);
  return balance ?? { token, amount: "0" };
}

// Send Arc transaction
export async function sendArcTransaction(input: {
  fromWalletId: string;
  toAddress: string;
  token: ArcToken;
  amount: string;
  idempotencyKey: string;
}): Promise<ArcTransaction> {
  return arcRequest<ArcTransaction>("/v1/transactions", {
    method: "POST",
    body: input,
  });
}

// Get Arc transaction
export async function getArcTransaction(
  transactionId: string
): Promise<ArcTransaction> {
  return arcRequest<ArcTransaction>(`/v1/transactions/${transactionId}`);
}

// Get Arc transaction by hash
export async function getArcTransactionByHash(
  hash: string
): Promise<ArcTransaction> {
  return arcRequest<ArcTransaction>(`/v1/transactions/hash/${hash}`);
}

// List Arc transactions for wallet
export async function listArcTransactions(
  walletId: string,
  limit = 20
): Promise<ArcTransaction[]> {
  return arcRequest<ArcTransaction[]>(
    `/v1/wallets/${walletId}/transactions?limit=${limit}`
  );
}

// Check if transaction is finalized (sub-second on Arc)
export function isTransactionFinalized(tx: ArcTransaction): boolean {
  return tx.status === "finalized";
}

// Arc Explorer URLs
export function getArcExplorerUrl(hash: string, type: "tx" | "address" | "block" = "tx"): string {
  const config = ARC_NETWORKS[arcNetwork as "testnet" | "mainnet"];
  return `${config.explorer}/${type}/${hash}`;
}

export function getArcTransactionUrl(hash: string): string {
  return getArcExplorerUrl(hash, "tx");
}

export function getArcAddressUrl(address: string): string {
  return getArcExplorerUrl(address, "address");
}

export function getArcBlockUrl(blockNumber: number | string): string {
  return getArcExplorerUrl(String(blockNumber), "block");
}

// Get faucet URL for testnet USDC
export function getArcFaucetUrl(): string | null {
  const config = ARC_NETWORKS[arcNetwork as "testnet" | "mainnet"];
  return config.faucet;
}

// Webhook event types for Arc
export type ArcWebhookEventType =
  | "transaction.pending"
  | "transaction.confirmed"
  | "transaction.finalized"
  | "transaction.failed"
  | "wallet.created";

export interface ArcWebhookEvent {
  id: string;
  type: ArcWebhookEventType;
  data: ArcTransaction | ArcWallet;
  timestamp: string;
}

// ============================================================
// ARC WEBHOOK VERIFICATION & HELPERS
// ============================================================

// Verify Arc webhook signature (HMAC-SHA256)
export function verifyArcWebhook(
  payload: string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret ?? process.env.CIRCLE_ARC_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("CIRCLE_ARC_WEBHOOK_SECRET not configured, skipping verification");
    return true; // In development, allow without verification
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

// Parse Arc webhook payload
export function parseArcWebhook(payload: string): ArcWebhookEvent {
  return JSON.parse(payload) as ArcWebhookEvent;
}

// Extract transaction info from Arc webhook
export function extractArcTransactionInfo(event: ArcWebhookEvent): ArcTransaction | null {
  if (
    event.type !== "transaction.pending" &&
    event.type !== "transaction.confirmed" &&
    event.type !== "transaction.finalized" &&
    event.type !== "transaction.failed"
  ) {
    return null;
  }

  return event.data as ArcTransaction;
}

// Extract wallet info from Arc webhook
export function extractArcWalletInfo(event: ArcWebhookEvent): ArcWallet | null {
  if (event.type !== "wallet.created") {
    return null;
  }

  return event.data as ArcWallet;
}

// Handler type for Arc webhook events
export type ArcWebhookHandler = {
  [K in ArcWebhookEventType]?: (event: ArcWebhookEvent) => Promise<void>;
};

// Create Arc webhook handler with typed handlers
export function createArcWebhookHandler(handlers: ArcWebhookHandler) {
  return async (event: ArcWebhookEvent) => {
    const handler = handlers[event.type];
    if (handler) {
      await handler(event);
    }
  };
}

// ============================================================
// AGENT WALLET SYSTEM
// ============================================================

// Agent wallet configuration - Oryn's master wallet that receives all payments
export interface AgentWalletConfig {
  walletId: string;
  address: string;
  network: "testnet" | "mainnet";
}

// Get the Oryn Agent Wallet configuration
export function getAgentWalletConfig(): AgentWalletConfig {
  const walletId = process.env.ORYN_AGENT_WALLET_ID;
  const address = process.env.ORYN_AGENT_ADDRESS;

  if (!walletId || !address) {
    throw new Error(
      "ORYN_AGENT_WALLET_ID and ORYN_AGENT_ADDRESS must be configured"
    );
  }

  return {
    walletId,
    address,
    network: arcNetwork as "testnet" | "mainnet",
  };
}

// Check if agent wallet is configured
export function isAgentWalletConfigured(): boolean {
  return !!(process.env.ORYN_AGENT_WALLET_ID && process.env.ORYN_AGENT_ADDRESS);
}

// ============================================================
// PAYMENT POLICIES
// ============================================================

export type PolicyAction = "forward" | "hold" | "reject";

export interface PolicyDecision {
  action: PolicyAction;
  reason: string;
  netAmount?: number; // Amount after fees (for forward action)
  fee?: number;
  toWalletId?: string;
  toAddress?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentContext {
  fromAddress: string;
  toAddress: string;
  amount: number;
  token: ArcToken;
  transactionHash: string;
  claimId?: string;
  expectedAmount?: number;
  userId?: string;
}

// Default fee percentage (0.1% = 10 basis points)
const ORYN_FEE_PERCENTAGE = 0.001;

// Minimum payment amount to process ($1)
const MIN_PAYMENT_AMOUNT = 1;

// Maximum underpayment tolerance (5%)
const UNDERPAYMENT_TOLERANCE = 0.05;

// Evaluate payment against policies and determine action
export function evaluatePaymentPolicy(
  context: PaymentContext
): PolicyDecision {
  const { amount, expectedAmount } = context;

  // Policy 1: Reject payments below minimum
  if (amount < MIN_PAYMENT_AMOUNT) {
    return {
      action: "reject",
      reason: `Payment below minimum amount ($${MIN_PAYMENT_AMOUNT})`,
    };
  }

  // Policy 2: If we have expected amount, validate payment
  if (expectedAmount !== undefined) {
    const minAcceptable = expectedAmount * (1 - UNDERPAYMENT_TOLERANCE);

    if (amount < minAcceptable) {
      return {
        action: "hold",
        reason: `Underpayment detected: received $${amount.toFixed(2)}, expected $${expectedAmount.toFixed(2)}`,
        metadata: { underpaymentAmount: expectedAmount - amount },
      };
    }
  }

  // Policy 3: Calculate fee and net amount for forwarding
  const fee = Math.round(amount * ORYN_FEE_PERCENTAGE * 100) / 100; // Round to cents
  const netAmount = Math.round((amount - fee) * 100) / 100;

  return {
    action: "forward",
    reason: "Payment validated, ready for forwarding",
    netAmount,
    fee,
  };
}

// Auto-forward payment from agent wallet to user wallet
export async function autoForwardPayment(input: {
  toWalletId: string;
  toAddress: string;
  amount: number;
  token: ArcToken;
  originalTxHash: string;
  claimId?: string;
}): Promise<ArcTransaction> {
  const agentWallet = getAgentWalletConfig();

  // Create idempotency key from original transaction
  const idempotencyKey = `forward-${input.originalTxHash}`;

  return sendArcTransaction({
    fromWalletId: agentWallet.walletId,
    toAddress: input.toAddress,
    token: input.token,
    amount: input.amount.toString(),
    idempotencyKey,
  });
}

// ============================================================
// CIRCLE GATEWAY (Cross-Chain)
// ============================================================

// Supported source chains for Circle Gateway bridging
export const GATEWAY_SOURCE_CHAINS = [
  "ethereum",
  "polygon",
  "arbitrum",
  "optimism",
  "avalanche",
  "base",
  "solana",
] as const;

export type GatewaySourceChain = (typeof GATEWAY_SOURCE_CHAINS)[number];

export interface GatewayBridgeRequest {
  sourceChain: GatewaySourceChain;
  sourceAddress: string;
  amount: string;
  token: "USDC";
  destinationAddress: string; // Always Agent Wallet on Arc
  idempotencyKey: string;
}

export interface GatewayBridgeStatus {
  id: string;
  status: "pending" | "bridging" | "completed" | "failed";
  sourceChain: GatewaySourceChain;
  sourceTxHash?: string;
  destinationTxHash?: string;
  amount: string;
  fee: string;
  estimatedArrival?: string;
}

// Initiate cross-chain bridge via Circle Gateway
export async function initiateGatewayBridge(
  request: GatewayBridgeRequest
): Promise<GatewayBridgeStatus> {
  return arcRequest<GatewayBridgeStatus>("/v1/gateway/bridge", {
    method: "POST",
    body: request,
  });
}

// Get Gateway bridge status
export async function getGatewayBridgeStatus(
  bridgeId: string
): Promise<GatewayBridgeStatus> {
  return arcRequest<GatewayBridgeStatus>(`/v1/gateway/bridge/${bridgeId}`);
}

// Get deposit address for Gateway bridging (client sends USDC here from source chain)
export async function getGatewayDepositAddress(
  sourceChain: GatewaySourceChain
): Promise<{ address: string; expiresAt: string }> {
  const agentWallet = getAgentWalletConfig();

  return arcRequest<{ address: string; expiresAt: string }>("/v1/gateway/deposit-address", {
    method: "POST",
    body: {
      sourceChain,
      destinationAddress: agentWallet.address,
    },
  });
}
