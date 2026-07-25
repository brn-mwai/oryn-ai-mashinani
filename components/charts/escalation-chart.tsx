"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface EscalationData {
  level: string;
  count: number;
  description: string;
}

interface EscalationChartProps {
  data: EscalationData[];
  className?: string;
}

const chartConfig = {
  level0: {
    label: "Level 0 - Friendly",
    color: "var(--chart-2)",
  },
  level1: {
    label: "Level 1 - Reminder",
    color: "var(--chart-1)",
  },
  level2: {
    label: "Level 2 - Firm",
    color: "var(--chart-4)",
  },
  level3: {
    label: "Level 3 - Urgent",
    color: "var(--chart-5)",
  },
  level4: {
    label: "Level 4 - Final",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const COLORS = [
  "var(--chart-2)",
  "var(--chart-1)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-3)",
];

export function EscalationChart({ data, className }: EscalationChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className ?? "min-h-[250px] w-full"}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="level"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{item.payload.level}</span>
                  <span>{item.payload.description}</span>
                  <span>Claims: {Number(value).toLocaleString()}</span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const sampleEscalationData: EscalationData[] = [
  { level: "Level 0", count: 45, description: "Friendly reminder" },
  { level: "Level 1", count: 32, description: "Standard reminder" },
  { level: "Level 2", count: 18, description: "Firm reminder" },
  { level: "Level 3", count: 8, description: "Urgent notice" },
  { level: "Level 4", count: 3, description: "Final notice" },
];
