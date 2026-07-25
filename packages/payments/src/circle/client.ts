// Circle SDK client
// Note: Using Circle's W3S (Web3 Services) SDK for programmable wallets

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

// Circle API base URL
const CIRCLE_API_URL = process.env.CIRCLE_API_URL ?? "https://api.circle.com";

export interface CircleConfig {
  apiKey: string;
  entitySecret: string;
  apiUrl: string;
}

export function getCircleConfig(): CircleConfig {
  if (!apiKey) {
    throw new Error("CIRCLE_API_KEY not configured");
  }
  if (!entitySecret) {
    throw new Error("CIRCLE_ENTITY_SECRET not configured");
  }

  return {
    apiKey,
    entitySecret,
    apiUrl: CIRCLE_API_URL,
  };
}

export function isCircleConfigured(): boolean {
  return !!apiKey && !!entitySecret;
}

// Circle API request helper
export async function circleRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
  } = {}
): Promise<T> {
  const config = getCircleConfig();

  const response = await fetch(`${config.apiUrl}${endpoint}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `Circle API error: ${response.status} - ${JSON.stringify(error)}`
    );
  }

  return response.json();
}

// Supported blockchain networks
export type CircleChain = "ETH" | "MATIC" | "SOL" | "AVAX";

// Chain to human-readable name
export const chainNames: Record<CircleChain, string> = {
  ETH: "Ethereum",
  MATIC: "Polygon",
  SOL: "Solana",
  AVAX: "Avalanche",
};

// Chain to explorer URL
export const chainExplorers: Record<CircleChain, string> = {
  ETH: "https://etherscan.io",
  MATIC: "https://polygonscan.com",
  SOL: "https://solscan.io",
  AVAX: "https://snowtrace.io",
};

// Get transaction explorer URL
export function getTransactionUrl(
  chain: CircleChain,
  txHash: string
): string {
  const explorer = chainExplorers[chain];
  return `${explorer}/tx/${txHash}`;
}
