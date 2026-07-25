import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@oryn/database/server";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const DARAJA_BASE =
  process.env.DARAJA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^0[17]\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^[17]\d{8}$/.test(digits)) return "254" + digits;
  return null;
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    p(d.getMonth() + 1) +
    p(d.getDate()) +
    p(d.getHours()) +
    p(d.getMinutes()) +
    p(d.getSeconds())
  );
}

async function getAccessToken(): Promise<string> {
  const key = process.env.DARAJA_CONSUMER_KEY;
  const secret = process.env.DARAJA_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("M-Pesa is not configured");
  }

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const response = await fetch(
    `${DARAJA_BASE}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${auth}` } }
  );

  if (!response.ok) {
    throw new Error("Could not authenticate with M-Pesa");
  }

  const data = await response.json();
  return data.access_token;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { phone } = await request.json();

    const msisdn = normalisePhone(String(phone ?? ""));
    if (!msisdn) {
      return NextResponse.json(
        { success: false, error: "Enter a valid Safaricom number, for example 0712345678" },
        { status: 400 }
      );
    }

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

    const claim = await convex.query(api.claims.get, { id: paymentLink.claimId });
    if (!claim) {
      return NextResponse.json({ success: false, error: "Claim not found" }, { status: 404 });
    }

    const shortcode = process.env.DARAJA_SHORTCODE;
    const passkey = process.env.DARAJA_PASSKEY;
    const callbackUrl = process.env.DARAJA_CALLBACK_URL;
    if (!shortcode || !passkey || !callbackUrl) {
      return NextResponse.json(
        { success: false, error: "M-Pesa is not configured" },
        { status: 503 }
      );
    }

    const ts = timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
    const accessToken = await getAccessToken();

    // Daraja rejects decimals; shillings only.
    const amount = Math.max(1, Math.round(claim.amount));

    const stkResponse = await fetch(`${DARAJA_BASE}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: msisdn,
        PartyB: shortcode,
        PhoneNumber: msisdn,
        CallBackURL: callbackUrl,
        AccountReference: token.slice(0, 12),
        TransactionDesc: `Payment for ${claim.title ?? "invoice"}`.slice(0, 13),
      }),
    });

    const stkData = await stkResponse.json();

    if (!stkResponse.ok || stkData.ResponseCode !== "0") {
      return NextResponse.json(
        {
          success: false,
          error: stkData.errorMessage ?? stkData.ResponseDescription ?? "Could not start the M-Pesa prompt",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      checkoutRequestId: stkData.CheckoutRequestID,
      message: "Check your phone and enter your M-Pesa PIN",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message ?? "Failed to start M-Pesa payment" },
      { status: 500 }
    );
  }
}
