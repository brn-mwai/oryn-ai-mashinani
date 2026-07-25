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
  IconSearch,
  IconFilter,
  IconChevronRight,
  IconClock,
  IconAlertTriangle,
  IconCheck,
  IconPlayerPause,
  IconX,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  collected: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  partial: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  written_off: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  disputed: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const statusIcons: Record<string, React.ElementType> = {
  draft: IconClock,
  active: IconAlertTriangle,
  paused: IconPlayerPause,
  collected: IconCheck,
  partial: IconClock,
  written_off: IconX,
  disputed: IconAlertTriangle,
};

const escalationLabels = ["Friendly", "Follow-up", "Firm", "Final Notice", "Legal"];

export default function ClaimsPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Claims" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const claims = useQuery(
    api.claims.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const claimsData = claims?.data || [];

  const filteredClaims = claimsData.filter((claim) => {
    const matchesSearch = claim.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || claim.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: claimsData.length,
    active: claimsData.filter((c) => c.status === "active").length,
    collected: claimsData.filter((c) => c.status === "collected").length,
    totalOwed: claimsData.reduce((sum, c) => sum + (c.amount - c.amountPaid), 0),
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Claims</h1>
        <Button className="bg-accent hover:bg-accent/90" asChild>
          <Link href="/dashboard/claims/new">
            <IconPlus size={16} className="mr-2" />
            New Claim
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Claims</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-semibold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-2xl font-semibold">{stats.collected}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Owed</p>
            <p className="text-2xl font-semibold">
              ${stats.totalOwed.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Search claims..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(null)}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("active")}
          >
            Active
          </Button>
          <Button
            variant={statusFilter === "collected" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("collected")}
          >
            Collected
          </Button>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-3">
        {filteredClaims === undefined ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading claims...
          </div>
        ) : filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No claims found</p>
              <Button asChild>
                <Link href="/dashboard/claims/new">
                  <IconPlus size={16} className="mr-2" />
                  Create your first claim
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClaims.map((claim) => {
            const StatusIcon = statusIcons[claim.status] || IconClock;
            const remaining = claim.amount - claim.amountPaid;
            const progress = claim.amount > 0 ? (claim.amountPaid / claim.amount) * 100 : 0;

            return (
              <Link key={claim._id} href={`/dashboard/claims/${claim._id}`}>
                <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${statusColors[claim.status]}`}
                      >
                        <StatusIcon size={18} />
                      </div>

                      {/* Claim Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium truncate">{claim.title}</h3>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${statusColors[claim.status]}`}
                          >
                            {claim.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>
                            Escalation: {escalationLabels[claim.escalationLevel]}
                          </span>
                          {claim.dueDate && (
                            <span>
                              Due:{" "}
                              {formatDistanceToNow(new Date(claim.dueDate), {
                                addSuffix: true,
                              })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <p className="font-semibold">
                          ${remaining.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          of ${claim.amount.toLocaleString()}
                        </p>
                        {progress > 0 && (
                          <div className="w-20 h-1.5 bg-muted rounded-full mt-1">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      <IconChevronRight
                        size={16}
                        className="text-muted-foreground"
                      />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
