"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Button } from "@/components/ui/button";
import { IconRefresh, IconAlertCircle } from "@tabler/icons-react";

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isLoaded: isClerkLoaded } = useUser();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncAttempted, setSyncAttempted] = useState(false);

  // Check if user exists in Convex
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Function to sync user to Convex
  const syncUser = useCallback(async () => {
    if (!user?.id) return;

    setIsSyncing(true);
    setSyncError(null);

    try {
      const response = await fetch("/api/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync user");
      }

      setSyncAttempted(true);
    } catch (error: any) {
      console.error("User sync error:", error);
      setSyncError(error.message || "Failed to sync user");
    } finally {
      setIsSyncing(false);
    }
  }, [user?.id]);

  // Auto-sync user if they don't exist in Convex
  useEffect(() => {
    if (
      isClerkLoaded &&
      user?.id &&
      convexUser === null &&
      !isSyncing &&
      !syncAttempted
    ) {
      syncUser();
    }
  }, [isClerkLoaded, user?.id, convexUser, isSyncing, syncAttempted, syncUser]);

  // Redirect logic
  useEffect(() => {
    if (!isClerkLoaded) return;

    // If not logged in, redirect to sign-in
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // If user exists in Convex but hasn't completed onboarding, redirect
    if (convexUser && !convexUser.onboardingState?.completed) {
      router.push("/onboarding");
      return;
    }
  }, [isClerkLoaded, user, convexUser, router]);

  // Show loading while Clerk is loading
  if (!isClerkLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show loading while checking Convex user or syncing
  if (user && (convexUser === undefined || isSyncing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">
            {isSyncing ? "Setting up your account..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  // Show error if sync failed
  if (syncError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <div className="w-12 h-12 bg-destructive/10 flex items-center justify-center rounded-full">
            <IconAlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold">Account Setup Failed</h2>
          <p className="text-muted-foreground text-sm">{syncError}</p>
          <Button onClick={syncUser} variant="outline" className="gap-2">
            <IconRefresh size={16} />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  // If convexUser is null and sync hasn't been attempted, show loading (auto-sync will trigger)
  if (convexUser === null && !syncAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          <p className="text-muted-foreground text-sm">Setting up your account...</p>
        </div>
      </div>
    );
  }

  // If convexUser is still null after sync attempt, show retry
  if (convexUser === null && syncAttempted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 max-w-md text-center p-6">
          <div className="w-12 h-12 bg-muted flex items-center justify-center rounded-full">
            <IconAlertCircle className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">Account Setup Required</h2>
          <p className="text-muted-foreground text-sm">
            We couldn't find your account. Please try again.
          </p>
          <Button
            onClick={() => {
              setSyncAttempted(false);
              syncUser();
            }}
            variant="outline"
            className="gap-2"
          >
            <IconRefresh size={16} />
            Retry Setup
          </Button>
        </div>
      </div>
    );
  }

  // Don't render if not onboarded
  if (convexUser && !convexUser.onboardingState?.completed) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
