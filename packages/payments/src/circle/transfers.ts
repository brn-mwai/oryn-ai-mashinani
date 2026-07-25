import { circleRequest, CircleChain, getTransactionUrl } from "./client";

export type TransferState =
  | "INITIATED"
  | "PENDING_RISK_SCREENING"
  | "DENIED"
  | "QUEUED"
  | "SENT"
  | "CONFIRMED"
  | "COMPLETE"
  | "FAILED"
  | "CANCELLED";

export interface CircleTransfer {
  id: string;
  state: TransferState;
  blockchain: CircleChain;
  sourceAddress?: string;
  destinationAddress: string;
  tokenId: string;
  amounts: string[];
  transactionHash?: string;
  createDate: string;
  updateDate: string;
}

// Create an outbound transfer (send USDC)
export async function createTransfer(input: {
  walletId: string;
  destinationAddress: string;
  amount: string;
  tokenId: string;
  idempotencyKey: string;
}): Promise<CircleTransfer> {
  const response = await circleRequest<{
    data: { transfer: CircleTransfer };
  }>("/v1/w3s/developer/transactions/transfer", {
    method: "POST",
    body: {
      walletId: input.walletId,
      destinationAddress: input.destinationAddress,
      amounts: [input.amount],
      tokenId: input.tokenId,
      feeLevel: "MEDIUM",
      idempotencyKey: input.idempotencyKey,
    },
  });

  return response.data.transfer;
}

// Get transfer status
export async function getTransfer(transferId: string): Promise<CircleTransfer> {
  const response = await circleRequest<{
    data: { transfer: CircleTransfer };
  }>(`/v1/w3s/transactions/${transferId}`);

  return response.data.transfer;
}

// List transfers for a wallet
export async function listTransfers(walletId: string): Promise<CircleTransfer[]> {
  const response = await circleRequest<{
    data: { transfers: CircleTransfer[] };
  }>(`/v1/w3s/transactions?walletIds=${walletId}`);

  return response.data.transfers;
}

// Get transaction details including explorer URL
export async function getTransferDetails(transferId: string): Promise<{
  transfer: CircleTransfer;
  explorerUrl?: string;
}> {
  const transfer = await getTransfer(transferId);

  let explorerUrl: string | undefined;
  if (transfer.transactionHash) {
    explorerUrl = getTransactionUrl(transfer.blockchain, transfer.transactionHash);
  }

  return { transfer, explorerUrl };
}

// Check if transfer is terminal (complete or failed)
export function isTransferTerminal(state: TransferState): boolean {
  return ["COMPLETE", "FAILED", "CANCELLED", "DENIED"].includes(state);
}

// Check if transfer succeeded
export function isTransferSuccessful(state: TransferState): boolean {
  return state === "COMPLETE";
}

// Token IDs for USDC on different chains
export const USDC_TOKEN_IDS: Record<CircleChain, string> = {
  ETH: "usdc-eth", // Ethereum
  MATIC: "usdc-matic", // Polygon
  SOL: "usdc-sol", // Solana
  AVAX: "usdc-avax", // Avalanche
};

// Helper to create USDC transfer
export async function createUsdcTransfer(input: {
  walletId: string;
  destinationAddress: string;
  amount: number;
  chain: CircleChain;
  idempotencyKey: string;
}): Promise<CircleTransfer> {
  return createTransfer({
    walletId: input.walletId,
    destinationAddress: input.destinationAddress,
    amount: input.amount.toString(),
    tokenId: USDC_TOKEN_IDS[input.chain],
    idempotencyKey: input.idempotencyKey,
  });
}
