"use client";

import { cn } from "@/lib/utils";

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date?: string;
  icon?: React.ReactNode;
  status?: "completed" | "current" | "upcoming";
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[17px] top-0 h-full w-[2px] bg-border" />

      <div className="space-y-8">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex gap-4">
            {/* Icon/Dot */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-background",
                item.status === "completed" &&
                  "border-primary bg-primary text-primary-foreground",
                item.status === "current" &&
                  "border-primary",
                item.status === "upcoming" &&
                  "border-muted-foreground/30"
              )}
            >
              {item.icon || (
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    item.status === "completed" && "bg-primary-foreground",
                    item.status === "current" && "bg-primary",
                    item.status === "upcoming" && "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1.5">
              <div className="flex items-center justify-between">
                <h4
                  className={cn(
                    "text-sm font-medium",
                    item.status === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {item.title}
                </h4>
                {item.date && (
                  <span className="text-xs text-muted-foreground">
                    {item.date}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal Timeline variant
interface HorizontalTimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function HorizontalTimeline({ items, className }: HorizontalTimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Horizontal line */}
      <div className="absolute left-0 top-[18px] h-[2px] w-full bg-border" />

      <div className="flex justify-between">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex flex-col items-center">
            {/* Icon/Dot */}
            <div
              className={cn(
                "relative z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 bg-background",
                item.status === "completed" &&
                  "border-primary bg-primary text-primary-foreground",
                item.status === "current" &&
                  "border-primary",
                item.status === "upcoming" &&
                  "border-muted-foreground/30"
              )}
            >
              {item.icon || (
                <div
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    item.status === "completed" && "bg-primary-foreground",
                    item.status === "current" && "bg-primary",
                    item.status === "upcoming" && "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>

            {/* Content */}
            <div className="mt-3 text-center">
              <h4
                className={cn(
                  "text-sm font-medium",
                  item.status === "upcoming" && "text-muted-foreground"
                )}
              >
                {item.title}
              </h4>
              {item.date && (
                <span className="text-xs text-muted-foreground">
                  {item.date}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
