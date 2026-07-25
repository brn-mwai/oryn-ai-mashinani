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

interface ChannelData {
  channel: string;
  sent: number;
  delivered: number;
  responded: number;
}

interface ChannelPerformanceChartProps {
  data: ChannelData[];
  className?: string;
}

const chartConfig = {
  sent: {
    label: "Sent",
    color: "var(--chart-3)",
  },
  delivered: {
    label: "Delivered",
    color: "var(--chart-2)",
  },
  responded: {
    label: "Responded",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChannelPerformanceChart({ data, className }: ChannelPerformanceChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className ?? "min-h-[300px] w-full"}>
      <BarChart accessibilityLayer data={data} layout="vertical">
        <CartesianGrid horizontal={false} />
        <YAxis
          dataKey="channel"
          type="category"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          width={80}
        />
        <XAxis type="number" tickLine={false} axisLine={false} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value, name) => (
                <span>
                  {chartConfig[name as keyof typeof chartConfig]?.label}:{" "}
                  {Number(value).toLocaleString()}
                </span>
              )}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="sent" fill="var(--color-sent)" radius={4} />
        <Bar dataKey="delivered" fill="var(--color-delivered)" radius={4} />
        <Bar dataKey="responded" fill="var(--color-responded)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const sampleChannelData: ChannelData[] = [
  { channel: "Email", sent: 1250, delivered: 1180, responded: 342 },
  { channel: "SMS", sent: 580, delivered: 565, responded: 198 },
  { channel: "WhatsApp", sent: 320, delivered: 318, responded: 156 },
];
