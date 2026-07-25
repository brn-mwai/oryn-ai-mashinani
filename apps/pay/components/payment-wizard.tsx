"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { StepProgressBar, type WizardStep } from "@/components/step-progress-bar";
import { StepReview } from "@/components/steps/step-review";
import { StepSelectMethod } from "@/components/steps/step-select-method";
import { StepDetails } from "@/components/steps/step-details";
import { StepConfirm } from "@/components/steps/step-confirm";
import { StepSuccess } from "@/components/steps/step-success";
import { CHAINS, type SupportedChain } from "@/components/chain-selector";
import { cn } from "@/lib/utils";

// Network configurations for wallet switching
const NETWORK_CONFIGS: Record<string, {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
}> = {
  arc: {
    chainId: "0x4CF1B2",
    chainName: "Circle Arc Testnet",
    nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 6 },
    rpcUrls: ["https://testnet-rpc.circle.com"],
    blockExplorerUrls: ["https://testnet-explorer.circle.com"],
  },
  base: {
    chainId: "0x2105",
    chainName: "Base",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.base.org"],
    blockExplorerUrls: ["https://basescan.org"],
  },
  polygon: {
    chainId: "0x89",
    chainName: "Polygon",
    nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
    rpcUrls: ["https://polygon-rpc.com"],
    blockExplorerUrls: ["https://polygonscan.com"],
  },
  arbitrum: {
    chainId: "0xa4b1",
    chainName: "Arbitrum One",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://arb1.arbitrum.io/rpc"],
    blockExplorerUrls: ["https://arbiscan.io"],
  },
  optimism: {
    chainId: "0xa",
    chainName: "OP Mainnet",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://mainnet.optimism.io"],
    blockExplorerUrls: ["https://optimistic.etherscan.io"],
  },
  ethereum: {
    chainId: "0x1",
    chainName: "Ethereum Mainnet",
    nativeCurrency: { name: "Ethereum", symbol: "ETH", decimals: 18 },
    rpcUrls: ["https://eth.llamarpc.com"],
    blockExplorerUrls: ["https://etherscan.io"],
  },
  avalanche: {
    chainId: "0xa86a",
    chainName: "Avalanche C-Chain",
    nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
    rpcUrls: ["https://api.avax.network/ext/bc/C/rpc"],
    blockExplorerUrls: ["https://snowtrace.io"],
  },
};

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
    walletAddress?: string;
    imageUrl?: string;
  };
  customMessage?: string;
  methods: string[];
  error?: string;
}

interface PaymentWizardProps {
  paymentData: PaymentLinkData;
  token: string;
}

export function PaymentWizard({ paymentData, token }: PaymentWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("review");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const stepRef = useRef<HTMLDivElement>(null);

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  // Wallet state
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [email, setEmail] = useState(paymentData.client?.email || "");

  // Chain selection state
  const [selectedChain, setSelectedChain] = useState<SupportedChain>("arc");

  const recipientAddress = paymentData?.recipient?.walletAddress;
  const amountDue = (paymentData.claim?.amount || 0) - (paymentData.claim?.amountPaid || 0);
  const methods = paymentData.methods?.length > 0 ? paymentData.methods : ["mpesa", "card", "bank_transfer", "usdc"];

  // Check wallet on mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // Focus management on step change
  useEffect(() => {
    if (stepRef.current) {
      const heading = stepRef.current.querySelector("h2, h3");
      if (heading instanceof HTMLElement) {
        heading.focus();
      }
    }
  }, [currentStep]);

  const goTo = useCallback((step: WizardStep, dir: "forward" | "backward" = "forward") => {
    setDirection(dir);
    setCurrentStep(step);
    setError("");
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setWalletConnected(true);
        }
      } catch {
        // Wallet not available
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined") {
      setError("Please use a web browser to connect your wallet.");
      return;
    }

    const ethereum = (window as any).ethereum;

    if (!ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      setError("MetaMask is not installed. Please install MetaMask to pay with USDC.");
      return;
    }

    setIsConnecting(true);
    setError("");

    try {
      let accounts: string[] = [];
      try {
        accounts = await ethereum.request({ method: "eth_accounts" });
      } catch {
        // Ignore
      }

      if (!accounts || accounts.length === 0) {
        try {
          accounts = await ethereum.request({ method: "eth_requestAccounts" });
        } catch (requestError: any) {
          if (requestError.code === 4001) {
            throw new Error("Connection rejected. Please approve the connection in MetaMask.");
          } else if (requestError.code === -32002) {
            throw new Error("A connection request is already pending. Please open MetaMask and approve the request.");
          } else {
            throw requestError;
          }
        }
      }

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found. Please unlock MetaMask and try again.");
      }

      setWalletAddress(accounts[0]);
      setWalletConnected(true);

      const networkConfig = NETWORK_CONFIGS[selectedChain];
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: networkConfig.chainId }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902 || switchError.code === -32603) {
          try {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkConfig],
            });
          } catch (addError: any) {
            setError(`Please add ${networkConfig.chainName} to MetaMask manually, then try again.`);
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  const payWithUSDC = async () => {
    if (!recipientAddress) {
      setError("Recipient wallet address not configured. Please contact the sender.");
      return;
    }

    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      setError("MetaMask is not installed.");
      return;
    }

    setIsProcessing(true);
    setError("");

    const networkConfig = NETWORK_CONFIGS[selectedChain];
    const chainConfig = CHAINS[selectedChain];

    try {
      let accounts: string[];
      try {
        accounts = await ethereum.request({ method: "eth_requestAccounts" });
      } catch (reqErr: any) {
        if (reqErr.code === 4001) {
          setError("Please approve the connection request in MetaMask.");
          return;
        }
        throw reqErr;
      }

      if (!accounts || accounts.length === 0) {
        setError("No accounts found. Please unlock MetaMask.");
        return;
      }

      const userAddress = accounts[0];
      setWalletAddress(userAddress);
      setWalletConnected(true);

      const chainId = await ethereum.request({ method: "eth_chainId" });
      if (chainId !== networkConfig.chainId) {
        try {
          await ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: networkConfig.chainId }],
          });
        } catch (switchErr: any) {
          if (switchErr.code === 4902 || switchErr.code === -32603) {
            await ethereum.request({
              method: "wallet_addEthereumChain",
              params: [networkConfig],
            });
          } else if (switchErr.code === 4001) {
            setError(`Please switch to ${networkConfig.chainName} in MetaMask to continue.`);
            return;
          } else {
            throw switchErr;
          }
        }
      }

      const amountInSmallestUnit = BigInt(Math.round(amountDue * 1e6));
      const amountHex = "0x" + amountInSmallestUnit.toString(16);
      let hash: string;

      if (selectedChain === "arc") {
        hash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from: userAddress, to: recipientAddress, value: amountHex }],
        });
      } else {
        const usdcAddress = chainConfig.usdcAddress;
        if (!usdcAddress) {
          setError(`USDC not configured for ${chainConfig.name}`);
          return;
        }
        const transferFunctionSignature = "0xa9059cbb";
        const encodedRecipient = recipientAddress.slice(2).padStart(64, "0");
        const encodedAmount = amountInSmallestUnit.toString(16).padStart(64, "0");
        const data = transferFunctionSignature + encodedRecipient + encodedAmount;

        hash = await ethereum.request({
          method: "eth_sendTransaction",
          params: [{ from: userAddress, to: usdcAddress, data, value: "0x0" }],
        });
      }

      setTxHash(hash);

      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          receipt = await ethereum.request({
            method: "eth_getTransactionReceipt",
            params: [hash],
          });
        } catch {
          // Keep polling
        }
        attempts++;
      }

      await fetch(`/api/${token}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "usdc",
          email,
          transactionHash: hash,
          chain: selectedChain,
          walletAddress: userAddress,
        }),
      });

      goTo("success");
    } catch (err: any) {
      if (err.code === "ACTION_REJECTED" || err.code === 4001) {
        setError("Transaction was cancelled");
      } else {
        setError(err.message || "Payment failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/${token}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "card",
          email,
          cardDetails: {
            number: cardNumber.replace(/\s/g, ""),
            expiry: cardExpiry,
            cvc: cardCvc,
            name: cardName,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Payment failed");
      if (result.success) {
        goTo("success");
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      }
    } catch (err: any) {
      setError(err.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBankTransfer = async () => {
    if (!email) {
      setError("Please enter your email address to receive bank transfer instructions.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/${token}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "bank_transfer", email }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to request bank transfer");
      goTo("success");
    } catch (err: any) {
      setError(err.message || "Failed to initiate bank transfer request");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!mpesaPhone.trim()) {
      setError("Enter the phone number to send the prompt to");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch(`/api/${token}/mpesa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mpesaPhone }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not start the M-Pesa prompt");
      }
      goTo("success");
    } catch (err: any) {
      setError(err.message || "Could not start the M-Pesa prompt");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedMethod) return;
    if (selectedMethod === "mpesa") await handleMpesaPayment();
    else if (selectedMethod === "usdc") await payWithUSDC();
    else if (selectedMethod === "card") await handleCardPayment();
    else if (selectedMethod === "bank_transfer") await handleBankTransfer();
  };

  const animationClass = direction === "forward" ? "animate-slide-in-right" : "animate-slide-in-left";

  return (
    <div className="bg-card border border-border overflow-hidden">
      {/* Progress bar (hidden on success) */}
      {currentStep !== "success" && (
        <div className="px-6 pt-6">
          <StepProgressBar currentStep={currentStep} />
        </div>
      )}

      {/* Step content */}
      <div ref={stepRef} className={cn(animationClass)} key={currentStep}>
        {currentStep === "review" && paymentData.claim && (
          <StepReview
            claim={paymentData.claim}
            recipient={paymentData.recipient}
            customMessage={paymentData.customMessage}
            onContinue={() => goTo("method")}
          />
        )}

        {currentStep === "method" && (
          <StepSelectMethod
            methods={methods}
            selectedMethod={selectedMethod}
            recipientAddress={recipientAddress}
            onSelect={setSelectedMethod}
            onContinue={() => goTo("details")}
            onBack={() => goTo("review", "backward")}
          />
        )}

        {currentStep === "details" && selectedMethod && (
          <StepDetails
            selectedMethod={selectedMethod}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            cardExpiry={cardExpiry}
            setCardExpiry={setCardExpiry}
            cardCvc={cardCvc}
            setCardCvc={setCardCvc}
            cardName={cardName}
            setCardName={setCardName}
            email={email}
            setEmail={setEmail}
            mpesaPhone={mpesaPhone}
            setMpesaPhone={setMpesaPhone}
            selectedChain={selectedChain}
            setSelectedChain={setSelectedChain}
            walletConnected={walletConnected}
            walletAddress={walletAddress}
            isConnecting={isConnecting}
            connectWallet={connectWallet}
            recipientAddress={recipientAddress}
            amountDue={amountDue}
            token={token}
            onContinue={() => goTo("confirm")}
            onBack={() => goTo("method", "backward")}
          />
        )}

        {currentStep === "confirm" && selectedMethod && (
          <StepConfirm
            selectedMethod={selectedMethod}
            amountDue={amountDue}
            currency={paymentData.claim?.currency || "USD"}
            claimTitle={paymentData.claim?.title || "Payment"}
            recipientName={paymentData.recipient?.companyName || paymentData.recipient?.name || ""}
            cardNumber={cardNumber}
            selectedChain={selectedChain}
            walletAddress={walletAddress}
            walletConnected={walletConnected}
            token={token}
            email={email}
            isProcessing={isProcessing}
            error={error}
            onConfirm={handleConfirmPayment}
            onBack={() => goTo("details", "backward")}
          />
        )}

        {currentStep === "success" && (
          <StepSuccess
            selectedMethod={selectedMethod || ""}
            amountDue={amountDue}
            currency={paymentData.claim?.currency || "USD"}
            claimTitle={paymentData.claim?.title || "Payment"}
            recipientName={paymentData.recipient?.companyName || paymentData.recipient?.name || ""}
            email={email}
            clientEmail={paymentData.client?.email}
            token={token}
            txHash={txHash}
            selectedChain={selectedChain}
          />
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-muted border-t border-border text-center">
        <p className="text-xs text-muted-foreground">
          Secured by <span className="font-semibold text-foreground">Oryn</span> - Multi-chain USDC payments
        </p>
      </div>
    </div>
  );
}
