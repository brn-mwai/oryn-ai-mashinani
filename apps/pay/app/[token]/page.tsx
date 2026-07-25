"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CreditCard,
  Building2,
  Coins,
  Check,
  X,
  Loader2,
  Lock,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Receipt,
  Mail,
} from "lucide-react";

interface PaymentLinkData {
  valid: boolean;
  expired?: boolean;
  used?: boolean;
  claim?: {
    title: string;
    amount: number;
    amountPaid: number;
    currency: string;
    dueDate?: number;
    description?: string;
  };
  client?: {
    name: string;
    email?: string;
  };
  recipient?: {
    name: string;
    companyName?: string;
  };
  customMessage?: string;
  methods: string[];
  error?: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  processingTime: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "card",
    name: "Credit/Debit Card",
    icon: CreditCard,
    description: "Visa, Mastercard, Amex",
    processingTime: "Instant",
  },
  {
    id: "bank_transfer",
    name: "Bank Transfer",
    icon: Building2,
    description: "ACH or Wire Transfer",
    processingTime: "1-3 business days",
  },
  {
    id: "usdc",
    name: "USDC",
    icon: Coins,
    description: "Pay with stablecoin",
    processingTime: "Instant",
  },
];

export default function PaymentPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState<PaymentLinkData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [error, setError] = useState("");

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [email, setEmail] = useState("");

  // USDC wallet address
  const [usdcAddress, setUsdcAddress] = useState("");

  useEffect(() => {
    fetchPaymentData();
  }, [token]);

  const fetchPaymentData = async () => {
    try {
      const response = await fetch(`/api/${token}`);
      const data = await response.json();
      setPaymentData(data);

      if (data.client?.email) {
        setEmail(data.client.email);
      }
    } catch (err) {
      setPaymentData({ valid: false, error: "Failed to load payment details", methods: [] });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/${token}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedMethod,
          email,
          cardDetails: selectedMethod === "card" ? {
            number: cardNumber.replace(/\s/g, ""),
            expiry: cardExpiry,
            cvc: cardCvc,
            name: cardName,
          } : undefined,
          walletAddress: selectedMethod === "usdc" ? usdcAddress : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Payment failed");
      }

      if (result.success) {
        setPaymentSuccess(true);
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!paymentData?.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {paymentData?.expired ? (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Payment Link Expired
              </h1>
              <p className="text-gray-600 mb-6">
                This payment link has expired. Please contact the sender for a new link.
              </p>
            </>
          ) : paymentData?.used ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Already Paid
              </h1>
              <p className="text-gray-600 mb-6">
                This payment has already been completed. Thank you!
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Invalid Payment Link
              </h1>
              <p className="text-gray-600 mb-6">
                {paymentData?.error || "This payment link is not valid."}
              </p>
            </>
          )}
          <a
            href="https://oryn.cc"
            className="text-purple-600 hover:text-purple-700 text-sm"
          >
            Learn more about Oryn
          </a>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment of {formatCurrency(
              (paymentData.claim?.amount || 0) - (paymentData.claim?.amountPaid || 0),
              paymentData.claim?.currency
            )}
          </p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-900">Receipt</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Payment for</span>
                <span className="text-gray-900">{paymentData.claim?.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount</span>
                <span className="text-gray-900 font-semibold">
                  {formatCurrency(
                    (paymentData.claim?.amount || 0) - (paymentData.claim?.amountPaid || 0),
                    paymentData.claim?.currency
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Paid to</span>
                <span className="text-gray-900">
                  {paymentData.recipient?.companyName || paymentData.recipient?.name}
                </span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-500">
            A confirmation email has been sent to {email || paymentData.client?.email}
          </p>
        </div>
      </div>
    );
  }

  const amountDue = (paymentData.claim?.amount || 0) - (paymentData.claim?.amountPaid || 0);

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">O</span>
          </div>
          <p className="text-sm text-gray-500">Powered by Oryn</p>
        </div>

        {/* Payment Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Payment Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-6 text-white">
            <p className="text-purple-100 text-sm mb-1">Amount Due</p>
            <p className="text-4xl font-bold mb-2">
              {formatCurrency(amountDue, paymentData.claim?.currency)}
            </p>
            <p className="text-purple-100">
              {paymentData.claim?.title}
            </p>
            {paymentData.claim?.dueDate && (
              <p className="text-purple-200 text-sm mt-2">
                Due: {new Date(paymentData.claim.dueDate).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Recipient Info */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pay to</p>
                <p className="font-semibold text-gray-900">
                  {paymentData.recipient?.companyName || paymentData.recipient?.name}
                </p>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <ShieldCheck size={16} />
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Custom Message */}
          {paymentData.customMessage && (
            <div className="p-4 bg-purple-50 border-b border-gray-100">
              <p className="text-sm text-gray-700">
                {paymentData.customMessage}
              </p>
            </div>
          )}

          {/* Payment Methods */}
          <div className="p-6">
            <p className="font-semibold text-gray-900 mb-4">
              Select Payment Method
            </p>

            <div className="space-y-3 mb-6">
              {PAYMENT_METHODS.filter(m => paymentData.methods?.includes(m.id) || paymentData.methods?.length === 0).map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 border rounded-xl transition-all ${
                    selectedMethod === method.id
                      ? "border-purple-600 bg-purple-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    selectedMethod === method.id
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <method.icon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">
                      {method.name}
                    </p>
                    <p className="text-sm text-gray-500">{method.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{method.processingTime}</p>
                    {selectedMethod === method.id && (
                      <div className="w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center mt-1 ml-auto">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Payment Form */}
            {selectedMethod === "card" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <input
                      type="text"
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="123"
                      maxLength={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name on Card
                  </label>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {selectedMethod === "usdc" && (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                      <Coins size={14} className="text-white" />
                    </div>
                    <span className="font-semibold text-purple-900">Pay with USDC on Arc</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Send exactly <strong className="text-purple-700">{amountDue.toFixed(2)} USDC</strong> to:
                  </p>
                  <div className="bg-white rounded-lg p-3 font-mono text-xs break-all border border-purple-300 select-all cursor-pointer hover:bg-purple-50 transition-colors"
                       onClick={() => navigator.clipboard.writeText("0x93f7da1bfb0c61392e51f14f055deec5f120416c")}>
                    0x93f7da1bfb0c61392e51f14f055deec5f120416c
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Network: <strong>Circle Arc L1</strong> (sub-second finality)
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Click address to copy • Payment auto-detected
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-800">
                    <strong>How it works:</strong> Send USDC to the address above. Our AI agent will automatically detect your payment on the Arc blockchain and credit the recipient instantly.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Email (for confirmation)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}

            {selectedMethod === "bank_transfer" && (
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-600 mb-3">
                    Transfer {formatCurrency(amountDue)} to:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank Name</span>
                      <span className="font-medium">Chase Bank</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Name</span>
                      <span className="font-medium">{paymentData.recipient?.companyName || paymentData.recipient?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Routing Number</span>
                      <span className="font-mono">021000021</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Number</span>
                      <span className="font-mono">****5678</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Reference</span>
                      <span className="font-mono text-purple-600">{token.slice(0, 8)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email (for confirmation)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  />
                </div>

                <p className="text-xs text-gray-500">
                  After transferring, click &quot;Confirm Payment&quot; to notify the recipient.
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                <AlertTriangle className="text-red-600" size={20} />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
              className={`w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all ${
                selectedMethod && !isProcessing
                  ? "bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : (
                <>
                  <Lock size={20} />
                  Pay {formatCurrency(amountDue, paymentData.claim?.currency)}
                </>
              )}
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-400 text-sm">
              <ShieldCheck size={16} />
              <span>Secured by Oryn - 256-bit SSL</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-400">
            Questions? Contact{" "}
            <a href="mailto:support@oryn.cc" className="text-purple-600 hover:underline">
              support@oryn.cc
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
