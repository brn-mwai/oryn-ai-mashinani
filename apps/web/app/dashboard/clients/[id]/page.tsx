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
  IconUser,
  IconMail,
  IconPhone,
  IconMapPin,
  IconFileText,
  IconCurrencyDollar,
  IconPlus,
  IconEdit,
  IconArchive,
  IconCheck,
  IconClock,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  paused: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  collected: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  written_off: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

const statusIcons: Record<string, React.ElementType> = {
  draft: IconClock,
  active: IconAlertTriangle,
  collected: IconCheck,
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useUser();
  const { setItems } = useBreadcrumb();

  const clientDetails = useQuery(api.clients.getWithClaims, { id: id as any });
  const archiveClient = useMutation(api.clients.archive);

  // Set breadcrumb when client data is available
  useEffect(() => {
    if (clientDetails?.client) {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clients", href: "/dashboard/clients" },
        { label: clientDetails.client.name },
      ]);
    } else {
      setItems([
        { label: "Dashboard", href: "/dashboard" },
        { label: "Clients", href: "/dashboard/clients" },
        { label: "Loading..." },
      ]);
    }
  }, [clientDetails?.client, setItems]);

  if (clientDetails === undefined) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (!clientDetails) {
    return (
      <div className="p-6 lg:p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground mb-4">Client not found</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/clients">
            <IconArrowLeft size={16} className="mr-2" />
            Back to Clients
          </Link>
        </Button>
      </div>
    );
  }

  const { client, claims } = clientDetails;

  const handleArchive = async () => {
    if (confirm("Are you sure you want to archive this client?")) {
      try {
        await archiveClient({ id: client._id });
        router.push("/dashboard/clients");
      } catch (err) {
        console.error("Failed to archive:", err);
      }
    }
  };

  const activeClaims = claims?.filter((c) => c.status === "active") || [];
  const collectedClaims = claims?.filter((c) => c.status === "collected") || [];

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/clients">
              <IconArrowLeft size={20} />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              Client since {format(new Date(client.createdAt), "MMMM yyyy")}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <IconEdit size={14} className="mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleArchive}>
            <IconArchive size={14} className="mr-1" />
            Archive
          </Button>
          <Button className="bg-accent hover:bg-accent/90" size="sm" asChild>
            <Link href={`/dashboard/claims/new?clientId=${client._id}`}>
              <IconPlus size={14} className="mr-1" />
              New Claim
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Owed</p>
                <p className="text-2xl font-semibold text-red-600">
                  ${client.totalOwed.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-semibold text-green-600">
                  ${client.totalPaid.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active Claims</p>
                <p className="text-2xl font-semibold">{activeClaims.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-semibold">{collectedClaims.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Claims */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Claims</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/claims?clientId=${client._id}`}>
                  View All
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {claims && claims.length > 0 ? (
                <div className="space-y-3">
                  {claims.slice(0, 5).map((claim) => {
                    const StatusIcon = statusIcons[claim.status] || IconClock;
                    const remaining = claim.amount - claim.amountPaid;

                    return (
                      <Link
                        key={claim._id}
                        href={`/dashboard/claims/${claim._id}`}
                        className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${statusColors[claim.status]}`}
                          >
                            <StatusIcon size={14} />
                          </div>
                          <div>
                            <p className="font-medium">{claim.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(claim.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${remaining.toLocaleString()}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[claim.status]}`}>
                            {claim.status}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No claims yet</p>
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/claims/new?clientId=${client._id}`}>
                      <IconPlus size={14} className="mr-1" />
                      Create First Claim
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IconUser size={18} />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.email && (
                <div className="flex items-start gap-3">
                  <IconMail size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${client.email}`}
                      className="text-sm hover:underline"
                    >
                      {client.email}
                    </a>
                  </div>
                </div>
              )}
              {client.phone && (
                <div className="flex items-start gap-3">
                  <IconPhone size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <a
                      href={`tel:${client.phone}`}
                      className="text-sm hover:underline"
                    >
                      {client.phone}
                    </a>
                  </div>
                </div>
              )}
              {client.address && (
                <div className="flex items-start gap-3">
                  <IconMapPin size={16} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="text-sm">
                      {client.address.street && <>{client.address.street}<br /></>}
                      {client.address.city && <>{client.address.city}, </>}
                      {client.address.state} {client.address.postalCode}
                      {client.address.country && <><br />{client.address.country}</>}
                    </p>
                  </div>
                </div>
              )}
              {!client.email && !client.phone && !client.address && (
                <p className="text-sm text-muted-foreground">No contact information</p>
              )}
            </CardContent>
          </Card>

          {/* Response Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Engagement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Response Rate</span>
                  <span>{client.responseRate ?? 0}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${client.responseRate ?? 0}%` }}
                  />
                </div>
              </div>
              {client.lastContactedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Contacted</span>
                  <span>
                    {formatDistanceToNow(new Date(client.lastContactedAt), { addSuffix: true })}
                  </span>
                </div>
              )}
              {client.lastResponseAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Response</span>
                  <span>
                    {formatDistanceToNow(new Date(client.lastResponseAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
