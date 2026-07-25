"use client";

import { useCallback, useMemo, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import Link from "next/link";
import { formatDistanceToNow, format, subDays, startOfDay, endOfDay } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  IconPlus,
  IconTrendingUp,
  IconFileText,
  IconCreditCard,
  IconWallet,
  IconClock,
  IconCheck,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const CURRENCY_CONFIG: Record<string, { symbol: string; locale: string; code: string }> = {
  USD: { symbol: "$", locale: "en-US", code: "USD" },
  EUR: { symbol: "\u20AC", locale: "de-DE", code: "EUR" },
  GBP: { symbol: "\u00A3", locale: "en-GB", code: "GBP" },
  CAD: { symbol: "C$", locale: "en-CA", code: "CAD" },
  AUD: { symbol: "A$", locale: "en-AU", code: "AUD" },
};

export default function DashboardPage() {
  const { user } = useUser();

  // Set breadcrumb
  useSetBreadcrumb([{ label: "Dashboard" }]);

  // Calculate date range (last 30 days)
  const dateRange = useMemo(() => {
    const now = new Date();
    return {
      startDate: startOfDay(subDays(now, 30)).getTime(),
      endDate: endOfDay(now).getTime(),
    };
  }, []);

  // Get user data
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const userCurrency = convexUser?.settings?.currency || "USD";
  const currencyConfig = CURRENCY_CONFIG[userCurrency] || CURRENCY_CONFIG.USD;

  // Get claims stats
  const claimsStats = useQuery(
    api.claims.getStatsWithDateRange,
    convexUser?._id ? { userId: convexUser._id, ...dateRange } : "skip"
  );

  // Get wallet overview
  const walletOverview = useQuery(
    api.wallets.getOverviewWithDateRange,
    convexUser?._id ? { userId: convexUser._id, ...dateRange } : "skip"
  );

  // Get recent claims
  const recentClaims = useQuery(
    api.claims.list,
    convexUser?._id ? { userId: convexUser._id, limit: 5 } : "skip"
  );

  // Get recent payments
  const recentPayments = useQuery(
    api.payments.getRecent,
    convexUser?._id ? { userId: convexUser._id, limit: 5 } : "skip"
  );

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: "currency",
      currency: currencyConfig.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, [currencyConfig]);

  const chartData = walletOverview?.chartData?.map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    amount: d.amount,
  })) || [];

  const hasChartData = chartData.length > 0;

  // Show loading state while user data is loading
  if (!user || convexUser === undefined) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show message if user doesn't exist in Convex yet
  if (convexUser === null) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-muted-foreground">Setting up your account...</p>
        <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/dashboard/claims">View Claims</Link>
          </Button>
          <Button className="bg-accent hover:bg-accent/90" asChild>
            <Link href="/dashboard/claims/new">
              New Claim
              <IconPlus size={16} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Chart Section - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Total Collected */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Collected</p>
            {claimsStats ? (
              <>
                <p className="text-4xl font-semibold tracking-tight text-foreground">
                  {formatCurrency(claimsStats.totalCollected || 0)}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-500 bg-emerald-500/10 px-2 py-0.5">
                    <IconTrendingUp size={14} />
                    {claimsStats.collectionRate?.toFixed(0) || "0"}% collected
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {claimsStats.activeClaims || 0} active claims
                  </span>
                </div>
              </>
            ) : (
              <>
                <Skeleton className="h-10 w-48 mb-2" />
                <Skeleton className="h-5 w-64" />
              </>
            )}
          </div>

          {/* Chart */}
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0">
              <div className="h-[280px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hasChartData ? chartData : [{ date: "", amount: 0 }]}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(value) => `${currencyConfig.symbol}${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                      formatter={(value: number) => [formatCurrency(value), "Amount"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--accent))"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                {!hasChartData && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-muted-foreground font-medium">No collection data yet</p>
                    <p className="text-sm text-muted-foreground">Add claims to see your chart</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section - 1 column */}
        <div className="space-y-4">
          <h2 className="font-semibold">Overview</h2>

          {/* Wallet Balance Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                  <IconWallet size={16} className="text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">Wallet Balance</span>
              </div>
              {walletOverview ? (
                <>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(walletOverview.wallet?.balance || 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-24 mb-1" />
                  <Skeleton className="h-4 w-32" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Claims Summary Card */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                  <IconFileText size={16} className="text-accent" />
                </div>
                <span className="text-sm text-muted-foreground">Active Claims</span>
              </div>
              {claimsStats ? (
                <>
                  <p className="text-2xl font-semibold">{claimsStats.activeClaims || 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(claimsStats.totalOwed || 0)} outstanding
                  </p>
                </>
              ) : (
                <>
                  <Skeleton className="h-8 w-12 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card>
            <CardContent className="p-4 space-y-3">
              {claimsStats ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Claims</span>
                    <span className="font-medium">{claimsStats.totalClaims || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Collected</span>
                    <span className="font-medium text-green-600">{claimsStats.collectedClaims || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Paused</span>
                    <span className="font-medium text-yellow-600">{claimsStats.pausedClaims || 0}</span>
                  </div>
                </>
              ) : (
                <>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
            <p className="text-sm text-muted-foreground">Latest claims</p>
          </CardHeader>
          <CardContent>
            {recentClaims === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentClaims?.data && recentClaims.data.length > 0 ? (
              <div className="space-y-3">
                {recentClaims.data.slice(0, 5).map((claim) => (
                  <Link
                    key={claim._id}
                    href={`/dashboard/claims/${claim._id}`}
                    className="flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 bg-muted flex items-center justify-center">
                      <IconFileText size={14} className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{claim.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(claim.amount)} • {claim.status}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-muted flex items-center justify-center mb-4">
                  <IconClock size={24} className="text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
            <p className="text-sm text-muted-foreground">Completed collections</p>
          </CardHeader>
          <CardContent>
            {recentPayments === undefined ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2">
                    <Skeleton className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPayments && recentPayments.length > 0 ? (
              <div className="space-y-3">
                {recentPayments.map((payment) => (
                  <div key={payment._id} className="flex items-center gap-3 p-2">
                    <div className="w-8 h-8 bg-accent/10 flex items-center justify-center">
                      <IconCreditCard size={14} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-accent">
                        +{formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {payment.method.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {payment.completedAt
                        ? formatDistanceToNow(new Date(payment.completedAt), { addSuffix: true })
                        : ""}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
                <IconCheck size={16} className="text-accent" />
                <span className="text-sm">No payments yet</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Get started</p>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/claims/new">
                <IconPlus size={16} className="mr-2" />
                Create New Claim
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/clients/new">
                <IconPlus size={16} className="mr-2" />
                Add New Client
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/dashboard/wallet">
                <IconWallet size={16} className="mr-2" />
                View Wallet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
