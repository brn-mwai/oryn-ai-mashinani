import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import {
  createWalletSet,
  createWallet,
  createArcWallet,
  isArcConfigured,
} from "@oryn/payments/circle";
import type { CircleChain } from "@oryn/payments/circle";
import { nanoid } from "nanoid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Currently only Arc is enabled, others coming soon
const ENABLED_CHAINS = ["ARC"];
const COMING_SOON_CHAINS: CircleChain[] = ["ETH", "MATIC", "SOL", "AVAX"];

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { chain, name } = body as { chain?: string; name?: string };

    // Validate chain - only ARC is enabled for now
    const selectedChain = (chain?.toUpperCase() || "ARC") as CircleChain | "ARC";

    if (COMING_SOON_CHAINS.includes(selectedChain as CircleChain)) {
      return NextResponse.json(
        { error: `${selectedChain} wallets are coming soon. Only Circle Arc is currently available.` },
        { status: 400 }
      );
    }

    if (!ENABLED_CHAINS.includes(selectedChain)) {
      return NextResponse.json(
        { error: `Invalid chain. Currently available: Circle Arc` },
        { status: 400 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let walletData: {
      circleWalletId?: string;
      circleWalletSetId?: string;
      circleAddress?: string;
      circleChain?: "ethereum" | "polygon" | "solana" | "avalanche" | "arc";
      arcWalletId?: string;
      arcAddress?: string;
    } = {};

    if (selectedChain === "ARC") {
      // Create Arc wallet
      if (!isArcConfigured()) {
        return NextResponse.json(
          { error: "Arc network is not yet configured" },
          { status: 400 }
        );
      }

      const arcWallet = await createArcWallet(user._id);
      walletData = {
        arcWalletId: arcWallet.id,
        arcAddress: arcWallet.address,
      };
    } else {
      // Create Circle wallet on selected chain
      const idempotencyKey = nanoid();

      // First, create or get wallet set
      let walletSetId = user.circleWalletSetId;
      if (!walletSetId) {
        const walletSet = await createWalletSet({
          name: `${user.firstName || "User"}'s Wallet Set`,
          idempotencyKey: `ws-${user._id}-${idempotencyKey}`,
        });
        walletSetId = walletSet.id;
      }

      // Create wallet on the specified chain
      const wallet = await createWallet({
        walletSetId,
        blockchain: selectedChain,
        userId: user._id,
        idempotencyKey: `w-${user._id}-${selectedChain}-${idempotencyKey}`,
      });

      // Map chain to lowercase for schema
      const chainMap: Record<string, "ethereum" | "polygon" | "solana" | "avalanche" | "arc"> = {
        "ETH": "ethereum",
        "MATIC": "polygon",
        "SOL": "solana",
        "AVAX": "avalanche",
        "ARC": "arc",
      };
      walletData = {
        circleWalletId: wallet.id,
        circleWalletSetId: walletSetId,
        circleAddress: wallet.address,
        circleChain: chainMap[selectedChain] || "arc",
      };
    }

    // Create USDC wallet record in Convex
    const walletRecord = await convex.mutation(api.wallets.createUsdcWallet, {
      userId: user._id,
      name: name || `${selectedChain} Wallet`,
      ...walletData,
    });

    return NextResponse.json({
      success: true,
      wallet: {
        id: walletRecord,
        ...walletData,
        chain: selectedChain,
      },
    });
  } catch (error: any) {
    console.error("Create wallet error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create wallet" },
      { status: 500 }
    );
  }
}

// GET - List available chains
export async function GET() {
  return NextResponse.json({
    chains: [
      { id: "MATIC", name: "Polygon", description: "Fast, low fees", recommended: true },
      { id: "ETH", name: "Ethereum", description: "Most secure, higher fees" },
      { id: "SOL", name: "Solana", description: "Ultra fast" },
      { id: "AVAX", name: "Avalanche", description: "Fast finality" },
      { id: "ARC", name: "Circle Arc", description: "USDC native, sub-second finality", comingSoon: !isArcConfigured() },
    ],
  });
}
