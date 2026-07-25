"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow, format } from "date-fns";
import { useBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconArrowLeft,
  IconFileText,
  IconUser,
  IconMail,
  IconPhone,
  IconCurrencyDollar,
  IconCalendar,
  IconChevronUp,
  IconPlayerPause,
  IconPlayerPlay,
  IconCheck,
  IconCopy,
  IconLink,
  IconMessage,
  IconEdit,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const escalationLabels = ["Friendly", "Follow-up", "Firm", "Final Notice", "Legal"];
const escalationColors = [
  "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  collected: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  written_off: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export default function ClaimDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { setItems } = useBreadcrumb();

  const claimDetails = useQuery(api.claims.getWithDetails, { id: id as any });
  const escalateClaim = useMutation(api.claims.escalate);
  const pauseClaim = useMutation(api.claims.pause);
  const activateClaim = useMutation(api.claims.activate);

  // Set breadcrumb when claim data is available
  useEffect(() => {
    if (claimDetails?.claim) {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Claims", href: "/dashboard/claims" },
        { label: claimDetails.claim.title },
      ]);
    } else {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Claims", href: "/dashboard/claims" },
        { label: "Loading..." },
      ]);
    }
  }, [claimDetails?.claim, setItems]);

  if (claimDetails === undefined) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading claim...</p>
      </div>
    );
  }

  if (!claimDetails) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Claim not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/claims">
            <IconArrowLeft size={16} className="mr-2" />
            Back to Claims
          </Link>
        </Button>
      </div>
    );
  }

  const { claim, client, messages, payments } = claimDetails;
  const remaining = claim.amount - claim.amountPaid;
  const progress = claim.amount > 0 ? (claim.amountPaid / claim.amount) * 100 : 0;

  const handleEscalate = async () => {
    try {
      await escalateClaim({ id: claim._id });
    } catch (err) {
      console.error("Failed to escalate:", err);
    }
  };

  const handlePause = async () => {
    try {
      await pauseClaim({ id: claim._id });
    } catch (err) {
      console.error("Failed to pause:", err);
    }
  };

  const handleActivate = async () => {
    try {
      await activateClaim({ id: claim._id });
    } catch (err) {
      console.error("Failed to activate:", err);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/claims">
              <IconArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{claim.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[claim.status]}`}>
                {claim.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${escalationColors[claim.escalationLevel]}`}>
                {escalationLabels[claim.escalationLevel]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {claim.status === "active" && (
            <>
              <Button variant="outline" size="sm" onClick={handlePause}>
                <IconPlayerPause size={14} className="mr-1" />
                Pause
              </Button>
              {claim.escalationLevel < 4 && (
                <Button variant="outline" size="sm" onClick={handleEscalate}>
                  <IconChevronUp size={14} className="mr-1" />
                  Escalate
                </Button>
              )}
            </>
          )}
          {(claim.status === "draft" || claim.status === "paused") && (
            <Button variant="outline" size="sm" onClick={handleActivate}>
              <IconPlayerPlay size={14} className="mr-1" />
              {claim.status === "draft" ? "Start Collection" : "Resume"}
            </Button>
          )}
          <Button className="bg-accent hover:bg-accent/90" size="sm">
            <IconMessage size={14} className="mr-1" />
            Send Reminder
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Amount Due</p>
                  <p className="text-3xl font-semibold">${remaining.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Claim</p>
                  <p className="text-xl font-medium">${claim.amount.toLocaleString()}</p>
                </div>
              </div>
              {claim.amountPaid > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Paid: ${claim.amountPaid.toLocaleString()}</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {claim.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{claim.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Recent Messages */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Messages</CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {messages && messages.length > 0 ? (
                <div className="space-y-3">
                  {messages.slice(0, 5).map((msg) => (
                    <div
                      key={msg._id}
                      className="flex items-start gap-3 p-3 bg-muted/50"
                    >
                      <IconMessage size={16} className="text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium capitalize">{msg.channel}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No messages sent yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments && payments.length > 0 ? (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between p-3 bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <IconCheck size={14} className="text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium capitalize">{payment.method}</p>
                          <p className="text-xs text-muted-foreground">
                            {payment.completedAt
                              ? format(new Date(payment.completedAt), "MMM d, yyyy")
                              : "Pending"}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold text-green-600">
                        +${payment.amount.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-4">
                  No payments received yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconUser size={18} />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {client ? (
                <>
                  <div>
                    <p className="font-medium">{client.name}</p>
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <IconMail size={14} />
                        {client.email}
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <IconPhone size={14} />
                        {client.phone}
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href={`/dashboard/clients/${client._id}`}>
                      View Client Details
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Client not found</p>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span>{format(new Date(claim.createdAt), "MMM d, yyyy")}</span>
              </div>
              {claim.dueDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date</span>
                  <span>{format(new Date(claim.dueDate), "MMM d, yyyy")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Currency</span>
                <span>{claim.currency}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reminders Sent</span>
                <span>{claim.reminderCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <IconLink size={14} className="mr-2" />
                Create Payment Link
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <IconCopy size={14} className="mr-2" />
                Duplicate Claim
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <IconEdit size={14} className="mr-2" />
                Edit Claim
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
