"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconPlus,
  IconLink,
  IconCopy,
  IconCheck,
  IconClock,
  IconX,
  IconEye,
  IconExternalLink,
  IconQrcode,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  used: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  expired: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusIcons: Record<string, React.ElementType> = {
  active: IconCheck,
  used: IconCheck,
  expired: IconClock,
  cancelled: IconX,
};

export default function PaymentLinksPage() {
  const { user } = useUser();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Payment Links" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const paymentLinks = useQuery(
    api.paymentLinks.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const stats = {
    total: paymentLinks?.length || 0,
    active: paymentLinks?.filter((l) => l.status === "active").length || 0,
    used: paymentLinks?.filter((l) => l.status === "used").length || 0,
    totalViews: paymentLinks?.reduce((sum, l) => sum + l.views, 0) || 0,
  };

  const copyToClipboard = async (token: string, id: string) => {
    const url = `${window.location.origin}/pay/${token}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Payment Links</h1>
        <Button className="bg-accent hover:bg-accent/90" asChild>
          <Link href="/dashboard/payment-links/new">
            <IconPlus size={16} className="mr-2" />
            Create Link
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Links</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-semibold text-green-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Used</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.used}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Views</p>
            <p className="text-2xl font-semibold">{stats.totalViews}</p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Links List */}
      {paymentLinks === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading payment links...
        </div>
      ) : paymentLinks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconLink size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No payment links yet</p>
            <Button asChild>
              <Link href="/dashboard/payment-links/new">
                <IconPlus size={16} className="mr-2" />
                Create your first payment link
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {paymentLinks.map((link) => {
            const StatusIcon = statusIcons[link.status] || IconClock;
            const isExpired = link.expiresAt < Date.now();
            const displayStatus = isExpired && link.status === "active" ? "expired" : link.status;

            return (
              <Card key={link._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Link Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[displayStatus]}`}>
                      <IconLink size={18} />
                    </div>

                    {/* Link Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          ${link.amount.toLocaleString()} {link.currency}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[displayStatus]}`}>
                          {displayStatus}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <IconEye size={14} />
                          {link.views} views
                        </span>
                        <span>
                          Expires {formatDistanceToNow(new Date(link.expiresAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          pay.oryn.cc/{link.token.slice(0, 8)}...
                        </code>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(link.token, link._id)}
                      >
                        {copiedId === link._id ? (
                          <IconCheck size={14} className="text-green-500" />
                        ) : (
                          <IconCopy size={14} />
                        )}
                      </Button>
                      <Button variant="outline" size="sm">
                        <IconQrcode size={14} />
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/pay/${link.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternalLink size={14} />
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="mt-3 flex gap-2">
                    {link.methods.map((method) => (
                      <span
                        key={method}
                        className="text-xs px-2 py-0.5 bg-muted rounded capitalize"
                      >
                        {method.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
