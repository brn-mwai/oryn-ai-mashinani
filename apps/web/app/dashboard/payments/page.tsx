"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconCreditCard,
  IconBuildingBank,
  IconCurrencyBitcoin,
  IconBrandApple,
  IconBrandGoogle,
  IconSearch,
  IconChevronRight,
  IconCheck,
  IconClock,
  IconX,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const methodIcons: Record<string, React.ElementType> = {
  card: IconCreditCard,
  bank_transfer: IconBuildingBank,
  ach: IconBuildingBank,
  usdc: IconCurrencyBitcoin,
  apple_pay: IconBrandApple,
  google_pay: IconBrandGoogle,
  link: IconCreditCard,
  other: IconCreditCard,
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  refunded: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  disputed: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
};

const statusIcons: Record<string, React.ElementType> = {
  pending: IconClock,
  processing: IconClock,
  completed: IconCheck,
  failed: IconX,
  refunded: IconAlertTriangle,
  disputed: IconAlertTriangle,
};

export default function PaymentsPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Payments" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const payments = useQuery(
    api.payments.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const paymentsData = payments ?? [];
  const filteredPayments = paymentsData.filter((payment) => {
    const matchesStatus = !statusFilter || payment.status === statusFilter;
    return matchesStatus;
  });

  const stats = {
    total: paymentsData.length,
    completed: paymentsData.filter((p) => p.status === "completed").length,
    pending: paymentsData.filter((p) => p.status === "pending" || p.status === "processing").length,
    totalAmount: paymentsData.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Payments</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending</p>
            <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Received</p>
            <p className="text-2xl font-semibold text-green-600">
              ${stats.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={statusFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter(null)}
        >
          All
        </Button>
        <Button
          variant={statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </Button>
        <Button
          variant={statusFilter === "pending" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("pending")}
        >
          Pending
        </Button>
        <Button
          variant={statusFilter === "failed" ? "default" : "outline"}
          size="sm"
          onClick={() => setStatusFilter("failed")}
        >
          Failed
        </Button>
      </div>

      {/* Payments List */}
      <Card>
        <CardContent className="p-0">
          {payments === undefined ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading payments...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No payments found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPayments.map((payment) => {
                const MethodIcon = methodIcons[payment.method] || IconCreditCard;
                const StatusIcon = statusIcons[payment.status] || IconClock;

                return (
                  <div
                    key={payment._id}
                    className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Method Icon */}
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <MethodIcon size={18} className="text-muted-foreground" />
                    </div>

                    {/* Payment Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium capitalize">
                          {payment.method.replace(/_/g, " ")}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[payment.status]}`}
                        >
                          {payment.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true })}
                        {payment.chain && ` • ${payment.chain}`}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className="font-semibold">
                        ${payment.amount.toLocaleString()}
                      </p>
                      {payment.fee && (
                        <p className="text-xs text-muted-foreground">
                          Fee: ${payment.fee.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <IconChevronRight size={16} className="text-muted-foreground" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
