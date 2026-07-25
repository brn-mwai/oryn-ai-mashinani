import { Skeleton, SkeletonList } from "@/components/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <Skeleton className="h-4 w-40" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-md" />
      </div>

      {/* Notifications List */}
      <SkeletonList count={8} />
    </div>
  );
}
