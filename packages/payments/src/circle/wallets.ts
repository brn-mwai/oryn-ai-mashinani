import { circleRequest, CircleChain } from "./client";

export interface CircleWallet {
  id: string;
  state: "LIVE" | "FROZEN";
  walletSetId: string;
  custodyType: "DEVELOPER" | "END_USER";
  userId?: string;
  address: string;
  blockchain: CircleChain;
  createDate: string;
  updateDate: string;
}

export interface WalletBalance {
  token: {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
  };
  amount: string;
}

// Create a wallet set (container for wallets)
export async function createWalletSet(input: {
  name: string;
  idempotencyKey: string;
}): Promise<{ id: string; name: string }> {
  const response = await circleRequest<{
    data: { walletSet: { id: string; name: string } };
  }>("/v1/w3s/developer/walletSets", {
    method: "POST",
    body: {
      name: input.name,
      idempotencyKey: input.idempotencyKey,
    },
  });

  return response.data.walletSet;
}

// Create a wallet for a user
export async function createWallet(input: {
  walletSetId: string;
  blockchain: CircleChain;
  userId?: string;
  idempotencyKey: string;
}): Promise<CircleWallet> {
  const response = await circleRequest<{
    data: { wallets: CircleWallet[] };
  }>("/v1/w3s/developer/wallets", {
    method: "POST",
    body: {
      walletSetId: input.walletSetId,
      blockchains: [input.blockchain],
      count: 1,
      userId: input.userId,
      idempotencyKey: input.idempotencyKey,
    },
  });

  return response.data.wallets[0];
}

// Get wallet by ID
export async function getWallet(walletId: string): Promise<CircleWallet> {
  const response = await circleRequest<{
    data: { wallet: CircleWallet };
  }>(`/v1/w3s/wallets/${walletId}`);

  return response.data.wallet;
}

// Get wallet balance
export async function getWalletBalance(
  walletId: string
): Promise<WalletBalance[]> {
  const response = await circleRequest<{
    data: { tokenBalances: WalletBalance[] };
  }>(`/v1/w3s/wallets/${walletId}/balances`);

  return response.data.tokenBalances;
}

// Get USDC balance specifically
export async function getUsdcBalance(walletId: string): Promise<number> {
  const balances = await getWalletBalance(walletId);
  const usdcBalance = balances.find((b) => b.token.symbol === "USDC");
  return usdcBalance ? parseFloat(usdcBalance.amount) : 0;
}

// List wallets in a wallet set
export async function listWallets(walletSetId: string): Promise<CircleWallet[]> {
  const response = await circleRequest<{
    data: { wallets: CircleWallet[] };
  }>(`/v1/w3s/wallets?walletSetId=${walletSetId}`);

  return response.data.wallets;
}

// Get wallet by address
export async function getWalletByAddress(
  address: string,
  blockchain: CircleChain
): Promise<CircleWallet | null> {
  const response = await circleRequest<{
    data: { wallets: CircleWallet[] };
  }>(`/v1/w3s/wallets?address=${address}&blockchain=${blockchain}`);

  return response.data.wallets[0] ?? null;
}
