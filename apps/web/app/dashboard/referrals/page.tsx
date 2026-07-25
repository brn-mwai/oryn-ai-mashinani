"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconGift,
  IconCopy,
  IconCheck,
  IconMail,
  IconPencil,
  IconUsers,
  IconClock,
  IconCircleCheck,
  IconAlertCircle,
  IconWallet,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReferralsPage() {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Referrals" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Get referral stats
  const stats = useQuery(
    api.referrals.getStats,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get referral list
  const referrals = useQuery(
    api.referrals.listByReferrer,
    convexUser?._id ? { referrerId: convexUser._id } : "skip"
  );

  // Claim reward mutation
  const claimReward = useMutation(api.referrals.claimReward);

  const referralCode = convexUser?.referralCode || "loading...";
  const referralLink = `https://app.oryn.cc/refer/${referralCode}`;

  const handleClaimReward = async (referralId: string) => {
    setClaiming(referralId);
    try {
      await claimReward({ referralId: referralId as any });
    } catch (error) {
      console.error("Failed to claim reward:", error);
    } finally {
      setClaiming(null);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Referrals</h1>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <IconPencil size={16} className="mr-2" />
            Edit your referral code
          </Button>
          <Button className="bg-accent hover:bg-accent/90">
            <IconMail size={16} className="mr-2" />
            Email your Oryn referral
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Referral Program Banner - 2 columns */}
        <div className="lg:col-span-2">
          <div className="bg-accent p-8 text-accent-foreground">
            {/* Content */}
            <div>
              <div className="inline-flex items-center gap-2 bg-accent-foreground/10 backdrop-blur-sm rounded-full px-3 py-1 text-sm mb-4">
                <IconGift size={14} />
                Referral Program
              </div>
              <h2 className="text-4xl font-bold mb-2">$50</h2>
              <p className="text-xl font-medium mb-4">
                Refer a friend, earn $50
              </p>
              <p className="opacity-80 max-w-md">
                When someone you refer completes their first successful collection
                within 30 days, you both earn $50. Plus, they&apos;ll get priority
                onboarding support.
              </p>
            </div>
          </div>
        </div>

        {/* Referral Link Card - 1 column */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <IconGift size={18} className="text-accent" />
              <CardTitle className="text-base font-semibold">
                Your Referral Link
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              Share this link with friends to start earning rewards
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={referralLink}
                readOnly
                className="bg-muted text-sm font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <IconCheck size={16} className="text-green-500" />
                ) : (
                  <IconCopy size={16} />
                )}
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Share your unique referral link</li>
                <li>Friend signs up and completes a collection</li>
                <li>You both earn $50 within 30 days</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            {stats ? (
              <p className="text-3xl font-semibold mt-1">{stats.totalReferrals}</p>
            ) : (
              <Skeleton className="h-9 w-12 mt-1" />
            )}
            <p className="text-sm text-muted-foreground mt-1">
              People you&apos;ve referred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Successful</p>
            {stats ? (
              <p className="text-3xl font-semibold mt-1">{stats.completedReferrals}</p>
            ) : (
              <Skeleton className="h-9 w-12 mt-1" />
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Completed referrals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Pending</p>
            {stats ? (
              <p className="text-3xl font-semibold mt-1">{stats.pendingReferrals}</p>
            ) : (
              <Skeleton className="h-9 w-12 mt-1" />
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Awaiting completion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Total Earned</p>
              {stats && stats.unclaimedRewards > 0 && (
                <span className="text-xs bg-green-500/10 text-green-500 px-2 py-0.5 rounded">
                  ${stats.unclaimedRewards} unclaimed
                </span>
              )}
            </div>
            {stats ? (
              <p className="text-3xl font-semibold mt-1">${stats.totalEarned}</p>
            ) : (
              <Skeleton className="h-9 w-16 mt-1" />
            )}
            <p className="text-sm text-muted-foreground mt-1">From referrals</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Referral Activity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track your referral progress and earnings
          </p>
        </CardHeader>
        <CardContent>
          {referrals === undefined ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4 border">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : referrals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <IconUsers size={32} className="text-muted-foreground" />
              </div>
              <p className="text-lg font-medium">No referrals yet</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-md">
                Start sharing your referral link to earn $50 for each friend who
                joins and completes their first collection
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referrals.map((referral) => (
                <ReferralItem
                  key={referral._id}
                  referral={referral}
                  onClaim={handleClaimReward}
                  claiming={claiming === referral._id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReferralItem({
  referral,
  onClaim,
  claiming,
}: {
  referral: {
    _id: string;
    _creationTime: number;
    status: "pending" | "completed" | "expired";
    rewardAmount: number;
    rewardClaimed: boolean;
    completedAt?: number;
  };
  onClaim: (id: string) => void;
  claiming: boolean;
}) {
  const statusConfig = {
    pending: {
      icon: IconClock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      label: "Pending",
    },
    completed: {
      icon: IconCircleCheck,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      label: "Completed",
    },
    expired: {
      icon: IconAlertCircle,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      label: "Expired",
    },
  };

  const config = statusConfig[referral.status];
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center gap-4 p-4 border">
      <div className={`w-10 h-10 rounded-full ${config.bgColor} flex items-center justify-center`}>
        <StatusIcon size={20} className={config.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium">Referral</p>
          <span className={`text-xs px-2 py-0.5 rounded ${config.bgColor} ${config.color}`}>
            {config.label}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDistanceToNow(referral._creationTime, { addSuffix: true })}
          {referral.completedAt && ` • Completed ${formatDistanceToNow(referral.completedAt, { addSuffix: true })}`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold">${referral.rewardAmount}</p>
        {referral.status === "completed" && !referral.rewardClaimed && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onClaim(referral._id)}
            disabled={claiming}
            className="mt-1"
          >
            <IconWallet size={14} className="mr-1" />
            {claiming ? "Claiming..." : "Claim"}
          </Button>
        )}
        {referral.rewardClaimed && (
          <span className="text-xs text-green-500">Claimed</span>
        )}
      </div>
    </div>
  );
}
