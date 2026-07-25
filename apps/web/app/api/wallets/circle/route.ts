import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { auth } from "@clerk/nextjs/server";
import { createWallet, createWalletSet, getWallet, isCircleConfigured } from "@oryn/payments/circle";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// POST /api/wallets/circle - Create/activate Circle USDC wallet
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Check if Circle is configured
    if (!isCircleConfigured()) {
      return NextResponse.json(
        { error: "Circle integration not configured" },
        { status: 503 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's USDC wallet
    const wallets = await convex.query(api.wallets.listByUser, { userId: user._id });
    const usdcWallet = wallets.find((w: { type: string }) => w.type === "usdc");

    if (!usdcWallet) {
      return NextResponse.json(
        { error: "USDC wallet not found" },
        { status: 404 }
      );
    }

    // Check if wallet already has Circle ID
    if (usdcWallet.circleWalletId) {
      // Wallet already activated, return current details
      const circleWallet = await getWallet(usdcWallet.circleWalletId);
      return NextResponse.json({
        success: true,
        message: "Wallet already activated",
        wallet: {
          id: circleWallet.id,
          address: circleWallet.address,
          blockchain: circleWallet.blockchain,
          state: circleWallet.state,
        },
      });
    }

    // Create a wallet set for this user if needed (one-time)
    const idempotencyKey = `oryn-user-${user._id}-walletset`;
    const walletSet = await createWalletSet({
      name: `Oryn User ${user._id}`,
      idempotencyKey,
    });

    // Create the Circle wallet
    const walletIdempotencyKey = `oryn-user-${user._id}-wallet-matic`;
    const circleWallet = await createWallet({
      walletSetId: walletSet.id,
      blockchain: "MATIC", // Polygon for low fees
      userId: user._id,
      idempotencyKey: walletIdempotencyKey,
    });

    // Update the Convex wallet with Circle details
    await convex.mutation(api.wallets.setCircleWalletId, {
      id: usdcWallet._id,
      circleWalletId: circleWallet.id,
      circleAddress: circleWallet.address,
      circleWalletSetId: walletSet.id,
      circleChain: "polygon", // MATIC = Polygon
    });

    return NextResponse.json({
      success: true,
      message: "Wallet activated",
      wallet: {
        id: circleWallet.id,
        address: circleWallet.address,
        blockchain: circleWallet.blockchain,
        state: circleWallet.state,
      },
    });
  } catch (error) {
    console.error("Circle wallet creation error:", error);
    return NextResponse.json(
      { error: "Failed to create Circle wallet" },
      { status: 500 }
    );
  }
}

// GET /api/wallets/circle - Get Circle wallet status
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get user's USDC wallet
    const wallets = await convex.query(api.wallets.listByUser, { userId: user._id });
    const usdcWallet = wallets.find((w: { type: string }) => w.type === "usdc");

    if (!usdcWallet) {
      return NextResponse.json({
        activated: false,
        message: "USDC wallet not found",
      });
    }

    if (!usdcWallet.circleWalletId) {
      return NextResponse.json({
        activated: false,
        message: "Circle wallet not yet activated",
      });
    }

    // Get Circle wallet details
    const circleWallet = await getWallet(usdcWallet.circleWalletId);

    return NextResponse.json({
      activated: true,
      wallet: {
        id: circleWallet.id,
        address: circleWallet.address,
        blockchain: circleWallet.blockchain,
        state: circleWallet.state,
      },
    });
  } catch (error) {
    console.error("Get Circle wallet error:", error);
    return NextResponse.json(
      { error: "Failed to get wallet status" },
      { status: 500 }
    );
  }
}
