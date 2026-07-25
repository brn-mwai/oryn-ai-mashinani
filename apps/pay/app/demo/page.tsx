"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { CheckCircle, Clock, AlertCircle, Copy, Check, Landmark, Moon, Sun } from "lucide-react";

// Mock data for demo
const mockData = {
  claim: {
    title: "Invoice #INV-2024-001",
    amount: 1500,
    amountPaid: 0,
    currency: "USD",
    dueDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    description: "Website Development Services - January 2024",
  },
  client: {
    name: "Acme Corporation",
    email: "billing@acme.com",
  },
  recipient: {
    name: "John Developer",
    companyName: "DevStudio Inc.",
  },
  customMessage: "Thank you for your business! Please complete the payment at your earliest convenience.",
  methods: ["card", "bank_transfer", "usdc"],
};

const ARC_WALLET_ADDRESS = "0x93f7da1bfb0c61392e51f14f055deec5f120416c";

// Oryn Logo Component
const OrynLogo = ({ className = "h-8" }: { className?: string }) => {
  const { resolvedTheme } = useTheme();
  const fillColor = resolvedTheme === "dark" ? "#ffffff" : "#1A2B32";

  return (
    <svg className={className} viewBox="0 0 410 133" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M55.5 10.5C86.1518 10.5 111 35.5721 111 66.5C111 97.4279 86.1518 122.5 55.5 122.5C24.8482 122.5 0 97.4279 0 66.5C0 35.5721 24.8482 10.5 55.5 10.5ZM91.3887 30.0459C79.3711 18.1466 59.9824 18.2423 48.083 30.2598L19.5459 59.0811C7.64657 71.0987 7.74212 90.4874 19.7598 102.387C31.7774 114.286 51.1661 114.189 63.0654 102.172L91.6025 73.3516C103.502 61.334 103.406 41.9453 91.3887 30.0459Z" fill={fillColor}/>
      <path d="M212.77 65.75C212.77 49.8 200.01 36.93 183.95 36.93C168 36.93 155.13 49.8 155.13 65.75C155.13 81.81 168 94.57 183.95 94.57C200.01 94.57 212.77 81.81 212.77 65.75ZM229.05 65.75C229.05 74.66 226.3 84.89 218.93 93.47C215.19 97.76 211.12 101.06 206.61 103.37C197.59 107.88 189.78 108.87 183.95 108.87C158.65 108.87 138.85 90.28 138.85 65.75C138.85 41.22 158.65 22.63 183.95 22.63C193.08 22.63 206.06 25.38 216.84 35.61C223.88 42.43 229.05 53.76 229.05 65.75ZM252.881 107H237.261V43.31H252.881V52.55L253.321 52.88C257.281 44.85 262.231 41.44 269.271 41.44H271.691V57.28H266.961C262.011 56.73 252.661 62.12 252.881 70.48V107ZM321.953 43.31H338.123L305.893 129H288.953L298.743 105.57L276.303 43.31H292.473L306.883 84.78H307.543L321.953 43.31ZM359.77 69.6V107H344.15V43.31H359.77V52.44L360.32 52.66C363.84 45.29 373.08 41.11 379.57 41.44C392.44 41.44 403.22 51.78 403.22 67.51V107H387.6V69.6C387.82 60.8 378.8 55.19 373.74 55.74C369.89 55.74 366.59 57.06 363.84 59.7C361.09 62.45 359.77 65.75 359.77 69.6Z" fill={fillColor}/>
    </svg>
  );
};

// Theme Toggle Component
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useState(() => {
    setMounted(true);
  });

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="w-9 h-9 flex items-center justify-center border border-border hover:bg-secondary transition-colors"
      aria-label="Toggle theme"
    >
      {resolvedTheme === "dark" ? (
        <Sun className="w-4 h-4 text-foreground" />
      ) : (
        <Moon className="w-4 h-4 text-foreground" />
      )}
    </button>
  );
};

// Payment method icons
const CardIcons = () => (
  <div className="flex items-center gap-1">
    <img
      src="https://img.icons8.com/color/48/visa.png"
      alt="Visa"
      className="h-6 w-auto"
    />
    <img
      src="https://img.icons8.com/color/48/mastercard-logo.png"
      alt="Mastercard"
      className="h-6 w-auto"
    />
    <img
      src="https://img.icons8.com/color/48/amex.png"
      alt="Amex"
      className="h-6 w-auto"
    />
  </div>
);

const BankIcon = () => (
  <div className="w-10 h-10 bg-[#1A2B32] dark:bg-[#D2B4FA] flex items-center justify-center rounded">
    <Landmark className="w-5 h-5 text-white dark:text-[#1A2B32]" />
  </div>
);

const USDCIcon = () => (
  <img
    src="https://assets.coingecko.com/coins/images/6319/small/usdc.png"
    alt="USDC"
    className="h-10 w-10"
  />
);

export default function DemoPaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [copied, setCopied] = useState(false);

  const { claim, client, recipient, customMessage, methods } = mockData;
  const amountDue = claim.amount - claim.amountPaid;
  const isOverdue = claim.dueDate && claim.dueDate < Date.now();

  const copyAddress = async () => {
    await navigator.clipboard.writeText(ARC_WALLET_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setIsComplete(true);
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-card border border-border shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#D2B4FA]/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-[#D2B4FA]" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">Payment Successful</h1>
          <p className="text-muted-foreground mb-6">
            Thank you for your payment of ${amountDue.toFixed(2)} {claim.currency}.
          </p>
          <p className="text-sm text-muted-foreground">
            A confirmation has been sent to {client?.email}
          </p>
          <div className="mt-6 p-4 bg-secondary border border-border">
            <p className="text-xs text-muted-foreground">Transaction ID</p>
            <p className="font-mono text-sm text-foreground">demo_txn_{Date.now()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="bg-[#D2B4FA] text-[#1A2B32] text-center py-2 text-sm font-medium">
        Demo Mode - This is a preview of the payment experience
      </div>

      <div className="max-w-lg mx-auto p-4 py-8">
        {/* Header with Logo and Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <OrynLogo className="h-6" />
          <ThemeToggle />
        </div>

        {/* Recipient Info */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            {recipient?.companyName || recipient?.name || "Payment Request"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Secure Payment Portal</p>
        </div>

        {/* Payment Card */}
        <div className="bg-card border border-border shadow-sm">
          {/* Amount Section */}
          <div className="bg-[#1A2B32] p-6 text-white">
            <p className="text-white/70 text-sm mb-1">Amount Due</p>
            <p className="text-4xl font-semibold tracking-tight">
              ${amountDue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              <span className="text-lg ml-2 opacity-70">{claim.currency}</span>
            </p>
            {isOverdue && (
              <div className="flex items-center gap-2 mt-3 text-[#D2B4FA]">
                <AlertCircle size={16} />
                <span className="text-sm">Payment overdue</span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 border-b border-border">
            <h2 className="font-semibold text-foreground mb-2">{claim.title}</h2>
            {claim.description && (
              <p className="text-muted-foreground text-sm mb-3">{claim.description}</p>
            )}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock size={14} />
              <span>
                Due: {new Date(claim.dueDate!).toLocaleDateString()}
              </span>
            </div>
            {customMessage && (
              <div className="mt-4 p-3 bg-[#D2B4FA]/10 border border-[#D2B4FA]/30 text-sm text-foreground">
                {customMessage}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            <h3 className="font-medium text-foreground mb-4">Select Payment Method</h3>
            <div className="space-y-3">
              {methods.includes("card") && (
                <button
                  onClick={() => setSelectedMethod("card")}
                  className={`w-full p-4 border flex items-center gap-4 transition-all ${
                    selectedMethod === "card"
                      ? "border-[#D2B4FA] bg-[#D2B4FA]/5"
                      : "border-border hover:border-[#D2B4FA]/50"
                  }`}
                >
                  <CardIcons />
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Credit / Debit Card</p>
                    <p className="text-sm text-muted-foreground">Visa, Mastercard, Amex</p>
                  </div>
                </button>
              )}

              {methods.includes("bank_transfer") && (
                <button
                  onClick={() => setSelectedMethod("bank_transfer")}
                  className={`w-full p-4 border flex items-center gap-4 transition-all ${
                    selectedMethod === "bank_transfer"
                      ? "border-[#D2B4FA] bg-[#D2B4FA]/5"
                      : "border-border hover:border-[#D2B4FA]/50"
                  }`}
                >
                  <BankIcon />
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">ACH or Wire Transfer</p>
                  </div>
                </button>
              )}

              {methods.includes("usdc") && (
                <button
                  onClick={() => setSelectedMethod("usdc")}
                  className={`w-full p-4 border flex items-center gap-4 transition-all ${
                    selectedMethod === "usdc"
                      ? "border-[#D2B4FA] bg-[#D2B4FA]/5"
                      : "border-border hover:border-[#D2B4FA]/50"
                  }`}
                >
                  <USDCIcon />
                  <div className="text-left flex-1">
                    <p className="font-medium text-foreground">USDC on Arc</p>
                    <p className="text-sm text-muted-foreground">Pay with stablecoin • Instant settlement</p>
                  </div>
                </button>
              )}
            </div>

            {/* USDC Payment Details */}
            {selectedMethod === "usdc" && (
              <div className="mt-6 space-y-4">
                <div className="p-4 bg-[#D2B4FA]/10 border border-[#D2B4FA]/30">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://assets.coingecko.com/coins/images/6319/small/usdc.png"
                        alt="USDC"
                        className="h-6 w-6"
                      />
                      <span className="font-semibold text-foreground">Pay with USDC</span>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#00D395]/10 rounded">
                      <span className="text-xs font-semibold text-[#00D395]">Arc L1</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send exactly <strong className="text-foreground">{amountDue.toFixed(2)} USDC</strong> to:
                  </p>
                  <div
                    className="bg-card border border-border p-3 font-mono text-xs break-all cursor-pointer hover:bg-secondary transition-colors flex items-center justify-between gap-2"
                    onClick={copyAddress}
                  >
                    <span className="text-foreground">{ARC_WALLET_ADDRESS}</span>
                    <button className="flex-shrink-0 p-1 hover:bg-[#D2B4FA]/20 transition-colors">
                      {copied ? (
                        <Check size={14} className="text-[#D2B4FA]" />
                      ) : (
                        <Copy size={14} className="text-muted-foreground" />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <span className="w-2 h-2 bg-green-500 animate-pulse"></span>
                    <span>Network: <strong className="text-foreground">Circle Arc L1</strong> (sub-second finality)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing}
              className={`w-full mt-6 py-4 font-medium text-sm transition-all ${
                selectedMethod && !isProcessing
                  ? "bg-[#D2B4FA] text-[#1A2B32] hover:bg-[#D2B4FA]/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                `Pay $${amountDue.toFixed(2)} ${claim.currency}`
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-secondary border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              Secured by <span className="font-semibold text-foreground">Oryn</span> • Powered by Circle Arc
            </p>
          </div>
        </div>

        {/* Recipient Info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Payment to: {recipient?.companyName || recipient?.name}</p>
          {client && <p className="mt-1">From: {client.name}</p>}
        </div>
      </div>
    </div>
  );
}
