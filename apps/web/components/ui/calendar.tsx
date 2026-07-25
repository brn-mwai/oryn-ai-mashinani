"use client";

import * as React from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Date utilities
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isDateDisabled(date: Date, disabled?: { before?: Date; after?: Date }): boolean {
  if (!disabled) return false;
  if (disabled.before && date < disabled.before) return true;
  if (disabled.after && date > disabled.after) return true;
  return false;
}

export interface DateRange {
  from?: Date;
  to?: Date;
}

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date | DateRange;
  onSelect?: (date: Date | DateRange | undefined) => void;
  disabled?: { before?: Date; after?: Date };
  numberOfMonths?: number;
  className?: string;
  showOutsideDays?: boolean;
}

interface MonthViewProps {
  year: number;
  month: number;
  mode: "single" | "range";
  selected?: Date | DateRange;
  onDayClick: (date: Date) => void;
  disabled?: { before?: Date; after?: Date };
  showOutsideDays?: boolean;
  today: Date;
}

function MonthView({
  year,
  month,
  mode,
  selected,
  onDayClick,
  disabled,
  showOutsideDays,
  today,
}: MonthViewProps) {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);

  const days: React.ReactNode[] = [];

  // Previous month days
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    if (showOutsideDays) {
      days.push(
        <button
          key={`prev-${day}`}
          className="h-9 w-9 p-0 text-muted-foreground/50 text-sm"
          disabled
        >
          {day}
        </button>
      );
    } else {
      days.push(<div key={`prev-${day}`} className="h-9 w-9" />);
    }
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const isToday = isSameDay(date, today);
    const isDisabled = isDateDisabled(date, disabled);

    let isSelected = false;
    let isRangeStart = false;
    let isRangeEnd = false;
    let isInRange = false;

    if (mode === "single" && selected && selected instanceof Date) {
      isSelected = isSameDay(date, selected);
    } else if (mode === "range" && selected && "from" in selected) {
      const range = selected as DateRange;
      if (range.from && isSameDay(date, range.from)) {
        isSelected = true;
        isRangeStart = true;
      }
      if (range.to && isSameDay(date, range.to)) {
        isSelected = true;
        isRangeEnd = true;
      }
      if (range.from && range.to && date > range.from && date < range.to) {
        isInRange = true;
      }
    }

    days.push(
      <button
        key={day}
        onClick={() => !isDisabled && onDayClick(date)}
        disabled={isDisabled}
        className={cn(
          "h-9 w-9 p-0 text-sm rounded-md transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          isToday && !isSelected && "bg-accent/20 text-accent-foreground font-semibold",
          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
          isInRange && "bg-accent/50 rounded-none",
          isRangeStart && "rounded-l-md",
          isRangeEnd && "rounded-r-md",
          isDisabled && "text-muted-foreground/50 cursor-not-allowed hover:bg-transparent"
        )}
      >
        {day}
      </button>
    );
  }

  // Next month days
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const remainingCells = totalCells - (firstDay + daysInMonth);
  for (let day = 1; day <= remainingCells; day++) {
    if (showOutsideDays) {
      days.push(
        <button
          key={`next-${day}`}
          className="h-9 w-9 p-0 text-muted-foreground/50 text-sm"
          disabled
        >
          {day}
        </button>
      );
    } else {
      days.push(<div key={`next-${day}`} className="h-9 w-9" />);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="h-9 w-9 text-muted-foreground text-xs font-normal flex items-center justify-center"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{days}</div>
    </div>
  );
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  numberOfMonths = 1,
  className,
  showOutsideDays = true,
}: CalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(() => {
    if (mode === "single" && selected instanceof Date) {
      return new Date(selected.getFullYear(), selected.getMonth(), 1);
    }
    if (mode === "range" && selected && "from" in selected && selected.from) {
      return new Date(selected.from.getFullYear(), selected.from.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDayClick = (date: Date) => {
    if (!onSelect) return;

    if (mode === "single") {
      onSelect(date);
    } else if (mode === "range") {
      const range = selected as DateRange | undefined;
      if (!range?.from || (range.from && range.to)) {
        // Start new range
        onSelect({ from: date, to: undefined });
      } else {
        // Complete range
        if (date < range.from) {
          onSelect({ from: date, to: range.from });
        } else {
          onSelect({ from: range.from, to: date });
        }
      }
    }
  };

  const months: React.ReactNode[] = [];
  for (let i = 0; i < numberOfMonths; i++) {
    const monthDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + i, 1);
    months.push(
      <div key={i} className="space-y-4">
        <div className="flex justify-center pt-1 relative items-center">
          {i === 0 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute left-1 h-7 w-7"
              onClick={handlePrevMonth}
            >
              <IconChevronLeft size={16} />
            </Button>
          )}
          <div className="text-sm font-medium">
            {MONTHS[monthDate.getMonth()]} {monthDate.getFullYear()}
          </div>
          {i === numberOfMonths - 1 && (
            <Button
              variant="outline"
              size="icon"
              className="absolute right-1 h-7 w-7"
              onClick={handleNextMonth}
            >
              <IconChevronRight size={16} />
            </Button>
          )}
        </div>
        <MonthView
          year={monthDate.getFullYear()}
          month={monthDate.getMonth()}
          mode={mode}
          selected={selected}
          onDayClick={handleDayClick}
          disabled={disabled}
          showOutsideDays={showOutsideDays}
          today={today}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-3",
        numberOfMonths > 1 && "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        className
      )}
    >
      {months}
    </div>
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
