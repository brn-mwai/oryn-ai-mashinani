"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@oryn/database";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  IconArrowLeft,
  IconCheck,
  IconUser,
  IconBuilding,
  IconSettings,
  IconBell,
  IconPencil,
  IconSparkles,
} from "@tabler/icons-react";

interface OnboardingData {
  userType: string;
  personal: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  business: {
    businessName: string;
    businessType: string;
    website: string;
    country: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  preferences: {
    currency: string;
    autoEscalation: boolean;
    escalationSchedule: string;
  };
  notifications: {
    channels: {
      email: boolean;
      sms: boolean;
      whatsapp: boolean;
    };
    preferences: {
      deliveryConfirmations: boolean;
      paymentAlerts: boolean;
      weeklyDigest: boolean;
    };
    timezone: string;
  };
}

const userTypeLabels: Record<string, string> = {
  freelancer: "Freelancer",
  creator: "Creator",
  consultant: "Consultant",
  saas: "SaaS / Software",
  agency: "Agency",
};

const businessTypeLabels: Record<string, string> = {
  sole_proprietorship: "Sole Proprietorship",
  llc: "LLC",
  corporation: "Corporation",
  partnership: "Partnership",
  nonprofit: "Non-profit",
  other: "Other",
};

const escalationLabels: Record<string, string> = {
  gentle: "Gentle",
  balanced: "Balanced",
  aggressive: "Aggressive",
};

export default function OnboardingReviewPage() {
  const router = useRouter();
  const { user } = useUser();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Get the Convex user by Clerk ID
  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Mutation to save onboarding data
  const saveOnboardingData = useMutation(api.users.saveOnboardingData);

  // Auto-sync user if they exist in Clerk but not in Convex
  useEffect(() => {
    async function syncUser() {
      if (user?.id && convexUser === null && !isSyncing) {
        setIsSyncing(true);
        try {
          const response = await fetch("/api/sync-user", { method: "POST" });
          if (response.ok) {
            // Refresh the page to re-fetch the user
            window.location.reload();
          }
        } catch (err) {
          console.error("Failed to sync user:", err);
        }
        setIsSyncing(false);
      }
    }
    syncUser();
  }, [user?.id, convexUser, isSyncing]);

  useEffect(() => {
    // Load all onboarding data from localStorage
    const userType = localStorage.getItem("onboarding_userType") || "";
    const personal = JSON.parse(
      localStorage.getItem("onboarding_personal") || "{}"
    );
    const business = JSON.parse(
      localStorage.getItem("onboarding_business") || "{}"
    );
    const preferences = JSON.parse(
      localStorage.getItem("onboarding_preferences") || "{}"
    );
    const notifications = JSON.parse(
      localStorage.getItem("onboarding_notifications") || "{}"
    );

    setData({
      userType,
      personal,
      business,
      preferences,
      notifications,
    });
  }, []);

  const handleComplete = async () => {
    if (!data || !agreed || !convexUser) return;

    setIsLoading(true);
    setError(null);

    try {
      // Save to Convex
      await saveOnboardingData({
        id: convexUser._id,
        userType: data.userType as "freelancer" | "agency" | "saas" | "creator" | "consultant",
        personal: {
          firstName: data.personal.firstName,
          lastName: data.personal.lastName,
          phone: data.personal.phone || undefined,
        },
        business: {
          businessName: data.business.businessName,
          businessType: data.business.businessType || undefined,
          website: data.business.website || undefined,
          country: data.business.country,
          streetAddress: data.business.streetAddress || undefined,
          city: data.business.city || undefined,
          state: data.business.state || undefined,
          zipCode: data.business.zipCode || undefined,
        },
        preferences: {
          currency: (data.preferences.currency || "USD") as "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "USDC",
          autoEscalation: data.preferences.autoEscalation ?? true,
          escalationSchedule: data.preferences.escalationSchedule || undefined,
        },
        notifications: {
          channels: {
            email: data.notifications.channels?.email ?? true,
            sms: data.notifications.channels?.sms ?? false,
            whatsapp: data.notifications.channels?.whatsapp ?? false,
          },
          preferences: {
            deliveryConfirmations: data.notifications.preferences?.deliveryConfirmations ?? true,
            paymentAlerts: data.notifications.preferences?.paymentAlerts ?? true,
            weeklyDigest: data.notifications.preferences?.weeklyDigest ?? true,
          },
          timezone: data.notifications.timezone || "America/New_York",
        },
      });

      // Clear localStorage
      localStorage.removeItem("onboarding_userType");
      localStorage.removeItem("onboarding_personal");
      localStorage.removeItem("onboarding_business");
      localStorage.removeItem("onboarding_preferences");
      localStorage.removeItem("onboarding_notifications");

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      setError(err instanceof Error ? err.message : "Failed to save your information. Please try again.");
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/onboarding/notifications");
  };

  if (!data) {
    return (
      <OnboardingLayout
        currentStep={6}
        title="Review & complete"
        description="Loading your information..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
        </div>
      </OnboardingLayout>
    );
  }

  // Show error if user exists in Clerk but not in Convex (webhook hasn't synced yet)
  if (user?.id && convexUser === null) {
    return (
      <OnboardingLayout
        currentStep={6}
        title="Account syncing..."
        description="Please wait while we set up your account."
      >
        <div className="space-y-6">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
            <IconSparkles size={20} stroke={2} className="text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Setting up your account
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Your account is being created. This usually takes just a moment.
                If this persists, please try refreshing the page or signing out and back in.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
          </div>
          <div className="flex justify-center">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Refresh page
            </Button>
          </div>
        </div>
      </OnboardingLayout>
    );
  }

  const enabledChannels = Object.entries(data.notifications?.channels || {})
    .filter(([_, enabled]) => enabled)
    .map(([channel]) => channel.charAt(0).toUpperCase() + channel.slice(1))
    .join(", ");

  return (
    <OnboardingLayout
      currentStep={6}
      title="Review & complete"
      description="Please review your information before getting started."
    >
      <div className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive text-sm">
            {error}
          </div>
        )}

        {/* User Type */}
        <ReviewSection
          icon={IconUser}
          title="Account type"
          editHref="/onboarding"
        >
          <p className="text-foreground font-medium">
            {userTypeLabels[data.userType] || data.userType}
          </p>
        </ReviewSection>

        {/* Personal Details */}
        <ReviewSection
          icon={IconUser}
          title="Personal details"
          editHref="/onboarding/personal"
        >
          <div className="space-y-1">
            <p className="text-foreground font-medium">
              {data.personal?.firstName} {data.personal?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            {data.personal?.phone && (
              <p className="text-sm text-muted-foreground">
                {data.personal.phone}
              </p>
            )}
          </div>
        </ReviewSection>

        {/* Business Details */}
        <ReviewSection
          icon={IconBuilding}
          title="Business details"
          editHref="/onboarding/business"
        >
          <div className="space-y-1">
            <p className="text-foreground font-medium">
              {data.business?.businessName || "Not provided"}
            </p>
            {data.business?.businessType && (
              <p className="text-sm text-muted-foreground">
                {businessTypeLabels[data.business.businessType]}
              </p>
            )}
            {data.business?.city && data.business?.country && (
              <p className="text-sm text-muted-foreground">
                {data.business.city}, {data.business.state}{" "}
                {data.business.country}
              </p>
            )}
          </div>
        </ReviewSection>

        {/* Collection Preferences */}
        <ReviewSection
          icon={IconSettings}
          title="Collection preferences"
          editHref="/onboarding/preferences"
        >
          <div className="space-y-1">
            <p className="text-foreground font-medium">
              {data.preferences?.currency || "USD"}
            </p>
            <p className="text-sm text-muted-foreground">
              Auto-escalation:{" "}
              {data.preferences?.autoEscalation ? "Enabled" : "Disabled"}
              {data.preferences?.autoEscalation &&
                ` (${escalationLabels[data.preferences.escalationSchedule]})`}
            </p>
          </div>
        </ReviewSection>

        {/* Notifications */}
        <ReviewSection
          icon={IconBell}
          title="Notifications"
          editHref="/onboarding/notifications"
        >
          <div className="space-y-1">
            <p className="text-foreground font-medium">
              {enabledChannels || "None selected"}
            </p>
            <p className="text-sm text-muted-foreground">
              Timezone: {data.notifications?.timezone || "Not set"}
            </p>
          </div>
        </ReviewSection>

        {/* Agreement */}
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 text-left"
          >
            <div
              className={cn(
                "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                agreed
                  ? "border-accent bg-accent text-white"
                  : "border-muted-foreground/30"
              )}
            >
              {agreed && <IconCheck size={12} stroke={3} />}
            </div>
            <p className="text-sm text-muted-foreground">
              I agree to the{" "}
              <a
                href="https://oryn.cc/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="https://oryn.cc/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </a>
              . I understand that Oryn will process payments and send
              communications on my behalf.
            </p>
          </button>
        </div>

        {/* Success Message Preview */}
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 flex items-start gap-3">
          <IconSparkles size={20} stroke={2} className="text-accent mt-0.5" />
          <div>
            <p className="font-medium text-foreground">
              You&apos;re almost ready!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              After completing setup, you&apos;ll be able to add clients, create
              payment requests, and let Oryn handle collections automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <IconArrowLeft size={16} stroke={2} className="mr-2" />
          Back
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!agreed || isLoading || !convexUser}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Setting up..." : "Complete setup"}
          <IconCheck size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}

function ReviewSection({
  icon: Icon,
  title,
  editHref,
  children,
}: {
  icon: React.ElementType;
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-muted-foreground">
        <Icon size={20} stroke={2} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          {title}
        </p>
        {children}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push(editHref)}
        className="text-muted-foreground hover:text-foreground"
      >
        <IconPencil size={16} stroke={2} />
      </Button>
    </div>
  );
}
