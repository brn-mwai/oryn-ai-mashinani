"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { format } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconWallet,
  IconArrowUpRight,
  IconArrowDownLeft,
  IconCurrencyDollar,
  IconCoin,
  IconClock,
  IconCheck,
  IconX,
  IconRefresh,
  IconLoader2,
  IconBuildingBank,
  IconCopy,
  IconExternalLink,
  IconAlertTriangle,
  IconTrendingUp,
  IconHistory,
  IconFilter,
  IconChevronDown,
  IconCircle,
  IconReceipt,
  IconPlus,
  IconSend,
  IconArrowsExchange,
  IconQrcode,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const transactionTypeIcons: Record<string, React.ElementType> = {
  deposit: IconArrowDownLeft,
  withdrawal: IconArrowUpRight,
  payment_received: IconArrowDownLeft,
  fee: IconArrowUpRight,
  refund: IconArrowDownLeft,
  transfer_in: IconArrowDownLeft,
  transfer_out: IconArrowUpRight,
  adjustment: IconRefresh,
  referral_reward: IconArrowDownLeft,
};

const transactionTypeLabels: Record<string, string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  payment_received: "Payment Received",
  fee: "Fee",
  refund: "Refund",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  adjustment: "Adjustment",
  referral_reward: "Referral Reward",
};

const transactionTypeColors: Record<string, string> = {
  deposit: "text-green-600",
  withdrawal: "text-red-600",
  payment_received: "text-green-600",
  fee: "text-red-600",
  refund: "text-green-600",
  transfer_in: "text-green-600",
  transfer_out: "text-red-600",
  adjustment: "text-blue-600",
  referral_reward: "text-green-600",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

// Blockchain icons from official sources
const BLOCKCHAIN_ICONS = {
  ARC: "https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png", // USDC/Circle
  MATIC: "https://assets.coingecko.com/coins/images/4713/small/polygon.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
  SOL: "https://assets.coingecko.com/coins/images/4128/small/solana.png",
  AVAX: "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png",
  BASE: "https://assets.coingecko.com/asset_platforms/images/131/small/base.jpeg",
  ARB: "https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg",
};

const CHAINS = [
  {
    id: "ARC",
    name: "Circle Arc",
    icon: BLOCKCHAIN_ICONS.ARC,
    description: "USDC native, instant finality",
    enabled: true,
    badge: "Recommended"
  },
  {
    id: "MATIC",
    name: "Polygon",
    icon: BLOCKCHAIN_ICONS.MATIC,
    description: "Fast, low fees",
    enabled: false,
    badge: "Coming Soon"
  },
  {
    id: "ETH",
    name: "Ethereum",
    icon: BLOCKCHAIN_ICONS.ETH,
    description: "Most secure",
    enabled: false,
    badge: "Coming Soon"
  },
  {
    id: "SOL",
    name: "Solana",
    icon: BLOCKCHAIN_ICONS.SOL,
    description: "Ultra fast",
    enabled: false,
    badge: "Coming Soon"
  },
  {
    id: "AVAX",
    name: "Avalanche",
    icon: BLOCKCHAIN_ICONS.AVAX,
    description: "Fast finality",
    enabled: false,
    badge: "Coming Soon"
  },
];

export default function WalletPage() {
  const { user } = useUser();
  const [selectedWallet, setSelectedWallet] = useState<"fiat" | "usdc">("usdc");

  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Wallet" },
  ]);

  // Dialog states
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [showCreateWalletDialog, setShowCreateWalletDialog] = useState(false);
  const [showOfframpDialog, setShowOfframpDialog] = useState(false);

  // Form states
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<"bank_transfer" | "usdc">("bank_transfer");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [txFilter, setTxFilter] = useState<string>("all");
  const [copied, setCopied] = useState(false);

  // Send form states
  const [sendAmount, setSendAmount] = useState("");
  const [sendAddress, setSendAddress] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");

  // Create wallet states - default to ARC since it's the only enabled chain
  const [newWalletChain, setNewWalletChain] = useState("ARC");
  const [newWalletName, setNewWalletName] = useState("");
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  // Offramp states
  const [offrampAmount, setOfframpAmount] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankRoutingNumber, setBankRoutingNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [bankAccountType, setBankAccountType] = useState<"checking" | "savings">("checking");
  const [isOfframping, setIsOfframping] = useState(false);

  // Selected USDC wallet for operations
  const [selectedUsdcWalletId, setSelectedUsdcWalletId] = useState<string | null>(null);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const wallets = useQuery(
    api.wallets.listByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const usdcWallets = useQuery(
    api.wallets.listUsdcWallets,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const walletOverview = useQuery(
    api.wallets.getOverview,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const fiatWallet = wallets?.find((w: { type: string }) => w.type === "fiat");
  const primaryUsdcWallet = usdcWallets?.[0];
  const currentWallet = selectedWallet === "fiat" ? fiatWallet : primaryUsdcWallet;
  const activeUsdcWallet = selectedUsdcWalletId
    ? usdcWallets?.find((w: any) => w._id === selectedUsdcWalletId)
    : primaryUsdcWallet;

  const transactions = useQuery(
    api.wallets.listTransactions,
    currentWallet?._id ? { walletId: currentWallet._id, limit: 50 } : "skip"
  );

  const requestWithdrawal = useMutation(api.wallets.requestWithdrawal);
  const ensureWallets = useMutation(api.wallets.ensureWallets);

  // Ensure user has both wallets
  useEffect(() => {
    if (convexUser?._id && wallets !== undefined) {
      const hasFiat = wallets.some((w: { type: string }) => w.type === "fiat");
      const hasUsdc = wallets.some((w: { type: string }) => w.type === "usdc");
      if (!hasFiat || !hasUsdc) {
        ensureWallets({ userId: convexUser._id });
      }
    }
  }, [convexUser?._id, wallets, ensureWallets]);

  // Set initial selected USDC wallet
  useEffect(() => {
    if (usdcWallets && usdcWallets.length > 0 && !selectedUsdcWalletId) {
      setSelectedUsdcWalletId(usdcWallets[0]._id);
    }
  }, [usdcWallets, selectedUsdcWalletId]);

  const totalUsdcBalance = usdcWallets?.reduce((sum: number, w: any) => sum + (w.balance || 0), 0) || 0;
  const totalBalance = (fiatWallet?.balance || 0) + totalUsdcBalance;
  const totalPending = (fiatWallet?.pendingBalance || 0) +
    (usdcWallets?.reduce((sum: number, w: any) => sum + (w.pendingBalance || 0), 0) || 0);
  const totalHold = (fiatWallet?.holdBalance || 0) +
    (usdcWallets?.reduce((sum: number, w: any) => sum + (w.holdBalance || 0), 0) || 0);

  const formatCurrency = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency === "USDC" ? "USD" : currency,
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleWithdraw = async () => {
    if (!convexUser?._id || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount < 10) {
      alert("Minimum withdrawal is $10");
      return;
    }

    if (amount > (currentWallet?.balance || 0)) {
      alert("Insufficient balance");
      return;
    }

    setIsWithdrawing(true);
    try {
      await requestWithdrawal({
        userId: convexUser._id,
        amount,
        method: withdrawMethod,
        destination: withdrawMethod === "bank_transfer"
          ? { type: "bank", accountLast4: "1234" }
          : { type: "wallet", address: activeUsdcWallet?.circleAddress || activeUsdcWallet?.arcAddress },
      });
      setShowWithdrawDialog(false);
      setWithdrawAmount("");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      alert("Withdrawal failed. Please try again.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleSend = async () => {
    if (!activeUsdcWallet || !sendAmount || !sendAddress) return;
    setSendError("");

    const amount = parseFloat(sendAmount);
    if (isNaN(amount) || amount <= 0) {
      setSendError("Please enter a valid amount");
      return;
    }

    if (amount > (activeUsdcWallet.balance || 0)) {
      setSendError("Insufficient balance");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: activeUsdcWallet._id,
          destinationAddress: sendAddress,
          amount,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Transfer failed");
      }

      setShowSendDialog(false);
      setSendAmount("");
      setSendAddress("");
      alert("Transfer initiated successfully!");
    } catch (error: any) {
      setSendError(error.message || "Transfer failed");
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateWallet = async () => {
    if (!newWalletChain) return;

    setIsCreatingWallet(true);
    try {
      const response = await fetch("/api/wallet/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chain: newWalletChain,
          name: newWalletName || `${newWalletChain} Wallet`,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to create wallet");
      }

      setShowCreateWalletDialog(false);
      setNewWalletChain("MATIC");
      setNewWalletName("");
      alert("Wallet created successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to create wallet");
    } finally {
      setIsCreatingWallet(false);
    }
  };

  const handleOfframp = async () => {
    if (!activeUsdcWallet || !offrampAmount || !bankAccountNumber || !bankRoutingNumber || !bankAccountName) {
      alert("Please fill in all bank details");
      return;
    }

    const amount = parseFloat(offrampAmount);
    if (isNaN(amount) || amount < 10) {
      alert("Minimum offramp amount is $10");
      return;
    }

    if (amount > (activeUsdcWallet.balance || 0)) {
      alert("Insufficient balance");
      return;
    }

    setIsOfframping(true);
    try {
      const response = await fetch("/api/wallet/offramp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletId: activeUsdcWallet._id,
          amount,
          bankDetails: {
            accountNumber: bankAccountNumber,
            routingNumber: bankRoutingNumber,
            accountType: bankAccountType,
            accountHolderName: bankAccountName,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Offramp failed");
      }

      setShowOfframpDialog(false);
      setOfframpAmount("");
      setBankAccountNumber("");
      setBankRoutingNumber("");
      setBankAccountName("");
      alert(`Offramp initiated! $${result.details.netAmount.toFixed(2)} will arrive in ${result.details.estimatedArrival}`);
    } catch (error: any) {
      alert(error.message || "Offramp failed");
    } finally {
      setIsOfframping(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const transactionsData = transactions ?? [];
  const filteredTransactions = transactionsData.filter((tx) => {
    if (txFilter === "all") return true;
    return tx.type === txFilter;
  });

  const isLoading = !convexUser || wallets === undefined;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Wallet</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your USDC wallets and earnings
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowCreateWalletDialog(true)}>
            <IconPlus size={16} className="mr-2" />
            New Wallet
          </Button>
          <Button variant="outline" onClick={() => setShowSendDialog(true)} disabled={!activeUsdcWallet}>
            <IconSend size={16} className="mr-2" />
            Send
          </Button>
          <Button variant="outline" onClick={() => setShowOfframpDialog(true)} disabled={!activeUsdcWallet}>
            <IconBuildingBank size={16} className="mr-2" />
            Offramp
          </Button>
          <Button
            className="bg-accent hover:bg-accent/90"
            onClick={() => setShowWithdrawDialog(true)}
            disabled={totalBalance < 10}
          >
            <IconArrowUpRight size={16} className="mr-2" />
            Withdraw
          </Button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Total Balance Card */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Balance</p>
                {isLoading ? (
                  <Skeleton className="h-10 w-40 mb-4" />
                ) : (
                  <p className="text-4xl font-semibold tracking-tight">
                    {formatCurrency(totalBalance)}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500" />
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? <Skeleton className="h-4 w-20 inline-block" /> : `${formatCurrency(totalPending)} pending`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500" />
                    <span className="text-sm text-muted-foreground">
                      {isLoading ? <Skeleton className="h-4 w-20 inline-block" /> : `${formatCurrency(totalHold)} on hold`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 bg-accent/10 flex items-center justify-center">
                <IconWallet size={24} className="text-accent" />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Lifetime Earnings</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(walletOverview?.totalEarnings || 0)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Withdrawn</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-lg font-semibold">
                    {formatCurrency(walletOverview?.totalWithdrawn || 0)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">USDC Wallets</p>
                {isLoading ? (
                  <Skeleton className="h-6 w-24" />
                ) : (
                  <p className="text-lg font-semibold">
                    {usdcWallets?.length || 0}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              {convexUser?.kycStatus === "verified" ? (
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <IconCheck size={20} className="text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <IconAlertTriangle size={20} className="text-yellow-600" />
                </div>
              )}
              <div>
                <p className="font-medium">
                  {convexUser?.kycStatus === "verified" ? "Verified" : "Verification Required"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {convexUser?.kycStatus === "verified"
                    ? "Unlimited transactions"
                    : "Max $1,000/transaction"}
                </p>
              </div>
            </div>
            {convexUser?.kycStatus !== "verified" && (
              <Button variant="outline" className="w-full">
                Verify Identity
                <IconExternalLink size={16} className="ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* USDC Wallets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Your USDC Wallets</h2>
          <Button variant="outline" size="sm" onClick={() => setShowCreateWalletDialog(true)}>
            <IconPlus size={14} className="mr-1" />
            Add Wallet
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </>
          ) : usdcWallets && usdcWallets.length > 0 ? (
            usdcWallets.map((wallet: any) => (
              <Card
                key={wallet._id}
                className={`cursor-pointer transition-all ${
                  selectedUsdcWalletId === wallet._id
                    ? "ring-2 ring-accent shadow-md"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => setSelectedUsdcWalletId(wallet._id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center rounded-full overflow-hidden">
                        <img
                          src={BLOCKCHAIN_ICONS[wallet.arcEnabled ? "ARC" : (wallet.circleChain as keyof typeof BLOCKCHAIN_ICONS) || "MATIC"]}
                          alt={wallet.arcEnabled ? "Circle Arc" : wallet.circleChain || "Polygon"}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="text-blue-600"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg></span>';
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{wallet.name || "USDC Wallet"}</p>
                        <p className="text-xs text-muted-foreground">
                          {wallet.arcEnabled ? "Circle Arc" : wallet.circleChain || "Polygon"}
                        </p>
                      </div>
                    </div>
                    {selectedUsdcWalletId === wallet._id && (
                      <div className="w-2 h-2 bg-accent rounded-full" />
                    )}
                  </div>

                  <p className="text-2xl font-semibold mb-3">
                    {formatCurrency(wallet.balance || 0, "USDC")}
                  </p>

                  {(wallet.arcAddress || wallet.circleAddress) && (
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate flex-1">
                        {wallet.arcAddress || wallet.circleAddress}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyAddress(wallet.arcAddress || wallet.circleAddress);
                        }}
                        className="p-1.5 hover:bg-muted rounded"
                      >
                        {copied ? (
                          <IconCheck size={14} className="text-green-600" />
                        ) : (
                          <IconCopy size={14} className="text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="col-span-full">
              <CardContent className="p-8 text-center">
                <IconWallet size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No USDC wallets yet</p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Create your first wallet to start receiving payments
                </p>
                <Button onClick={() => setShowCreateWalletDialog(true)}>
                  <IconPlus size={16} className="mr-2" />
                  Create Wallet
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Fiat Wallet */}
      <Card className="mb-8">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 flex items-center justify-center rounded-full">
                <IconCurrencyDollar size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold">USD Wallet</p>
                <p className="text-xs text-muted-foreground">Fiat Balance (for bank withdrawals)</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold">
                {formatCurrency(fiatWallet?.balance || 0)}
              </p>
              {fiatWallet?.stripeAccountStatus && (
                <span className={`text-xs flex items-center gap-1 justify-end ${
                  fiatWallet.stripeAccountStatus === "enabled" ? "text-green-600" : "text-yellow-600"
                }`}>
                  <IconCircle size={8} fill="currentColor" />
                  Stripe {fiatWallet.stripeAccountStatus}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <IconHistory size={20} />
              Transaction History
            </CardTitle>
            <CardDescription>
              Recent transactions across all wallets
            </CardDescription>
          </div>
          <Select value={txFilter} onValueChange={setTxFilter}>
            <SelectTrigger className="w-[180px]">
              <IconFilter size={16} className="mr-2" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="payment_received">Payments</SelectItem>
              <SelectItem value="withdrawal">Withdrawals</SelectItem>
              <SelectItem value="transfer_out">Transfers Out</SelectItem>
              <SelectItem value="transfer_in">Transfers In</SelectItem>
              <SelectItem value="fee">Fees</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {transactions === undefined ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <IconReceipt size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Transactions will appear here when you receive payments
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTransactions.map((tx) => {
                const Icon = transactionTypeIcons[tx.type] || IconWallet;
                const colorClass = transactionTypeColors[tx.type] || "text-gray-600";
                const isIncoming = ["deposit", "payment_received", "refund", "transfer_in", "referral_reward"].includes(tx.type);

                return (
                  <div
                    key={tx._id}
                    className="flex items-center gap-4 p-4 border hover:bg-muted/30 transition-colors rounded-lg"
                  >
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${colorClass}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {transactionTypeLabels[tx.type] || tx.type}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tx.status]}`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{format(new Date(tx.createdAt), "MMM d, yyyy 'at' h:mm a")}</span>
                        {tx.transactionHash && (
                          <>
                            <span>•</span>
                            <a
                              href={`https://polygonscan.com/tx/${tx.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-xs text-accent hover:underline"
                            >
                              {tx.transactionHash.slice(0, 8)}...
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${isIncoming ? "text-green-600" : "text-red-600"}`}>
                        {isIncoming ? "+" : "-"}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Wallet Dialog */}
      <Dialog open={showCreateWalletDialog} onOpenChange={setShowCreateWalletDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Wallet</DialogTitle>
            <DialogDescription>
              Create a new USDC wallet on your preferred blockchain
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Blockchain Network</Label>
              <div className="grid grid-cols-1 gap-2 mt-2">
                {CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => chain.enabled && setNewWalletChain(chain.id)}
                    disabled={!chain.enabled}
                    className={`p-4 border rounded-lg text-left transition-all ${
                      !chain.enabled
                        ? "opacity-50 cursor-not-allowed bg-muted/30"
                        : newWalletChain === chain.id
                        ? "border-accent bg-accent/5 ring-2 ring-accent/20"
                        : "hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        <img
                          src={chain.icon}
                          alt={chain.name}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{chain.name}</p>
                          {chain.badge && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              chain.badge === "Recommended"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            }`}>
                              {chain.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{chain.description}</p>
                      </div>
                      {newWalletChain === chain.id && chain.enabled && (
                        <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                          <IconCheck size={12} className="text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Wallet Name (optional)</Label>
              <Input
                placeholder="e.g., Trading Wallet"
                value={newWalletName}
                onChange={(e) => setNewWalletName(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWalletDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleCreateWallet}
              disabled={isCreatingWallet}
            >
              {isCreatingWallet ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <IconPlus size={16} className="mr-2" />
                  Create Wallet
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send USDC</DialogTitle>
            <DialogDescription>
              Send USDC to any wallet address
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeUsdcWallet && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">From Wallet</p>
                <p className="font-semibold">{activeUsdcWallet.name || "USDC Wallet"}</p>
                <p className="text-sm text-muted-foreground">
                  Balance: {formatCurrency(activeUsdcWallet.balance || 0, "USDC")}
                </p>
              </div>
            )}

            <div>
              <Label>Destination Address</Label>
              <Input
                placeholder="0x..."
                value={sendAddress}
                onChange={(e) => setSendAddress(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label>Amount (USDC)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  className="pl-8"
                  min="0"
                  max={activeUsdcWallet?.balance || 0}
                />
              </div>
              {activeUsdcWallet && (
                <button
                  type="button"
                  onClick={() => setSendAmount(String(activeUsdcWallet.balance || 0))}
                  className="text-xs text-accent mt-1"
                >
                  Send Max
                </button>
              )}
            </div>

            {sendError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{sendError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleSend}
              disabled={isSending || !sendAmount || !sendAddress}
            >
              {isSending ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <IconSend size={16} className="mr-2" />
                  Send USDC
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Offramp Dialog */}
      <Dialog open={showOfframpDialog} onOpenChange={setShowOfframpDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Fiat</DialogTitle>
            <DialogDescription>
              Convert USDC to USD and withdraw to your bank account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeUsdcWallet && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">From Wallet</p>
                <p className="font-semibold">{activeUsdcWallet.name || "USDC Wallet"}</p>
                <p className="text-sm text-muted-foreground">
                  Balance: {formatCurrency(activeUsdcWallet.balance || 0, "USDC")}
                </p>
              </div>
            )}

            <div>
              <Label>Amount (USDC)</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={offrampAmount}
                  onChange={(e) => setOfframpAmount(e.target.value)}
                  className="pl-8"
                  min="10"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Fee: 1.5% • Min: $10
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="font-medium mb-3">Bank Details</p>

              <div className="space-y-3">
                <div>
                  <Label>Account Holder Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={bankAccountName}
                    onChange={(e) => setBankAccountName(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Routing Number</Label>
                    <Input
                      placeholder="021000021"
                      value={bankRoutingNumber}
                      onChange={(e) => setBankRoutingNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      placeholder="••••1234"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Account Type</Label>
                  <Select value={bankAccountType} onValueChange={(v) => setBankAccountType(v as any)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checking">Checking</SelectItem>
                      <SelectItem value="savings">Savings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {offrampAmount && parseFloat(offrampAmount) >= 10 && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Amount</span>
                  <span>{formatCurrency(parseFloat(offrampAmount))}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Fee (1.5%)</span>
                  <span>-{formatCurrency(parseFloat(offrampAmount) * 0.015)}</span>
                </div>
                <div className="flex justify-between font-semibold mt-1 pt-1 border-t">
                  <span>You receive</span>
                  <span>{formatCurrency(parseFloat(offrampAmount) * 0.985)}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOfframpDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleOfframp}
              disabled={isOfframping || !offrampAmount || parseFloat(offrampAmount) < 10}
            >
              {isOfframping ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconBuildingBank size={16} className="mr-2" />
                  Convert & Withdraw
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
            <DialogDescription>
              Withdraw from your fiat wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Available Balance</p>
              <p className="text-2xl font-semibold">
                {formatCurrency(fiatWallet?.balance || 0)}
              </p>
            </div>

            <div>
              <Label>Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="pl-8"
                  min="10"
                  max={fiatWallet?.balance || 0}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Minimum withdrawal: $10</p>
            </div>

            <div>
              <Label>Withdrawal Method</Label>
              <Select value={withdrawMethod} onValueChange={(v) => setWithdrawMethod(v as "bank_transfer" | "usdc")}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">
                    <div className="flex items-center gap-2">
                      <IconBuildingBank size={16} />
                      Bank Transfer (1-3 business days)
                    </div>
                  </SelectItem>
                  <SelectItem value="usdc">
                    <div className="flex items-center gap-2">
                      <IconCoin size={16} />
                      USDC (Instant)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {convexUser?.kycStatus !== "verified" && parseFloat(withdrawAmount) > 1000 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg">
                <IconAlertTriangle size={18} className="text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    Verification Required
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-500">
                    Withdrawals over $1,000 require identity verification
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawDialog(false)}>
              Cancel
            </Button>
            <Button
              className="bg-accent hover:bg-accent/90"
              onClick={handleWithdraw}
              disabled={
                isWithdrawing ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) < 10 ||
                parseFloat(withdrawAmount) > (fiatWallet?.balance || 0) ||
                (convexUser?.kycStatus !== "verified" && parseFloat(withdrawAmount) > 1000)
              }
            >
              {isWithdrawing ? (
                <>
                  <IconLoader2 size={16} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <IconArrowUpRight size={16} className="mr-2" />
                  Withdraw {withdrawAmount ? formatCurrency(parseFloat(withdrawAmount)) : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deposit Dialog */}
      <Dialog open={showDepositDialog} onOpenChange={setShowDepositDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Funds</DialogTitle>
            <DialogDescription>
              Deposit USDC to your wallet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {activeUsdcWallet && (activeUsdcWallet.arcAddress || activeUsdcWallet.circleAddress) ? (
              <div className="text-center">
                <div className="w-48 h-48 mx-auto bg-white p-4 rounded-lg mb-4">
                  <IconQrcode size={160} className="text-gray-800" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">Send USDC to this address:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-sm bg-muted px-3 py-2 rounded max-w-[300px] truncate">
                    {activeUsdcWallet.arcAddress || activeUsdcWallet.circleAddress}
                  </code>
                  <button
                    onClick={() => copyAddress(activeUsdcWallet.arcAddress || activeUsdcWallet.circleAddress!)}
                    className="p-2 hover:bg-muted rounded"
                  >
                    {copied ? (
                      <IconCheck size={16} className="text-green-600" />
                    ) : (
                      <IconCopy size={16} className="text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Network: {activeUsdcWallet.arcEnabled ? "Circle Arc" : activeUsdcWallet.circleChain || "Polygon"}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <IconWallet size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No wallet address available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a wallet first to receive deposits
                </p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    setShowDepositDialog(false);
                    setShowCreateWalletDialog(true);
                  }}
                >
                  Create Wallet
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDepositDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
