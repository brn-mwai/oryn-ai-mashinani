"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconMail,
  IconMessage,
  IconBrandWhatsapp,
  IconSearch,
  IconFilter,
  IconSend,
  IconCheck,
  IconChecks,
  IconClock,
  IconX,
  IconEye,
  IconArrowRight,
  IconArrowLeft,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const channelIcons: Record<string, React.ElementType> = {
  email: IconMail,
  sms: IconMessage,
  whatsapp: IconBrandWhatsapp,
};

const channelColors: Record<string, string> = {
  email: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  sms: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  whatsapp: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
};

const statusIcons: Record<string, React.ElementType> = {
  draft: IconClock,
  queued: IconClock,
  sending: IconClock,
  sent: IconCheck,
  delivered: IconChecks,
  failed: IconX,
  read: IconEye,
  bounced: IconX,
  complained: IconX,
};

const statusColors: Record<string, string> = {
  draft: "text-gray-500",
  queued: "text-yellow-500",
  sending: "text-blue-500",
  sent: "text-blue-500",
  delivered: "text-green-500",
  failed: "text-red-500",
  read: "text-green-600",
  bounced: "text-red-500",
  complained: "text-red-500",
};

export default function MessagesPage() {
  const { user } = useUser();
  const [channelFilter, setChannelFilter] = useState<string | null>(null);

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Messages" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const messageStats = useQuery(
    api.messages.getStatsByUser,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Get recent messages - we'll need to add this query
  const recentMessages = useQuery(
    api.messages.listByUser,
    convexUser?._id ? { userId: convexUser._id, limit: 50 } : "skip"
  );

  const messagesData = recentMessages ?? [];
  const filteredMessages = messagesData.filter((msg) => {
    return !channelFilter || msg.channel === channelFilter;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <Button className="bg-accent hover:bg-accent/90">
          <IconSend size={16} className="mr-2" />
          Compose
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconMail size={18} className="text-blue-500" />
              <p className="text-sm text-muted-foreground">Email</p>
            </div>
            <p className="text-2xl font-semibold">
              {messageStats?.email || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconMessage size={18} className="text-green-500" />
              <p className="text-sm text-muted-foreground">SMS</p>
            </div>
            <p className="text-2xl font-semibold">
              {messageStats?.sms || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconBrandWhatsapp size={18} className="text-emerald-500" />
              <p className="text-sm text-muted-foreground">WhatsApp</p>
            </div>
            <p className="text-2xl font-semibold">
              {messageStats?.whatsapp || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <IconChecks size={18} className="text-green-500" />
              <p className="text-sm text-muted-foreground">Delivered</p>
            </div>
            <p className="text-2xl font-semibold">
              {messageStats?.delivered || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={channelFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setChannelFilter(null)}
        >
          All
        </Button>
        <Button
          variant={channelFilter === "email" ? "default" : "outline"}
          size="sm"
          onClick={() => setChannelFilter("email")}
        >
          <IconMail size={14} className="mr-1" />
          Email
        </Button>
        <Button
          variant={channelFilter === "sms" ? "default" : "outline"}
          size="sm"
          onClick={() => setChannelFilter("sms")}
        >
          <IconMessage size={14} className="mr-1" />
          SMS
        </Button>
        <Button
          variant={channelFilter === "whatsapp" ? "default" : "outline"}
          size="sm"
          onClick={() => setChannelFilter("whatsapp")}
        >
          <IconBrandWhatsapp size={14} className="mr-1" />
          WhatsApp
        </Button>
      </div>

      {/* Messages List */}
      <Card>
        <CardContent className="p-0">
          {recentMessages === undefined ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading messages...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No messages yet. Send your first reminder!
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredMessages.map((message) => {
                const ChannelIcon = channelIcons[message.channel] || IconMail;
                const StatusIcon = statusIcons[message.status] || IconClock;
                const isInbound = message.direction === "inbound";

                return (
                  <div
                    key={message._id}
                    className="flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Channel Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${channelColors[message.channel]}`}>
                      <ChannelIcon size={18} />
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {isInbound ? (
                          <IconArrowLeft size={14} className="text-blue-500" />
                        ) : (
                          <IconArrowRight size={14} className="text-green-500" />
                        )}
                        <span className="text-sm font-medium">
                          {isInbound ? "Received from" : "Sent to"} {message.recipient}
                        </span>
                        <span className={`flex items-center gap-1 text-xs ${statusColors[message.status]}`}>
                          <StatusIcon size={12} />
                          {message.status}
                        </span>
                      </div>
                      {message.subject && (
                        <p className="font-medium text-sm mb-1">{message.subject}</p>
                      )}
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {message.content}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                        {message.aiGenerated && (
                          <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                            AI Generated
                          </span>
                        )}
                        {message.escalationLevel !== undefined && message.escalationLevel > 0 && (
                          <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded">
                            Level {message.escalationLevel}
                          </span>
                        )}
                      </div>
                    </div>
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
