"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { format } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconUser,
  IconBell,
  IconMail,
  IconMessage,
  IconBrandWhatsapp,
  IconClock,
  IconCurrencyDollar,
  IconSparkles,
  IconShield,
  IconCreditCard,
  IconCheck,
  IconAlertTriangle,
  IconChartBar,
  IconCalendarEvent,
  IconExternalLink,
  IconBuilding,
  IconWorld,
} from "@tabler/icons-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const currencies = [
  { value: "USD", label: "USD - US Dollar", symbol: "$" },
  { value: "EUR", label: "EUR - Euro", symbol: "€" },
  { value: "GBP", label: "GBP - British Pound", symbol: "£" },
  { value: "CAD", label: "CAD - Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "AUD - Australian Dollar", symbol: "A$" },
];

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Central Europe (CET)" },
  { value: "Asia/Tokyo", label: "Japan (JST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST)" },
  { value: "Pacific/Auckland", label: "New Zealand (NZST)" },
];

const aiModels = [
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash", description: "Fast & efficient" },
  { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro", description: "Smart & capable" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", description: "High quality" },
  { value: "claude-haiku", label: "Claude Haiku", description: "Quick responses" },
];

const escalationSchedules = [
  { value: "gentle", label: "Gentle", description: "7, 14, 21, 30 days", delayDays: [7, 14, 21, 30] },
  { value: "balanced", label: "Balanced", description: "5, 10, 15, 20 days", delayDays: [5, 10, 15, 20] },
  { value: "aggressive", label: "Aggressive", description: "3, 7, 10, 14 days", delayDays: [3, 7, 10, 14] },
];

function getEscalationDelayDays(value: string): number[] {
  const schedule = escalationSchedules.find((s) => s.value === value);
  return schedule?.delayDays ?? [5, 10, 15, 20]; // Default to balanced
}

export default function SettingsPage() {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const usageStats = useQuery(
    api.users.getUsageStats,
    convexUser?._id ? { id: convexUser._id } : "skip"
  );

  const updateSettings = useMutation(api.users.updateSettings);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    deliveryConfirmations: true,
    timezone: "America/New_York",
    currency: "USD",
    preferredAiModel: "gemini-2.0-flash",
    autoEscalation: true,
    escalationSchedule: "balanced",
  });

  useEffect(() => {
    if (convexUser?.settings) {
      setSettings({
        emailNotifications: convexUser.settings.emailNotifications ?? true,
        smsNotifications: convexUser.settings.smsNotifications ?? true,
        whatsappNotifications: convexUser.settings.whatsappNotifications ?? true,
        deliveryConfirmations: convexUser.settings.deliveryConfirmations ?? true,
        timezone: convexUser.settings.timezone ?? "America/New_York",
        currency: convexUser.settings.currency ?? "USD",
        preferredAiModel: convexUser.settings.preferredAiModel ?? "gemini-2.0-flash",
        autoEscalation: convexUser.settings.autoEscalation ?? true,
        escalationSchedule: typeof convexUser.settings.escalationSchedule === "string"
          ? convexUser.settings.escalationSchedule
          : "balanced",
      });
    }
  }, [convexUser]);

  const handleSave = async () => {
    if (!convexUser?._id) return;

    setSaving(true);
    try {
      await updateSettings({
        id: convexUser._id,
        settings: {
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          whatsappNotifications: settings.whatsappNotifications,
          deliveryConfirmations: settings.deliveryConfirmations,
          timezone: settings.timezone,
          currency: settings.currency as "USD" | "EUR" | "GBP" | "CAD" | "AUD",
          preferredAiModel: settings.preferredAiModel as "gemini-2.0-flash" | "gemini-1.5-pro" | "gpt-4o" | "gpt-4o-mini" | "claude-sonnet-4-20250514" | "claude-haiku" | "llama-3.3-70b" | "llama-4-scout" | "ocr-groq",
          autoEscalation: settings.autoEscalation,
          escalationSchedule: { delayDays: getEscalationDelayDays(settings.escalationSchedule) },
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min(Math.round((current / limit) * 100), 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-accent";
  };

  const isLoading = !convexUser;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your account preferences and configurations
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90"
          onClick={handleSave}
          disabled={saving || isLoading}
        >
          {saving ? (
            "Saving..."
          ) : saved ? (
            <>
              <IconCheck size={16} className="mr-2" />
              Saved!
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser size={20} />
              Profile
            </CardTitle>
            <CardDescription>
              Your personal information synced from your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground text-xs">First Name</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input value={convexUser?.firstName || ""} disabled className="mt-1 bg-muted" />
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Last Name</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input value={convexUser?.lastName || ""} disabled className="mt-1 bg-muted" />
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Email</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input value={convexUser?.email || ""} disabled className="mt-1 bg-muted" />
                )}
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Phone</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input value={convexUser?.phone || "Not set"} disabled className="mt-1 bg-muted" />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <IconExternalLink size={14} />
              <span>Profile information is managed through your Clerk account</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBell size={20} />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <IconMail size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates and alerts via email</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, emailNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <IconMessage size={18} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">SMS Notifications</p>
                    <p className="text-sm text-muted-foreground">Get critical alerts via text message</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, smsNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconBrandWhatsapp size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">WhatsApp Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive updates via WhatsApp</p>
                  </div>
                </div>
                <Switch
                  checked={settings.whatsappNotifications}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, whatsappNotifications: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between p-3 border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                    <IconCheck size={18} className="text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">Delivery Confirmations</p>
                    <p className="text-sm text-muted-foreground">Get notified when messages are delivered</p>
                  </div>
                </div>
                <Switch
                  checked={settings.deliveryConfirmations}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, deliveryConfirmations: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconWorld size={20} />
              Regional Preferences
            </CardTitle>
            <CardDescription>
              Configure your regional and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <IconCurrencyDollar size={16} />
                  Default Currency
                </Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => setSettings({ ...settings, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <span className="font-mono w-6">{c.symbol}</span>
                          {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <IconClock size={16} />
                  Timezone
                </Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => setSettings({ ...settings, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSparkles size={20} />
              AI & Automation
            </CardTitle>
            <CardDescription>
              Configure AI model preferences and automation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="mb-2 block">Preferred AI Model</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiModels.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => setSettings({ ...settings, preferredAiModel: model.value })}
                    className={`p-3 border text-left transition-all ${
                      settings.preferredAiModel === model.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <p className="font-medium">{model.label}</p>
                    <p className="text-sm text-muted-foreground">{model.description}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Used for message generation, document parsing, and AI suggestions
              </p>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium">Auto-Escalation</p>
                  <p className="text-sm text-muted-foreground">
                    Automatically escalate claims based on your schedule
                  </p>
                </div>
                <Switch
                  checked={settings.autoEscalation}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoEscalation: checked })
                  }
                />
              </div>

              {settings.autoEscalation && (
                <div>
                  <Label className="mb-2 block">Escalation Schedule</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {escalationSchedules.map((schedule) => (
                      <button
                        key={schedule.value}
                        onClick={() => setSettings({ ...settings, escalationSchedule: schedule.value })}
                        className={`p-3 border text-left transition-all ${
                          settings.escalationSchedule === schedule.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <p className="font-medium">{schedule.label}</p>
                        <p className="text-xs text-muted-foreground">{schedule.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage & Limits */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconChartBar size={20} />
              Usage & Limits
            </CardTitle>
            <CardDescription>
              Track your current usage against your plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageStats?.limits ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Claims This Month</p>
                      <span className="text-xs font-medium">
                        {usageStats.currentUsage.claimsCreated} / {usageStats.limits.monthlyClaimsLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getUsageColor(usageStats.percentages?.claims || 0)} transition-all`}
                        style={{ width: `${usageStats.percentages?.claims || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">AI Actions</p>
                      <span className="text-xs font-medium">
                        {usageStats.currentUsage.aiActionsUsed} / {usageStats.limits.aiActionsLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getUsageColor(usageStats.percentages?.aiActions || 0)} transition-all`}
                        style={{ width: `${usageStats.percentages?.aiActions || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Team Members</p>
                      <span className="text-xs font-medium">
                        1 / {usageStats.limits.teamMembersLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${(1 / usageStats.limits.teamMembersLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                  <IconCalendarEvent size={16} />
                  <span>
                    Usage resets on {format(new Date(usageStats.currentUsage.resetDate), "MMMM d, yyyy")}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>Complete onboarding to see usage limits</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconCreditCard size={20} />
              Subscription
            </CardTitle>
            <CardDescription>
              Your current plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <IconBuilding size={24} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-lg capitalize">
                    {convexUser?.subscriptionTier || "Starter"} Plan
                  </p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {convexUser?.userType ? `${convexUser.userType} account` : "Free tier"}
                  </p>
                </div>
              </div>
              <Button variant="outline">
                Upgrade Plan
                <IconExternalLink size={16} className="ml-2" />
              </Button>
            </div>

            {convexUser?.limits && (
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-3">
                  <p className="text-2xl font-semibold">{convexUser.limits.monthlyClaimsLimit}</p>
                  <p className="text-xs text-muted-foreground">Claims/month</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-2xl font-semibold">{convexUser.limits.aiActionsLimit}</p>
                  <p className="text-xs text-muted-foreground">AI Actions/month</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-2xl font-semibold">{convexUser.limits.teamMembersLimit}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-2xl font-semibold">{convexUser.limits.channels?.length || 1}</p>
                  <p className="text-xs text-muted-foreground">Channels</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield size={20} />
              Identity Verification (KYC)
            </CardTitle>
            <CardDescription>
              Verify your identity to unlock higher withdrawal limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  convexUser?.kycStatus === "verified"
                    ? "bg-green-100 dark:bg-green-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}>
                  {convexUser?.kycStatus === "verified" ? (
                    <IconCheck size={24} className="text-green-600" />
                  ) : (
                    <IconAlertTriangle size={24} className="text-yellow-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {convexUser?.kycStatus === "verified"
                      ? "Verified"
                      : convexUser?.kycStatus === "pending"
                        ? "Pending Review"
                        : "Not Started"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {convexUser?.kycStatus === "verified"
                      ? "You have full access to all features"
                      : "Required for withdrawals above $1,000"}
                  </p>
                </div>
              </div>
              {convexUser?.kycStatus !== "verified" && (
                <Button variant="outline">
                  {convexUser?.kycStatus === "pending" ? "Check Status" : "Start Verification"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <IconAlertTriangle size={20} />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-900">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
