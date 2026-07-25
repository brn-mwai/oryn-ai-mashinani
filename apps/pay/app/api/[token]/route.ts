import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token || token.length < 10) {
      return NextResponse.json({ valid: false, error: "Invalid token", methods: [] });
    }

    // Get payment link from database
    const paymentLink = await convex.query(api.paymentLinks.getByToken, { token });

    if (!paymentLink) {
      return NextResponse.json({ valid: false, error: "Payment link not found", methods: [] });
    }

    // Check if expired
    if (paymentLink.expiresAt && paymentLink.expiresAt < Date.now()) {
      return NextResponse.json({ valid: false, expired: true, methods: [] });
    }

    // Check if already used
    if (paymentLink.status === "used") {
      return NextResponse.json({ valid: false, used: true, methods: [] });
    }

    // Get claim details
    const claim = await convex.query(api.claims.get, { id: paymentLink.claimId });
    if (!claim) {
      return NextResponse.json({ valid: false, error: "Claim not found", methods: [] });
    }

    // Get client details
    const client = await convex.query(api.clients.get, { id: claim.clientId });

    // Get recipient (user) details
    const user = await convex.query(api.users.get, { id: paymentLink.userId });

    // Track view
    await convex.mutation(api.paymentLinks.trackView, { token });

    return NextResponse.json({
      valid: true,
      claim: {
        title: claim.title,
        amount: claim.amount,
        amountPaid: claim.amountPaid || 0,
        currency: claim.currency || "USD",
        dueDate: claim.dueDate,
        description: claim.description,
      },
      client: client ? {
        name: client.name,
        email: client.email,
      } : null,
      recipient: user ? {
        name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Recipient",
        companyName: user.organizationName || null,
      } : null,
      customMessage: paymentLink.customMessage,
      methods: paymentLink.methods || ["card", "bank_transfer", "usdc"],
    });
  } catch (error: any) {
    console.error("Payment link fetch error:", error);
    return NextResponse.json({ valid: false, error: "Failed to load payment details", methods: [] });
  }
}
