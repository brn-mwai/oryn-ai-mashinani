"use client";

import { ArrowLeft } from "lucide-react";
import { CardIcons, BankIcon, USDCIcon } from "@/components/payment-icons";

interface StepSelectMethodProps {
  methods: string[];
  selectedMethod: string | null;
  recipientAddress?: string;
  onSelect: (method: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepSelectMethod({
  methods,
  selectedMethod,
  recipientAddress,
  onSelect,
  onContinue,
  onBack,
}: StepSelectMethodProps) {
  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      <h3 className="font-medium text-foreground mb-4">Select Payment Method</h3>
      <div className="space-y-3">
        {methods.includes("mpesa") && (
          <button
            onClick={() => onSelect("mpesa")}
            className={`w-full p-4 border flex items-center gap-4 transition-all ${
              selectedMethod === "mpesa"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="w-10 h-10 flex items-center justify-center bg-[#43B02A] text-white text-xs font-semibold shrink-0">
              M
            </div>
            <div className="text-left flex-1">
              <p className="font-medium text-foreground">M-Pesa</p>
              <p className="text-sm text-muted-foreground">Pay by STK push to your phone</p>
            </div>
          </button>
        )}

        {methods.includes("card") && (
          <button
            onClick={() => onSelect("card")}
            className={`w-full p-4 border flex items-center gap-4 transition-all ${
              selectedMethod === "card"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
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
            onClick={() => onSelect("bank_transfer")}
            className={`w-full p-4 border flex items-center gap-4 transition-all ${
              selectedMethod === "bank_transfer"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
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
            onClick={() => onSelect("usdc")}
            disabled={!recipientAddress}
            className={`w-full p-4 border flex items-center gap-4 transition-all ${
              !recipientAddress
                ? "border-border opacity-50 cursor-not-allowed"
                : selectedMethod === "usdc"
                ? "border-accent bg-accent/5"
                : "border-border hover:border-accent/50"
            }`}
          >
            <USDCIcon />
            <div className="text-left flex-1">
              <p className="font-medium text-foreground">USDC Stablecoin</p>
              <p className="text-sm text-muted-foreground">
                {recipientAddress ? "7 networks available - Low fees" : "Recipient wallet not configured"}
              </p>
            </div>
            {recipientAddress && (
              <span className="text-[10px] font-semibold px-2 py-1 bg-accent/20 text-accent">
                Recommended
              </span>
            )}
          </button>
        )}
      </div>

      <button
        onClick={onContinue}
        disabled={!selectedMethod}
        className={`w-full mt-6 py-4 font-medium text-sm transition-all ${
          selectedMethod
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        Continue
      </button>
    </div>
  );
}
