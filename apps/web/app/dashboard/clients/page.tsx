"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconPlus,
  IconSearch,
  IconUser,
  IconMail,
  IconPhone,
  IconBrandWhatsapp,
  IconChevronRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const statusColors: Record<string, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  owing: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  paid: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export default function ClientsPage() {
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Clients" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const clients = useQuery(
    api.clients.list,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const clientsData = clients?.data || [];

  const filteredClients = clientsData.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !statusFilter || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: clientsData.length,
    owing: clientsData.filter((c) => c.status === "owing").length,
    totalOwed: clientsData.reduce((sum, c) => sum + c.totalOwed, 0),
    totalPaid: clientsData.reduce((sum, c) => sum + c.totalPaid, 0),
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Button className="bg-accent hover:bg-accent/90" asChild>
          <Link href="/dashboard/clients/new">
            <IconPlus size={16} className="mr-2" />
            Add Client
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Clients</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Currently Owing</p>
            <p className="text-2xl font-semibold">{stats.owing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Owed</p>
            <p className="text-2xl font-semibold text-yellow-600">
              ${stats.totalOwed.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Collected</p>
            <p className="text-2xl font-semibold text-green-600">
              ${stats.totalPaid.toLocaleString()}
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
            placeholder="Search clients..."
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
            variant={statusFilter === "owing" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("owing")}
          >
            Owing
          </Button>
          <Button
            variant={statusFilter === "paid" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("paid")}
          >
            Paid
          </Button>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-3">
        {filteredClients === undefined ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No clients found</p>
              <Button asChild>
                <Link href="/dashboard/clients/new">
                  <IconPlus size={16} className="mr-2" />
                  Add your first client
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Link key={client._id} href={`/dashboard/clients/${client._id}`}>
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <IconUser size={18} className="text-accent" />
                    </div>

                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium truncate">{client.name}</h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${statusColors[client.status]}`}
                        >
                          {client.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        {client.email && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <IconMail size={14} />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <IconPhone size={14} />
                            {client.phone}
                          </span>
                        )}
                        {client.whatsapp && (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <IconBrandWhatsapp size={14} />
                            {client.whatsapp}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Amounts */}
                    <div className="text-right">
                      {client.totalOwed > 0 ? (
                        <>
                          <p className="font-semibold text-yellow-600">
                            ${client.totalOwed.toLocaleString()} owed
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ${client.totalPaid.toLocaleString()} paid
                          </p>
                        </>
                      ) : (
                        <p className="font-semibold text-green-600">
                          ${client.totalPaid.toLocaleString()} paid
                        </p>
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
          ))
        )}
      </div>
    </div>
  );
}
