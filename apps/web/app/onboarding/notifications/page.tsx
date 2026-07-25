"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { IconArrowRight, IconArrowLeft, IconMail, IconMessage, IconPhone, IconBell, IconCheck } from "@tabler/icons-react";

const notificationChannels = [
  {
    id: "email",
    name: "Email",
    description: "Send payment reminders via email",
    icon: IconMail,
    recommended: true,
    available: true,
  },
  {
    id: "sms",
    name: "SMS",
    description: "Text message reminders for urgent follow-ups",
    icon: IconPhone,
    recommended: false,
    available: true,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    description: "WhatsApp messages for international clients",
    icon: IconMessage,
    recommended: false,
    available: true,
  },
];

const notificationPreferences = [
  {
    id: "deliveryConfirmations",
    name: "Delivery confirmations",
    description: "Get notified when your messages are delivered",
  },
  {
    id: "paymentAlerts",
    name: "Payment alerts",
    description: "Instant notifications when clients make payments",
  },
  {
    id: "weeklyDigest",
    name: "Weekly digest",
    description: "Summary of your collection activity every week",
  },
];

export default function OnboardingNotificationsPage() {
  const router = useRouter();

  const [channels, setChannels] = useState({
    email: true,
    sms: false,
    whatsapp: false,
  });

  const [preferences, setPreferences] = useState({
    deliveryConfirmations: true,
    paymentAlerts: true,
    weeklyDigest: false,
  });

  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const [isLoading, setIsLoading] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    const saved = localStorage.getItem("onboarding_notifications");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.channels) setChannels(data.channels);
        if (data.preferences) setPreferences(data.preferences);
        if (data.timezone) setTimezone(data.timezone);
      } catch (e) {
        console.error("Failed to load saved notifications data:", e);
      }
    }
  }, []);

  const toggleChannel = (channelId: string) => {
    setChannels((prev) => ({
      ...prev,
      [channelId]: !prev[channelId as keyof typeof prev],
    }));
  };

  const togglePreference = (prefId: string) => {
    setPreferences((prev) => ({
      ...prev,
      [prefId]: !prev[prefId as keyof typeof prev],
    }));
  };

  const handleContinue = async () => {
    setIsLoading(true);
    localStorage.setItem(
      "onboarding_notifications",
      JSON.stringify({ channels, preferences, timezone })
    );
    router.push("/onboarding/review");
  };

  const handleBack = () => {
    router.push("/onboarding/preferences");
  };

  // Common timezones grouped by region
  const timezones = [
    // Americas
    { value: "America/New_York", label: "Eastern Time (ET) - New York" },
    { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
    { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
    { value: "America/Anchorage", label: "Alaska Time - Anchorage" },
    { value: "Pacific/Honolulu", label: "Hawaii Time - Honolulu" },
    { value: "America/Toronto", label: "Eastern Time (ET) - Toronto" },
    { value: "America/Vancouver", label: "Pacific Time (PT) - Vancouver" },
    { value: "America/Mexico_City", label: "Central Time - Mexico City" },
    { value: "America/Sao_Paulo", label: "Brasília Time - São Paulo" },
    { value: "America/Buenos_Aires", label: "Argentina Time - Buenos Aires" },
    // Europe
    { value: "Europe/London", label: "GMT/BST - London" },
    { value: "Europe/Paris", label: "CET - Paris" },
    { value: "Europe/Berlin", label: "CET - Berlin" },
    { value: "Europe/Amsterdam", label: "CET - Amsterdam" },
    { value: "Europe/Madrid", label: "CET - Madrid" },
    { value: "Europe/Rome", label: "CET - Rome" },
    { value: "Europe/Zurich", label: "CET - Zurich" },
    { value: "Europe/Stockholm", label: "CET - Stockholm" },
    { value: "Europe/Warsaw", label: "CET - Warsaw" },
    { value: "Europe/Moscow", label: "MSK - Moscow" },
    // Asia & Middle East
    { value: "Asia/Dubai", label: "GST - Dubai" },
    { value: "Asia/Riyadh", label: "AST - Riyadh" },
    { value: "Asia/Kolkata", label: "IST - Mumbai/Delhi" },
    { value: "Asia/Bangkok", label: "ICT - Bangkok" },
    { value: "Asia/Singapore", label: "SGT - Singapore" },
    { value: "Asia/Hong_Kong", label: "HKT - Hong Kong" },
    { value: "Asia/Shanghai", label: "CST - Shanghai/Beijing" },
    { value: "Asia/Tokyo", label: "JST - Tokyo" },
    { value: "Asia/Seoul", label: "KST - Seoul" },
    { value: "Asia/Jakarta", label: "WIB - Jakarta" },
    // Oceania
    { value: "Australia/Sydney", label: "AEST - Sydney" },
    { value: "Australia/Melbourne", label: "AEST - Melbourne" },
    { value: "Australia/Perth", label: "AWST - Perth" },
    { value: "Pacific/Auckland", label: "NZST - Auckland" },
    // Africa
    { value: "Africa/Cairo", label: "EET - Cairo" },
    { value: "Africa/Johannesburg", label: "SAST - Johannesburg" },
    { value: "Africa/Nairobi", label: "EAT - Nairobi" },
    { value: "Africa/Lagos", label: "WAT - Lagos" },
    { value: "Africa/Casablanca", label: "WET - Casablanca" },
    { value: "Africa/Accra", label: "GMT - Accra" },
  ];

  return (
    <OnboardingLayout
      currentStep={5}
      title="Notification setup"
      description="Choose how you want to send reminders to clients and receive updates."
    >
      <div className="space-y-8">
        {/* Communication Channels */}
        <div className="space-y-3">
          <Label>Communication channels</Label>
          <p className="text-sm text-muted-foreground mb-3">
            Select how Oryn will send payment reminders to your clients.
          </p>
          <div className="space-y-3">
            {notificationChannels.map((channel) => {
              const Icon = channel.icon;
              const isEnabled = channels[channel.id as keyof typeof channels];

              return (
                <button
                  key={channel.id}
                  onClick={() => toggleChannel(channel.id)}
                  disabled={!channel.available}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                    isEnabled
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-muted-foreground/30",
                    !channel.available && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                      isEnabled
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon size={20} stroke={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">
                        {channel.name}
                      </h3>
                      {channel.recommended && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {channel.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                      isEnabled
                        ? "border-accent bg-accent text-white"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isEnabled && <IconCheck size={16} stroke={2} />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Your Notifications */}
        <div className="space-y-3">
          <Label>Your notifications</Label>
          <p className="text-sm text-muted-foreground mb-3">
            How would you like to be notified about activity?
          </p>
          <div className="space-y-2">
            {notificationPreferences.map((pref) => {
              const isEnabled =
                preferences[pref.id as keyof typeof preferences];

              return (
                <button
                  key={pref.id}
                  onClick={() => togglePreference(pref.id)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left"
                >
                  <div>
                    <p className="font-medium text-sm text-foreground">
                      {pref.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {pref.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "relative w-10 h-5 rounded-full transition-colors",
                      isEnabled ? "bg-accent" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                        isEnabled && "translate-x-5"
                      )}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timezone */}
        <div className="space-y-3">
          <Label htmlFor="timezone">Timezone</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Used for scheduling reminders and reporting.
          </p>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone" className="h-11">
              <SelectValue placeholder="Select timezone..." />
            </SelectTrigger>
            <SelectContent>
              {timezones.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-3 bg-muted/50 p-4 rounded-lg">
          <IconBell size={20} stroke={2} className="text-accent mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">
              Channel setup
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              SMS and WhatsApp require additional verification in your dashboard
              settings. Email is ready to use immediately.
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
          disabled={isLoading || !Object.values(channels).some(Boolean)}
          className="bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isLoading ? "Saving..." : "Continue"}
          <IconArrowRight size={16} stroke={2} className="ml-2" />
        </Button>
      </div>
    </OnboardingLayout>
  );
}
