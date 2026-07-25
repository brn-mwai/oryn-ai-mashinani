"use client";

import { ArrowLeft, Lock, Mail, Wallet, Loader2 } from "lucide-react";
import { CHAINS, type SupportedChain } from "@/components/chain-selector";

interface StepConfirmProps {
  selectedMethod: string;
  amountDue: number;
  currency: string;
  claimTitle: string;
  recipientName: string;
  // Card info
  cardNumber: string;
  // USDC info
  selectedChain: SupportedChain;
  walletAddress: string;
  walletConnected: boolean;
  // Bank info
  token: string;
  email: string;
  // Processing
  isProcessing: boolean;
  error: string;
  onConfirm: () => void;
  onBack: () => void;
}

export function StepConfirm({
  selectedMethod,
  amountDue,
  currency,
  claimTitle,
  recipientName,
  cardNumber,
  selectedChain,
  walletAddress,
  walletConnected,
  token,
  email,
  isProcessing,
  error,
  onConfirm,
  onBack,
}: StepConfirmProps) {
  const getMethodLabel = () => {
    switch (selectedMethod) {
      case "mpesa": return "M-Pesa";
      case "card": return "Credit / Debit Card";
      case "bank_transfer": return "Bank Transfer";
      case "usdc": return `USDC on ${CHAINS[selectedChain].name}`;
      default: return selectedMethod;
    }
  };

  const getMethodDetail = () => {
    switch (selectedMethod) {
      case "card":
        return cardNumber ? `**** **** **** ${cardNumber.replace(/\s/g, "").slice(-4)}` : "";
      case "bank_transfer":
        return `Ref: ${token.slice(0, 8).toUpperCase()}`;
      case "usdc":
        return walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : "Manual transfer";
      default:
        return "";
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        disabled={isProcessing}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 disabled:opacity-50"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h3 className="font-semibold text-foreground mb-4">Confirm Payment</h3>

      <div className="bg-muted border border-border p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Invoice</span>
          <span className="text-foreground font-medium">{claimTitle}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Pay to</span>
          <span className="text-foreground">{recipientName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Method</span>
          <span className="text-foreground">{getMethodLabel()}</span>
        </div>
        {getMethodDetail() && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Details</span>
            <span className="text-foreground font-mono text-xs">{getMethodDetail()}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Confirmation</span>
          <span className="text-foreground">{email}</span>
        </div>
        <div className="border-t border-border pt-3 flex justify-between">
          <span className="font-semibold text-foreground">Total</span>
          <span className="font-semibold text-foreground text-lg">
            ${amountDue.toLocaleString("en-US", { minimumFractionDigits: 2 })} {currency}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mt-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <button
        onClick={onConfirm}
        disabled={isProcessing || (selectedMethod === "usdc" && !walletConnected)}
        className={`w-full mt-6 py-4 font-medium text-sm transition-all ${
          !isProcessing && !(selectedMethod === "usdc" && !walletConnected)
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} />
            {selectedMethod === "bank_transfer" ? "Sending Instructions..." : "Processing..."}
          </span>
        ) : selectedMethod === "usdc" && !walletConnected ? (
          <span className="flex items-center justify-center gap-2">
            <Wallet size={18} />
            Connect Wallet to Pay
          </span>
        ) : selectedMethod === "bank_transfer" ? (
          <span className="flex items-center justify-center gap-2">
            <Mail size={18} />
            Request Bank Transfer Instructions
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Lock size={18} />
            Confirm & Pay ${amountDue.toFixed(2)} {currency}
          </span>
        )}
      </button>
    </div>
  );
}
