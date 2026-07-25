"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CollectionData {
  month: string;
  collected: number;
  pending: number;
  overdue: number;
}

interface CollectionChartProps {
  data: CollectionData[];
  className?: string;
}

const chartConfig = {
  collected: {
    label: "Collected",
    color: "var(--chart-1)",
  },
  pending: {
    label: "Pending",
    color: "var(--chart-2)",
  },
  overdue: {
    label: "Overdue",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function CollectionChart({ data, className }: CollectionChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className ?? "min-h-[300px] w-full"}>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {chartConfig[name as keyof typeof chartConfig]?.label}: $
                  {Number(value).toLocaleString()}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="collected" fill="var(--color-collected)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="pending" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="overdue" fill="var(--color-overdue)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const sampleCollectionData: CollectionData[] = [
  { month: "January", collected: 18600, pending: 8000, overdue: 2400 },
  { month: "February", collected: 30500, pending: 12000, overdue: 3200 },
  { month: "March", collected: 23700, pending: 9500, overdue: 1800 },
  { month: "April", collected: 17300, pending: 11000, overdue: 4100 },
  { month: "May", collected: 20900, pending: 8500, overdue: 2700 },
  { month: "June", collected: 21400, pending: 7200, overdue: 1500 },
];
