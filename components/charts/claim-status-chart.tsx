"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ClaimStatusData {
  status: string;
  count: number;
  fill: string;
}

interface ClaimStatusChartProps {
  data: ClaimStatusData[];
  className?: string;
  innerRadius?: number;
  outerRadius?: number;
}

const chartConfig = {
  active: {
    label: "Active",
    color: "var(--chart-1)",
  },
  pending: {
    label: "Pending",
    color: "var(--chart-2)",
  },
  escalated: {
    label: "Escalated",
    color: "var(--chart-4)",
  },
  collected: {
    label: "Collected",
    color: "var(--chart-3)",
  },
  overdue: {
    label: "Overdue",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ClaimStatusChart({
  data,
  className,
  innerRadius = 60,
  outerRadius = 100,
}: ClaimStatusChartProps) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ChartContainer config={chartConfig} className={className ?? "min-h-[300px] w-full"}>
      <PieChart accessibilityLayer>
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {chartConfig[name as keyof typeof chartConfig]?.label ?? name}:{" "}
                  {Number(value).toLocaleString()} (
                  {((Number(value) / total) * 100).toFixed(1)}%)
                </span>
              )}
            />
          }
        />
        <Pie
          data={data}
          dataKey="count"
          nameKey="status"
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          strokeWidth={2}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
      </PieChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const sampleClaimStatusData: ClaimStatusData[] = [
  { status: "active", count: 45, fill: "var(--chart-1)" },
  { status: "pending", count: 28, fill: "var(--chart-2)" },
  { status: "escalated", count: 12, fill: "var(--chart-4)" },
  { status: "collected", count: 89, fill: "var(--chart-3)" },
  { status: "overdue", count: 16, fill: "var(--chart-5)" },
];
