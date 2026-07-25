import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

/**
 * Offramp - Convert USDC to fiat and withdraw to bank account
 *
 * This integrates with Circle's offramp or Stripe for converting crypto to fiat.
 * In production, you would use:
 * - Circle's USDC to fiat conversion
 * - Bridge.xyz integration
 * - Stripe Connect payouts
 */

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { walletId, amount, bankDetails } = body as {
      walletId: string;
      amount: number;
      bankDetails: {
        accountNumber: string;
        routingNumber: string;
        accountType: "checking" | "savings";
        accountHolderName: string;
      };
    };

    // Validate inputs
    if (!walletId || !amount || !bankDetails) {
      return NextResponse.json(
        { error: "walletId, amount, and bankDetails are required" },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: "Minimum offramp amount is $10" },
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

    if (wallet.type !== "usdc") {
      return NextResponse.json(
        { error: "Offramp is only available for USDC wallets" },
        { status: 400 }
      );
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // Check KYC for large amounts
    if (amount > 1000 && user.kycStatus !== "verified") {
      return NextResponse.json(
        { error: "Identity verification required for amounts over $1,000" },
        { status: 400 }
      );
    }

    // Calculate fees (example: 1.5% fee for offramp)
    const feePercent = 0.015;
    const fee = Math.round(amount * feePercent * 100) / 100;
    const netAmount = amount - fee;

    // In production, this would:
    // 1. Initiate Circle USDC to fiat conversion
    // 2. Create Stripe payout to bank account
    // 3. Use Bridge.xyz or similar offramp service

    // For now, create the withdrawal request
    const transactionId = await convex.mutation(api.wallets.requestWithdrawal, {
      userId: user._id,
      amount,
      method: "bank_transfer",
      destination: {
        type: "bank",
        accountLast4: bankDetails.accountNumber.slice(-4),
        accountHolderName: bankDetails.accountHolderName,
        accountType: bankDetails.accountType,
      },
    });

    // Create fee transaction
    // await convex.mutation(api.wallets.createFeeTransaction, {
    //   walletId: wallet._id,
    //   userId: user._id,
    //   amount: fee,
    //   description: "Offramp fee",
    // });

    return NextResponse.json({
      success: true,
      transactionId,
      details: {
        amount,
        fee,
        netAmount,
        estimatedArrival: "1-3 business days",
        bankAccountLast4: bankDetails.accountNumber.slice(-4),
      },
    });
  } catch (error: any) {
    console.error("Offramp error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process offramp" },
      { status: 500 }
    );
  }
}

// GET - Get offramp fees and limits
export async function GET() {
  return NextResponse.json({
    fees: {
      percentage: 1.5,
      minimumFee: 0.50,
      maximumFee: 50.00,
    },
    limits: {
      minimum: 10,
      maximumUnverified: 1000,
      maximumVerified: 50000,
      dailyLimit: 10000,
      monthlyLimit: 50000,
    },
    supportedCountries: ["US", "CA", "GB", "EU"],
    processingTime: "1-3 business days",
    supportedBankTypes: ["checking", "savings"],
  });
}
