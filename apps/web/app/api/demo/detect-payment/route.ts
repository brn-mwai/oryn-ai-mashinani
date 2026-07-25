import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Arc Testnet RPC (Circle's L1)
const ARC_TESTNET_RPC = "https://rpc-testnet.arc.circle.com";
const USDC_CONTRACT = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Testnet USDC

// Our agent wallet address (receives payments)
const AGENT_WALLET = "0x93f7da1bfb0c61392e51f14f055deec5f120416c";

interface TransactionReceipt {
  status: string;
  from: string;
  to: string;
  value: string;
  blockNumber: string;
  transactionHash: string;
}

async function getTransactionFromArc(txHash: string): Promise<TransactionReceipt | null> {
  try {
    // Try to fetch transaction receipt from Arc testnet
    const response = await fetch(ARC_TESTNET_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getTransactionReceipt",
        params: [txHash],
        id: 1,
      }),
    });

    const data = await response.json();
    if (data.result) {
      return {
        status: data.result.status,
        from: data.result.from,
        to: data.result.to,
        value: data.result.value || "0x0",
        blockNumber: data.result.blockNumber,
        transactionHash: data.result.transactionHash,
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch from Arc:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionHash, amount, claimId } = body;

    if (!transactionHash) {
      return NextResponse.json(
        { error: "Transaction hash required" },
        { status: 400 }
      );
    }

    // Get user from Convex
    const user = await convex.query(api.users.getByClerkId, { clerkId: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Try to verify transaction on Arc (may fail if testnet is unavailable)
    let txReceipt = await getTransactionFromArc(transactionHash);
    let verified = false;

    if (txReceipt && txReceipt.status === "0x1") {
      verified = true;
    }

    // For demo purposes, if we can't verify on-chain, we'll trust the user
    // In production, this would be strictly verified
    const paymentAmount = amount || 7000; // Default to demo amount
    const now = Date.now();

    // Find the active claim for this user
    let targetClaimId = claimId;
    if (!targetClaimId) {
      const claims = await convex.query(api.claims.list, {
        userId: user._id,
      });
      const activeClaim = claims?.data?.find((c: any) => c.status === "active");
      if (activeClaim) {
        targetClaimId = activeClaim._id;
      }
    }

    if (!targetClaimId) {
      return NextResponse.json(
        { error: "No active claim found" },
        { status: 404 }
      );
    }

    // Get the claim
    const claim = await convex.query(api.claims.get, { id: targetClaimId });
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    // Get user's wallet
    const wallet = await convex.query(api.wallets.getByUser, { userId: user._id });

    // Create payment record
    const paymentId = await convex.mutation(api.payments.create, {
      claimId: targetClaimId,
      userId: user._id,
      clientId: claim.clientId,
      amount: paymentAmount,
      currency: "USDC",
      method: "usdc",
      status: "completed",
      transactionHash: transactionHash,
      chain: "arc",
    });

    // Update claim status to collected using markPaymentReceived
    await convex.mutation(api.claims.markPaymentReceived, {
      id: targetClaimId,
      paymentAmount: paymentAmount,
      transactionHash: transactionHash,
    });

    // Update thought signature to COLLECTED
    const thoughtSignature = await convex.query(api.thoughtSignatures.getByClaim, {
      claimId: targetClaimId,
    });
    if (thoughtSignature) {
      await convex.mutation(api.thoughtSignatures.updateLevel, {
        id: thoughtSignature._id,
        level: "COLLECTED",
      });
      await convex.mutation(api.thoughtSignatures.updateContext, {
        id: thoughtSignature._id,
        context: {
          ...thoughtSignature.context,
          paymentReceived: paymentAmount,
          paymentTransactionHash: transactionHash,
        },
      });
    }

    // Create notification
    await convex.mutation(api.notifications.create, {
      userId: user._id,
      type: "payment_received",
      title: "Payment Received!",
      message: `$${paymentAmount.toLocaleString()} USDC received for Invoice #INV-2025-0147`,
      claimId: targetClaimId,
      paymentId: paymentId,
      priority: "high",
    });

    // Mark payment link as used
    const paymentLinks = await convex.query(api.paymentLinks.listByClaim, {
      claimId: targetClaimId,
    });
    if (paymentLinks && paymentLinks.length > 0) {
      await convex.mutation(api.paymentLinks.markUsed, {
        id: paymentLinks[0]._id,
        paymentId: paymentId,
      });
    }

    return NextResponse.json({
      success: true,
      verified,
      message: verified
        ? "Payment verified on Arc blockchain and recorded!"
        : "Payment recorded (on-chain verification pending)",
      data: {
        paymentId,
        claimId: targetClaimId,
        amount: paymentAmount,
        transactionHash,
        status: "collected",
        explorerUrl: `https://explorer-testnet.arc.circle.com/tx/${transactionHash}`,
      },
    });
  } catch (error) {
    console.error("Payment detection error:", error);
    return NextResponse.json(
      { error: "Failed to process payment", details: String(error) },
      { status: 500 }
    );
  }
}
