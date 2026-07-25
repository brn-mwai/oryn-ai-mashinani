"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  Mail,
  Building2,
  Wallet,
  Loader2,
  Check,
  Copy,
  QrCode,
} from "lucide-react";
import { ValidatedInput } from "@/components/validated-input";
import { MetaMaskLogo } from "@/components/payment-icons";
import { PaymentQRCode } from "@/components/payment-qr-code";
import { ChainSelector, CHAINS, type SupportedChain } from "@/components/chain-selector";
import { luhnCheck, detectCardBrand, isValidExpiry, isValidCvc, isValidEmail } from "@/lib/validation";

interface StepDetailsProps {
  selectedMethod: string;
  // Card state
  cardNumber: string;
  setCardNumber: (v: string) => void;
  cardExpiry: string;
  setCardExpiry: (v: string) => void;
  cardCvc: string;
  setCardCvc: (v: string) => void;
  cardName: string;
  setCardName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  mpesaPhone: string;
  setMpesaPhone: (v: string) => void;
  // USDC state
  selectedChain: SupportedChain;
  setSelectedChain: (chain: SupportedChain) => void;
  walletConnected: boolean;
  walletAddress: string;
  isConnecting: boolean;
  connectWallet: () => void;
  recipientAddress?: string;
  amountDue: number;
  token: string;
  // Navigation
  onContinue: () => void;
  onBack: () => void;
}

export function StepDetails({
  selectedMethod,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvc,
  setCardCvc,
  cardName,
  setCardName,
  email,
  setEmail,
  mpesaPhone,
  setMpesaPhone,
  selectedChain,
  setSelectedChain,
  walletConnected,
  walletAddress,
  isConnecting,
  connectWallet,
  recipientAddress,
  amountDue,
  token,
  onContinue,
  onBack,
}: StepDetailsProps) {
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const copyAddress = async () => {
    if (!recipientAddress) return;
    await navigator.clipboard.writeText(recipientAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const brand = detectCardBrand(cardNumber);

  const isCardValid =
    luhnCheck(cardNumber.replace(/\s/g, "")) &&
    isValidExpiry(cardExpiry) &&
    isValidCvc(cardCvc, brand) &&
    cardName.trim().length > 0 &&
    isValidEmail(email);

  const isValidMpesaPhone = (v: string) => /^(?:254|0)?[17]\d{8}$/.test(v.replace(/\D/g, ""));
  const isMpesaValid = isValidMpesaPhone(mpesaPhone);

  const isBankValid = isValidEmail(email);
  const isUsdcValid = isValidEmail(email) && walletConnected;

  const canContinue =
    selectedMethod === "card"
      ? isCardValid
      : selectedMethod === "mpesa"
      ? isMpesaValid
      : selectedMethod === "bank_transfer"
      ? isBankValid
      : isUsdcValid;

  return (
    <div className="p-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back
      </button>

      {selectedMethod === "mpesa" && (
        <div className="space-y-4">
          <h3 className="font-medium text-foreground mb-2">M-Pesa</h3>
          <ValidatedInput
            label="Phone Number"
            icon={<Mail size={18} />}
            value={mpesaPhone}
            onChange={setMpesaPhone}
            validate={isValidMpesaPhone}
            errorMessage="Enter a valid Safaricom number"
            type="tel"
            placeholder="0712345678"
          />
          <p className="text-sm text-muted-foreground">
            You will get a prompt on this phone. Enter your M-Pesa PIN to pay.
          </p>
        </div>
      )}

      {/* Card Payment Form */}
      {selectedMethod === "card" && (
        <div className="space-y-4">
          <h3 className="font-medium text-foreground mb-2">Card Details</h3>

          <ValidatedInput
            label="Email"
            icon={<Mail size={18} />}
            value={email}
            onChange={setEmail}
            validate={isValidEmail}
            errorMessage="Enter a valid email address"
            type="email"
            placeholder="you@example.com"
          />

          <ValidatedInput
            label="Card Number"
            icon={<CreditCard size={18} />}
            value={cardNumber}
            onChange={(v) => setCardNumber(formatCardNumber(v))}
            validate={(v) => luhnCheck(v.replace(/\s/g, ""))}
            errorMessage="Invalid card number"
            placeholder="4242 4242 4242 4242"
            maxLength={19}
          />

          <div className="grid grid-cols-2 gap-4">
            <ValidatedInput
              label="Expiry"
              value={cardExpiry}
              onChange={(v) => setCardExpiry(formatExpiry(v))}
              validate={isValidExpiry}
              errorMessage="Invalid or expired"
              placeholder="MM/YY"
              maxLength={5}
            />
            <ValidatedInput
              label="CVC"
              value={cardCvc}
              onChange={(v) => setCardCvc(v.replace(/\D/g, "").slice(0, 4))}
              validate={(v) => isValidCvc(v, brand)}
              errorMessage={`Must be ${brand === "amex" ? "4" : "3"} digits`}
              placeholder="123"
              maxLength={4}
            />
          </div>

          <ValidatedInput
            label="Name on Card"
            value={cardName}
            onChange={setCardName}
            validate={(v) => v.trim().length > 0}
            errorMessage="Name is required"
            placeholder="John Doe"
          />
        </div>
      )}

      {/* USDC Payment Details */}
      {selectedMethod === "usdc" && (
        <div className="space-y-4">
          <div className="p-4 bg-accent/10 border border-accent/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://assets.coingecko.com/coins/images/6319/small/usdc.png"
                  alt="USDC"
                  className="h-6 w-6"
                />
                <span className="font-semibold text-foreground">Pay with USDC</span>
              </div>
            </div>

            {/* Chain Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Network
              </label>
              <ChainSelector
                selectedChain={selectedChain}
                onChainSelect={setSelectedChain}
                availableChains={["arc", "base", "polygon", "arbitrum", "optimism", "avalanche", "ethereum"]}
              />
            </div>

            {walletConnected ? (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Wallet size={16} className="text-green-600" />
                  <span className="text-sm text-green-700 dark:text-green-400">Wallet Connected</span>
                </div>
                <p className="text-xs font-mono text-green-600 dark:text-green-500 mt-1">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="w-full mb-4 py-3 bg-accent text-accent-foreground font-medium flex items-center justify-center gap-3 transition-colors disabled:opacity-50 hover:bg-accent/90"
              >
                {isConnecting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Connecting to MetaMask...
                  </>
                ) : (
                  <>
                    <MetaMaskLogo size={22} />
                    Connect MetaMask
                  </>
                )}
              </button>
            )}

            <p className="text-sm text-muted-foreground mb-3">
              Send exactly <strong className="text-foreground">{amountDue.toFixed(2)} USDC</strong> to:
            </p>
            <div
              className="bg-card border border-border p-3 font-mono text-xs break-all cursor-pointer hover:bg-secondary transition-colors flex items-center justify-between gap-2"
              onClick={copyAddress}
            >
              <span className="text-foreground">{recipientAddress}</span>
              <button className="flex-shrink-0 p-1 hover:bg-accent/20 transition-colors">
                {copied ? (
                  <Check size={14} className="text-accent" />
                ) : (
                  <Copy size={14} className="text-muted-foreground" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>
                Network: <strong className="text-foreground">{CHAINS[selectedChain].name}</strong>{" "}
                ({CHAINS[selectedChain].speed === "instant" ? "instant finality" : "fast confirmation"})
              </span>
            </div>

            {/* QR Code Toggle */}
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="w-full mt-4 py-2 border border-accent/50 text-accent text-sm font-medium flex items-center justify-center gap-2 hover:bg-accent/10 transition-colors"
            >
              <QrCode size={16} />
              {showQrCode ? "Hide QR Code" : "Show QR Code for Mobile Wallet"}
            </button>

            {showQrCode && recipientAddress && (
              <div className="mt-4 flex flex-col items-center">
                <PaymentQRCode
                  recipientAddress={recipientAddress}
                  amount={amountDue}
                  size={180}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Scan with your mobile wallet to pay automatically
                </p>
              </div>
            )}
          </div>

          <ValidatedInput
            label="Your Email (for confirmation)"
            value={email}
            onChange={setEmail}
            validate={isValidEmail}
            errorMessage="Enter a valid email address"
            type="email"
            placeholder="you@example.com"
          />
        </div>
      )}

      {/* Bank Transfer Details */}
      {selectedMethod === "bank_transfer" && (
        <div className="space-y-4">
          <div className="p-4 bg-muted border border-border">
            <div className="flex items-center gap-3 mb-3">
              <Building2 className="w-5 h-5 text-accent" />
              <p className="text-sm font-medium text-foreground">
                Bank Transfer Request
              </p>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              We will send the account details for transferring{" "}
              <strong className="text-foreground">${amountDue.toFixed(2)}</strong> to your email.
            </p>
            <div className="p-3 bg-accent/10 border border-accent/30">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Reference:</span>
                <span className="font-mono text-accent font-semibold">
                  {token.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Include this reference in your transfer
              </p>
            </div>
          </div>

          <ValidatedInput
            label="Your Email (required)"
            value={email}
            onChange={setEmail}
            validate={isValidEmail}
            errorMessage="Enter a valid email address"
            type="email"
            placeholder="you@example.com"
          />

          <p className="text-xs text-muted-foreground">
            Bank transfer instructions will be sent to your email within a few minutes.
          </p>
        </div>
      )}

      <button
        onClick={onContinue}
        disabled={!canContinue}
        className={`w-full mt-6 py-4 font-medium text-sm transition-all ${
          canContinue
            ? "bg-accent text-accent-foreground hover:bg-accent/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        }`}
      >
        Review & Confirm
      </button>
    </div>
  );
}
