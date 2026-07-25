// Circle client
export {
  getCircleConfig,
  isCircleConfigured,
  circleRequest,
  chainNames,
  chainExplorers,
  getTransactionUrl,
} from "./client";
export type { CircleConfig, CircleChain } from "./client";

// Wallet functions
export {
  createWalletSet,
  createWallet,
  getWallet,
  getWalletBalance,
  getUsdcBalance,
  listWallets,
  getWalletByAddress,
} from "./wallets";
export type { CircleWallet, WalletBalance } from "./wallets";

// Transfer functions
export {
  createTransfer,
  getTransfer,
  listTransfers,
  getTransferDetails,
  isTransferTerminal,
  isTransferSuccessful,
  createUsdcTransfer,
  USDC_TOKEN_IDS,
} from "./transfers";
export type { CircleTransfer, TransferState } from "./transfers";

// Webhook utilities
export {
  verifyCircleWebhook,
  parseCircleWebhook,
  createCircleWebhookHandler,
  extractTransferInfo,
  extractWalletInfo,
} from "./webhook";
export type {
  CircleWebhookEvent,
  CircleWebhookEventType,
  CircleWebhookHandler,
} from "./webhook";

// Circle Arc (L1 Blockchain - 2026)
export {
  // Core Arc functions
  getArcConfig,
  isArcConfigured,
  isArcMainnet,
  arcRequest,
  createArcWallet,
  getArcWallet,
  getArcBalance,
  sendArcTransaction,
  getArcTransaction,
  getArcTransactionByHash,
  listArcTransactions,
  isTransactionFinalized,
  getArcExplorerUrl,
  getArcTransactionUrl,
  getArcAddressUrl,
  getArcBlockUrl,
  getArcFaucetUrl,
  // Arc Webhook functions
  verifyArcWebhook,
  parseArcWebhook,
  extractArcTransactionInfo,
  extractArcWalletInfo,
  createArcWebhookHandler,
  // Agent Wallet functions
  getAgentWalletConfig,
  isAgentWalletConfigured,
  evaluatePaymentPolicy,
  autoForwardPayment,
  // Circle Gateway (cross-chain)
  GATEWAY_SOURCE_CHAINS,
  initiateGatewayBridge,
  getGatewayBridgeStatus,
  getGatewayDepositAddress,
  // Constants
  ARC_NETWORKS,
  ARC_RPC_PROVIDERS,
} from "./arc";
export type {
  ArcConfig,
  ArcToken,
  ArcTransactionStatus,
  ArcTransaction,
  ArcWallet,
  ArcWebhookEventType,
  ArcWebhookEvent,
  ArcWebhookHandler,
  AgentWalletConfig,
  PolicyAction,
  PolicyDecision,
  PaymentContext,
  GatewaySourceChain,
  GatewayBridgeRequest,
  GatewayBridgeStatus,
} from "./arc";
