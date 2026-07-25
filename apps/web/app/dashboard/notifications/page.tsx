"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@oryn/database";
import { formatDistanceToNow } from "date-fns";
import { useSetBreadcrumb } from "@/components/dashboard/breadcrumb-context";
import {
  IconBell,
  IconCreditCard,
  IconFileText,
  IconMail,
  IconMailOpened,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconGift,
  IconShield,
  IconFile,
  IconWallet,
  IconUser,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const typeIcons: Record<string, React.ElementType> = {
  payment_received: IconCreditCard,
  claim_status_change: IconFileText,
  message_delivered: IconMail,
  message_read: IconMailOpened,
  message_failed: IconX,
  message_received: IconMail,
  escalation: IconAlertTriangle,
  document_parsed: IconFile,
  document_failed: IconX,
  withdrawal_completed: IconWallet,
  withdrawal_failed: IconX,
  kyc_update: IconUser,
  security_alert: IconShield,
  referral_signup: IconGift,
  referral_reward: IconGift,
  system: IconBell,
};

const typeColors: Record<string, string> = {
  payment_received: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  claim_status_change: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  message_delivered: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  message_read: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  message_failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  message_received: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  escalation: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  document_parsed: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  document_failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  withdrawal_completed: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  withdrawal_failed: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  kyc_update: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  security_alert: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  referral_signup: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  referral_reward: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  system: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const priorityColors: Record<string, string> = {
  low: "border-l-gray-400",
  normal: "border-l-blue-400",
  high: "border-l-orange-400",
  urgent: "border-l-red-400",
};

export default function NotificationsPage() {
  const { user } = useUser();

  // Set breadcrumb
  useSetBreadcrumb([
    { label: "Dashboard", href: "/dashboard" },
    { label: "Notifications" },
  ]);

  const convexUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const notifications = useQuery(
    api.notifications.list,
    convexUser?._id ? { userId: convexUser._id, limit: 50 } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.getUnreadCount,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead({ id: notificationId as any });
  };

  const handleMarkAllAsRead = async () => {
    if (convexUser?._id) {
      await markAllAsRead({ userId: convexUser._id });
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount !== undefined && unreadCount > 0 && (
            <span className="px-2 py-0.5 text-sm bg-accent text-accent-foreground rounded-full">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount !== undefined && unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <IconCheck size={16} className="mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications === undefined ? (
        <div className="text-center py-12 text-muted-foreground">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconBell size={48} className="text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see payment alerts, message updates, and more here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || IconBell;

            return (
              <Card
                key={notification._id}
                className={`border-l-4 ${priorityColors[notification.priority]} ${
                  !notification.read ? "bg-accent/5" : ""
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${typeColors[notification.type]}`}>
                      <Icon size={18} />
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-accent rounded-full" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAsRead(notification._id)}
                        >
                          <IconCheck size={14} />
                        </Button>
                      )}
                      {notification.link && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={notification.link}>View</a>
                        </Button>
                      )}
                    </div>
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
