import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { method, email, cardDetails, walletAddress } = body;

    // Validate payment link
    const paymentLink = await convex.query(api.paymentLinks.getByToken, { token });
    if (!paymentLink) {
      return NextResponse.json({ success: false, error: "Payment link not found" }, { status: 404 });
    }

    if (paymentLink.status === "used") {
      return NextResponse.json({ success: false, error: "Payment already completed" }, { status: 400 });
    }

    if (paymentLink.expiresAt && paymentLink.expiresAt < Date.now()) {
      return NextResponse.json({ success: false, error: "Payment link expired" }, { status: 400 });
    }

    // Get claim
    const claim = await convex.query(api.claims.get, { id: paymentLink.claimId });
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    const amountDue = claim.amount - (claim.amountPaid || 0);
    if (amountDue <= 0) {
      return NextResponse.json({ success: false, error: "No amount due" }, { status: 400 });
    }

    // Get client
    const client = await convex.query(api.clients.get, { id: claim.clientId });

    let paymentResult: { success: boolean; paymentId?: string; redirectUrl?: string; error?: string };

    switch (method) {
      case "card": {
        // Create Stripe payment intent
        if (!cardDetails) {
          return NextResponse.json({ success: false, error: "Card details required" }, { status: 400 });
        }

        try {
          // Import dynamically to handle if Stripe is not configured
          const { createPaymentIntent } = await import("@oryn/payments/stripe");

          const paymentIntent = await createPaymentIntent({
            amount: amountDue,
            currency: claim.currency || "USD",
            claimId: claim._id,
            userId: paymentLink.userId,
            clientId: claim.clientId,
            paymentMethods: ["card"],
            metadata: {
              paymentLinkToken: token,
              clientEmail: email || client?.email,
            },
          });

          paymentResult = {
            success: true,
            paymentId: paymentIntent.id,
          };
        } catch (err: any) {
          console.error("Stripe payment error:", err);
          return NextResponse.json({ success: false, error: err.message || "Card payment failed" }, { status: 500 });
        }
        break;
      }

      case "usdc": {
        // For USDC payments, we track the expected payment
        paymentResult = {
          success: true,
          paymentId: `usdc_${Date.now()}`,
        };
        break;
      }

      case "bank_transfer": {
        // For bank transfers, we create a pending payment record
        paymentResult = {
          success: true,
          paymentId: `bank_${Date.now()}`,
        };
        break;
      }

      default:
        return NextResponse.json({ success: false, error: "Invalid payment method" }, { status: 400 });
    }

    if (paymentResult.success && paymentResult.paymentId) {
      // Create payment record
      const paymentId = await convex.mutation(api.payments.create, {
        claimId: claim._id,
        userId: paymentLink.userId,
        clientId: claim.clientId,
        amount: amountDue,
        currency: claim.currency || "USD",
        method: method,
        status: method === "bank_transfer" ? "pending" : "completed",
        stripePaymentIntentId: method === "card" ? paymentResult.paymentId : undefined,
        metadata: {
          paymentLinkToken: token,
          clientEmail: email,
          walletAddress: walletAddress,
        },
      });

      // Mark payment link as used
      await convex.mutation(api.paymentLinks.markUsed, {
        token,
        paymentId,
      });

      // Update claim amount paid
      await convex.mutation(api.claims.recordPayment, {
        id: claim._id,
        amount: amountDue,
        paymentId,
      });

      // Send payment received notification
      try {
        const appUrl = process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_APP_URL;
        if ((email || client?.email) && appUrl) {
          await fetch(`${appUrl}/api/email/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "payment_received",
              claimId: claim._id,
            }),
          });
        }
      } catch (e) {
        console.error("Failed to send payment confirmation email:", e);
      }

      return NextResponse.json({
        success: true,
        paymentId,
        message: method === "bank_transfer"
          ? "Bank transfer initiated. We'll confirm once received."
          : "Payment successful!",
      });
    }

    return NextResponse.json({ success: false, error: paymentResult.error || "Payment failed" }, { status: 500 });
  } catch (error: any) {
    console.error("Payment processing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
