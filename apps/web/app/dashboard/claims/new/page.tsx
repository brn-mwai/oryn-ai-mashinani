"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconArrowLeft,
  IconFileText,
  IconUser,
  IconCurrencyDollar,
  IconCalendar,
  IconPlus,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

export default function NewClaimPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Claims", href: "/dashboard/claims" },
    { label: "New" },
  ]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    currency: "USD",
    clientId: "",
    dueDate: undefined as Date | undefined,
  });

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const clients = useQuery(
    api.clients.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const createClaim = useMutation(api.claims.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!convexUser?._id) {
      setError("User not found");
      return;
    }

    if (!form.title || !form.amount || !form.clientId) {
      setError("Please fill in all required fields");
      return;
    }

    const amount = parseFloat(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);

    try {
      const claimId = await createClaim({
        userId: convexUser._id,
        clientId: form.clientId as any,
        title: form.title,
        description: form.description || undefined,
        amount,
        currency: form.currency as any,
        dueDate: form.dueDate ? form.dueDate.getTime() : undefined,
      });

      router.push(`/dashboard/claims/${claimId}`);
    } catch (err) {
      setError("Failed to create claim. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/claims">
            <IconArrowLeft size={20} />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Create New Claim</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconFileText size={20} />
              Claim Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">
                {error}
              </div>
            )}

            {/* Title */}
            <div>
              <Label htmlFor="title">Claim Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Invoice #1234 - Website Development"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Additional details about the claim..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1 min-h-[100px]"
              />
            </div>

            {/* Client Selection */}
            <div>
              <Label className="flex items-center gap-2">
                <IconUser size={16} />
                Select Client *
              </Label>
              {clients?.data && clients.data.length > 0 ? (
                <Select
                  value={form.clientId}
                  onValueChange={(value) => setForm({ ...form, clientId: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a client..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.data.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name} {client.email ? `(${client.email})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1 p-4 border border-dashed text-center">
                  <p className="text-muted-foreground mb-2">No clients found</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/dashboard/clients/new">
                      <IconPlus size={14} className="mr-1" />
                      Add Client First
                    </Link>
                  </Button>
                </div>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <IconCurrencyDollar size={16} />
                  Amount *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={form.currency}
                  onValueChange={(value) => setForm({ ...form, currency: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="USDC">USDC - USD Coin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Due Date */}
            <div>
              <Label className="flex items-center gap-2">
                <IconCalendar size={16} />
                Due Date
              </Label>
              <div className="mt-1">
                <DatePicker
                  date={form.dueDate}
                  onDateChange={(date) => setForm({ ...form, dueDate: date })}
                  placeholder="Select due date..."
                  minDate={new Date()}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-accent hover:bg-accent/90"
                disabled={isSubmitting || !form.clientId}
              >
                {isSubmitting ? "Creating..." : "Create Claim"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
