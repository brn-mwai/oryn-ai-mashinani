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
  IconLoader2,
  IconX,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const currencies = [
  { value: "KES", label: "KES - Kenyan Shilling", symbol: "KSh" },
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
  { value: "moonshotai/kimi-k2-instruct-0905", label: "Kimi K2", description: "Agentic & tool use" },
];

const escalationSchedules = [
  { value: "gentle", label: "Gentle", description: "7, 14, 21, 30 days", delayDays: [7, 14, 21, 30] },
  { value: "balanced", label: "Balanced", description: "5, 10, 15, 20 days", delayDays: [5, 10, 15, 20] },
  { value: "aggressive", label: "Aggressive", description: "3, 7, 10, 14 days", delayDays: [3, 7, 10, 14] },
];

function getEscalationDelayDays(value: string): number[] {
  const schedule = escalationSchedules.find((s) => s.value === value);
  return schedule?.delayDays ?? [5, 10, 15, 20];
}

function getEscalationScheduleValue(delayDays?: number[]): string {
  if (!delayDays) return "balanced";
  const schedule = escalationSchedules.find(
    (s) => JSON.stringify(s.delayDays) === JSON.stringify(delayDays)
  );
  return schedule?.value ?? "balanced";
}

export default function SettingsPage() {
  const { user } = useUser();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const organization = useQuery(
    api.organizations.getByOwner,
    convexUser?._id ? { ownerId: convexUser._id } : "skip"
  );

  const usageStats = useQuery(
    api.users.getUsageStats,
    convexUser?._id ? { id: convexUser._id } : "skip"
  );

  const updateSettings = useMutation(api.users.updateSettings);
  const updateProfile = useMutation(api.users.update);
  const updateOrganizationName = useMutation(api.users.updateOrganizationName);

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    whatsappNotifications: true,
    deliveryConfirmations: true,
    timezone: "America/New_York",
    currency: "KES",
    preferredAiModel: "gemini-2.0-flash",
    autoEscalation: true,
    escalationSchedule: "balanced",
  });

  const [profile, setProfile] = useState({
    organizationName: "",
    phone: "",
  });

  useEffect(() => {
    if (convexUser) {
      if (convexUser.settings) {
        setSettings({
          emailNotifications: convexUser.settings.emailNotifications ?? true,
          smsNotifications: convexUser.settings.smsNotifications ?? true,
          whatsappNotifications: convexUser.settings.whatsappNotifications ?? true,
          deliveryConfirmations: convexUser.settings.deliveryConfirmations ?? true,
          timezone: convexUser.settings.timezone ?? "America/New_York",
          currency: convexUser.settings.currency ?? "KES",
          preferredAiModel: convexUser.settings.preferredAiModel ?? "gemini-2.0-flash",
          autoEscalation: convexUser.settings.autoEscalation ?? true,
          escalationSchedule: getEscalationScheduleValue(
            convexUser.settings.escalationSchedule?.delayDays
          ),
        });
      }
      setProfile({
        organizationName: organization?.name || "",
        phone: convexUser.phone || "",
      });
    }
  }, [convexUser, organization]);

  const handleSave = async () => {
    if (!convexUser?._id) return;

    setSaving(true);
    setError("");

    try {
      // Update settings
      await updateSettings({
        id: convexUser._id,
        settings: {
          emailNotifications: settings.emailNotifications,
          smsNotifications: settings.smsNotifications,
          whatsappNotifications: settings.whatsappNotifications,
          deliveryConfirmations: settings.deliveryConfirmations,
          timezone: settings.timezone,
          currency: settings.currency as "KES" | "USD" | "EUR" | "GBP" | "CAD" | "AUD",
          preferredAiModel: settings.preferredAiModel as any,
          autoEscalation: settings.autoEscalation,
          escalationSchedule: { delayDays: getEscalationDelayDays(settings.escalationSchedule) },
        },
      });

      // Update phone if changed
      if (profile.phone !== (convexUser.phone || "")) {
        await updateProfile({
          id: convexUser._id,
          phone: profile.phone || undefined,
        });
      }

      // Update organization name if changed
      const currentOrgName = organization?.name || "";
      if (profile.organizationName && profile.organizationName !== currentOrgName) {
        await updateOrganizationName({
          userId: convexUser._id,
          organizationName: profile.organizationName,
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-accent";
  };

  const isLoading = !convexUser;

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage your account preferences and configurations
            </p>
          </div>
          <Button
            className="bg-accent hover:bg-accent/90 w-full sm:w-auto"
            onClick={handleSave}
            disabled={saving || isLoading}
          >
            {saving ? (
              <>
                <IconLoader2 size={16} className="mr-2 animate-spin" />
                Saving...
              </>
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

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 text-sm flex items-center gap-2">
            <IconAlertTriangle size={16} />
            {error}
          </div>
        )}

        {saved && !error && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 text-sm flex items-center gap-2">
            <IconCheck size={16} />
            Settings saved successfully!
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6">
        {/* Profile Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconUser size={20} />
              Profile
            </CardTitle>
            <CardDescription>
              Your personal and business information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label className="text-muted-foreground text-xs">Phone Number</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                )}
              </div>
              <div className="sm:col-span-2">
                <Label className="text-muted-foreground text-xs">Organization / Business Name</Label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full mt-1" />
                ) : (
                  <Input
                    value={profile.organizationName}
                    onChange={(e) => setProfile({ ...profile, organizationName: e.target.value })}
                    placeholder="Your company name"
                    className="mt-1"
                  />
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2">
              <IconExternalLink size={14} />
              <span>Name and email are synced from your authentication provider</span>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconBell size={20} />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure how and when you receive notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
            <div className="flex items-center justify-between p-3 border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <IconMail size={18} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Email Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Receive updates via email</p>
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
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <IconMessage size={18} className="text-purple-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">SMS Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Get alerts via text message</p>
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
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <IconBrandWhatsapp size={18} className="text-green-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">WhatsApp Notifications</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Receive updates via WhatsApp</p>
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
                <div className="w-10 h-10 bg-accent/10 flex items-center justify-center shrink-0">
                  <IconCheck size={18} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base">Delivery Confirmations</p>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">Get notified when messages are delivered</p>
                </div>
              </div>
              <Switch
                checked={settings.deliveryConfirmations}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, deliveryConfirmations: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconWorld size={20} />
              Regional Preferences
            </CardTitle>
            <CardDescription>
              Configure your regional and display preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 mb-2 text-sm">
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
                <Label className="flex items-center gap-2 mb-2 text-sm">
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconSparkles size={20} />
              AI & Automation
            </CardTitle>
            <CardDescription>
              Configure AI model preferences and automation settings
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-6">
            <div>
              <Label className="mb-2 block text-sm">Preferred AI Model</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {aiModels.map((model) => (
                  <button
                    key={model.value}
                    type="button"
                    onClick={() => setSettings({ ...settings, preferredAiModel: model.value })}
                    className={`p-3 border text-left transition-all ${
                      settings.preferredAiModel === model.value
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-muted-foreground"
                    }`}
                  >
                    <p className="font-medium text-sm">{model.label}</p>
                    <p className="text-xs text-muted-foreground">{model.description}</p>
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
                  <p className="font-medium text-sm sm:text-base">Auto-Escalation</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
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
                  <Label className="mb-2 block text-sm">Escalation Schedule</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {escalationSchedules.map((schedule) => (
                      <button
                        key={schedule.value}
                        type="button"
                        onClick={() => setSettings({ ...settings, escalationSchedule: schedule.value })}
                        className={`p-3 border text-left transition-all ${
                          settings.escalationSchedule === schedule.value
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-muted-foreground"
                        }`}
                      >
                        <p className="font-medium text-sm">{schedule.label}</p>
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
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconChartBar size={20} />
              Usage & Limits
            </CardTitle>
            <CardDescription>
              Track your current usage against your plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
            {usageStats?.limits ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">Claims This Month</p>
                      <span className="text-xs font-medium">
                        {usageStats.currentUsage.claimsCreated} / {usageStats.limits.monthlyClaimsLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div
                        className={`h-full ${getUsageColor(usageStats.percentages?.claims || 0)} transition-all`}
                        style={{ width: `${usageStats.percentages?.claims || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">AI Actions</p>
                      <span className="text-xs font-medium">
                        {usageStats.currentUsage.aiActionsUsed} / {usageStats.limits.aiActionsLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div
                        className={`h-full ${getUsageColor(usageStats.percentages?.aiActions || 0)} transition-all`}
                        style={{ width: `${usageStats.percentages?.aiActions || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs sm:text-sm text-muted-foreground">Team Members</p>
                      <span className="text-xs font-medium">
                        1 / {usageStats.limits.teamMembersLimit}
                      </span>
                    </div>
                    <div className="h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all"
                        style={{ width: `${(1 / usageStats.limits.teamMembersLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground pt-2">
                  <IconCalendarEvent size={16} />
                  <span>
                    Usage resets on {format(new Date(usageStats.currentUsage.resetDate), "MMMM d, yyyy")}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Complete onboarding to see usage limits</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Info */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconCreditCard size={20} />
              Subscription
            </CardTitle>
            <CardDescription>
              Your current plan and billing information
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 flex items-center justify-center shrink-0">
                  <IconBuilding size={24} className="text-accent" />
                </div>
                <div>
                  <p className="font-semibold text-base sm:text-lg capitalize">
                    {convexUser?.subscriptionTier || "Starter"} Plan
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                    {convexUser?.userType ? `${convexUser.userType} account` : "Free tier"}
                  </p>
                </div>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                Upgrade Plan
                <IconExternalLink size={16} className="ml-2" />
              </Button>
            </div>

            {convexUser?.limits && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-3">
                  <p className="text-xl sm:text-2xl font-semibold">{convexUser.limits.monthlyClaimsLimit}</p>
                  <p className="text-xs text-muted-foreground">Claims/month</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-xl sm:text-2xl font-semibold">{convexUser.limits.aiActionsLimit}</p>
                  <p className="text-xs text-muted-foreground">AI Actions/month</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-xl sm:text-2xl font-semibold">{convexUser.limits.teamMembersLimit}</p>
                  <p className="text-xs text-muted-foreground">Team Members</p>
                </div>
                <div className="text-center p-3">
                  <p className="text-xl sm:text-2xl font-semibold">{convexUser.limits.channels?.length || 1}</p>
                  <p className="text-xs text-muted-foreground">Channels</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* KYC Status */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <IconShield size={20} />
              Identity Verification (KYC)
            </CardTitle>
            <CardDescription>
              Verify your identity to unlock higher withdrawal limits
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 flex items-center justify-center shrink-0 ${
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
                  <p className="font-medium text-sm sm:text-base capitalize">
                    {convexUser?.kycStatus === "verified"
                      ? "Verified"
                      : convexUser?.kycStatus === "pending"
                        ? "Pending Review"
                        : "Not Started"}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {convexUser?.kycStatus === "verified"
                      ? "You have full access to all features"
                      : "Required for withdrawals above $1,000"}
                  </p>
                </div>
              </div>
              {convexUser?.kycStatus !== "verified" && (
                <Button variant="outline" className="w-full sm:w-auto">
                  {convexUser?.kycStatus === "pending" ? "Check Status" : "Start Verification"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-red-600 text-base sm:text-lg">
              <IconAlertTriangle size={20} />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect your account
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200 dark:border-red-900">
              <div>
                <p className="font-medium text-sm sm:text-base">Delete Account</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 w-full sm:w-auto"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <IconAlertTriangle size={20} />
              Delete Account
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all of your data from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Please type <strong>DELETE</strong> to confirm:
            </p>
            <Input placeholder="Type DELETE to confirm" />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button variant="destructive" className="w-full sm:w-auto">
              Delete My Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
