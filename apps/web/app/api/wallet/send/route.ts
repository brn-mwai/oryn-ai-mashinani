import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";
import {
  createUsdcTransfer,
  USDC_TOKEN_IDS,
  sendArcTransaction,
  isArcConfigured,
} from "@oryn/payments/circle";
import type { CircleChain } from "@oryn/payments/circle";
import { nanoid } from "nanoid";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, destinationAddress, amount, memo } = body as {
      walletId: string;
      destinationAddress: string;
      amount: number;
      memo?: string;
    };

    // Validate inputs
    if (!walletId || !destinationAddress || !amount) {
      return NextResponse.json(
        { error: "walletId, destinationAddress, and amount are required" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate address format (basic check)
    if (!destinationAddress.match(/^(0x[a-fA-F0-9]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/)) {
      return NextResponse.json(
        { error: "Invalid destination address format" },
        { status: 400 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get wallet
    const wallet = await convex.query(api.wallets.get, { id: walletId as any });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    if (wallet.userId !== user._id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    const idempotencyKey = nanoid();
    let transferResult: { id: string; status: string; hash?: string } | null = null;

    // Determine if this is an Arc or Circle transfer
    if (wallet.arcEnabled && wallet.arcWalletId) {
      // Send via Arc
      if (!isArcConfigured()) {
        return NextResponse.json(
          { error: "Arc network not configured" },
          { status: 500 }
        );
      }

      const arcTx = await sendArcTransaction({
        fromWalletId: wallet.arcWalletId,
        toAddress: destinationAddress,
        token: "USDC",
        amount: amount.toString(),
        idempotencyKey,
      });

      transferResult = {
        id: arcTx.id,
        status: arcTx.status,
        hash: arcTx.hash,
      };
    } else if (wallet.circleWalletId && wallet.circleChain) {
      // Send via Circle
      const chain = wallet.circleChain.toUpperCase() as CircleChain;
      if (!USDC_TOKEN_IDS[chain]) {
        return NextResponse.json(
          { error: `Unsupported chain: ${wallet.circleChain}` },
          { status: 400 }
        );
      }

      const circleTx = await createUsdcTransfer({
        walletId: wallet.circleWalletId,
        destinationAddress,
        amount,
        chain,
        idempotencyKey,
      });

      transferResult = {
        id: circleTx.id,
        status: circleTx.state,
        hash: circleTx.transactionHash,
      };
    } else {
      return NextResponse.json(
        { error: "Wallet is not activated for transfers. Please create a wallet first." },
        { status: 400 }
      );
    }

    // Create transfer record in Convex
    const transactionId = await convex.mutation(api.wallets.createTransfer, {
      fromWalletId: walletId as any,
      userId: user._id,
      amount,
      destinationAddress,
      destinationType: "external",
      chain: wallet.circleChain || "arc",
      circleTransferId: transferResult.id,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      transfer: {
        id: transferResult.id,
        status: transferResult.status,
        hash: transferResult.hash,
        amount,
        destinationAddress,
        chain: wallet.circleChain || "arc",
      },
    });
  } catch (error: any) {
    console.error("Send transfer error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send transfer" },
      { status: 500 }
    );
  }
}

// GET - Get transfer status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transactionId");

    if (!transactionId) {
      return NextResponse.json(
        { error: "transactionId is required" },
        { status: 400 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get transaction
    const transactions = await convex.query(api.wallets.listTransactions, {
      walletId: transactionId as any, // This is actually transactionId, we need a different query
      limit: 1,
    });

    // For now, return basic status
    return NextResponse.json({
      transactionId,
      status: "pending", // Would need proper status tracking
    });
  } catch (error: any) {
    console.error("Get transfer status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get transfer status" },
      { status: 500 }
    );
  }
}
