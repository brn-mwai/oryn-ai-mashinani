"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconArrowLeft, IconCurrencyDollar, IconBolt, IconClock, IconTrendingUp } from "@tabler/icons-react";

const currencies = [
  { value: "USD", label: "USD", symbol: "$", name: "US Dollar" },
  { value: "EUR", label: "EUR", symbol: "€", name: "Euro" },
  { value: "GBP", label: "GBP", symbol: "£", name: "British Pound" },
  { value: "CAD", label: "CAD", symbol: "$", name: "Canadian Dollar" },
  { value: "AUD", label: "AUD", symbol: "$", name: "Australian Dollar" },
  { value: "USDC", label: "USDC", symbol: "$", name: "USD Coin (Crypto)" },
];

const escalationSchedules = [
  {
    id: "gentle",
    name: "Gentle",
    description: "Longer intervals, softer approach",
    days: [7, 14, 21, 30],
    icon: IconClock,
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Recommended for most users",
    days: [5, 10, 15, 20],
    icon: IconTrendingUp,
    recommended: true,
  },
  {
    id: "aggressive",
    name: "Aggressive",
    description: "Faster escalation for urgent collections",
    days: [3, 7, 10, 14],
    icon: IconBolt,
  },
];

export default function OnboardingPreferencesPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    currency: "USD",
    autoEscalation: true,
    escalationSchedule: "balanced",
  });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_preferences");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setFormData({
          currency: data.currency || "USD",
          autoEscalation: data.autoEscalation ?? true,
          escalationSchedule: data.escalationSchedule || "balanced",
        });
      } catch (e) {
        console.error("Failed to load saved preferences data:", e);
      }
    }
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);
    localStorage.setItem("onboarding_preferences", JSON.stringify(formData));
    router.push("/onboarding/notifications");
  };

  const handleBack = () => {
    router.push("/onboarding/business");
  };

  return (
    <OnboardingLayout
      currentStep={4}
      title="Collection preferences"
      description="Configure how Oryn handles your payment collections and follow-ups."
    >
      <div className="space-y-8">
        {/* Currency Selection */}
        <div className="space-y-3">
          <Label>Default currency</Label>
          <p className="text-sm text-muted-foreground mb-3">
            The primary currency for your invoices and payment requests.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {currencies.map((currency) => (
              <button
                key={currency.value}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, currency: currency.value }))
                }
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all",
                  formData.currency === currency.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-md font-semibold text-sm",
                    formData.currency === currency.value
                      ? "bg-accent text-accent-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {currency.symbol}
                </div>
                <div>
                  <p className="font-medium text-sm">{currency.label}</p>
                  <p className="text-xs text-muted-foreground">{currency.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Auto Escalation Toggle */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Automatic escalation</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Let Oryn automatically increase urgency on overdue payments
              </p>
            </div>
            <button
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  autoEscalation: !prev.autoEscalation,
                }))
              }
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                formData.autoEscalation ? "bg-accent" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  formData.autoEscalation && "translate-x-5"
                )}
              />
            </button>
          </div>
        </div>

        {/* Escalation Schedule */}
        {formData.autoEscalation && (
          <div className="space-y-3">
            <Label>Escalation schedule</Label>
            <p className="text-sm text-muted-foreground mb-3">
              How quickly should Oryn escalate overdue payments?
            </p>
            <div className="space-y-3">
              {escalationSchedules.map((schedule) => {
                const Icon = schedule.icon;
                const isSelected = formData.escalationSchedule === schedule.id;

                return (
                  <button
                    key={schedule.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        escalationSchedule: schedule.id,
                      }))
                    }
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                      isSelected
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon size={20} stroke={2} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-foreground">
                          {schedule.name}
                        </h3>
                        {schedule.recommended && (
                          <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {schedule.description}
                      </p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        Reminder at days: {schedule.days.join(", ")}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        isSelected
                          ? "border-accent bg-accent"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
          <IconCurrencyDollar size={20} stroke={2} className="text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Payment processing
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              We support Stripe for card payments and Circle for USDC. You&apos;ll
              connect your payment accounts in the dashboard after onboarding.
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
          onClick={handleContinue}
          disabled={isLoading}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Saving..." : "Continue"}
          <IconArrowRight size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
