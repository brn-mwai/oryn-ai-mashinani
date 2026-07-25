"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface PaymentTrendData {
  date: string;
  stripe: number;
  paystack: number;
  circle: number;
}

interface PaymentTrendsChartProps {
  data: PaymentTrendData[];
  className?: string;
}

const chartConfig = {
  stripe: {
    label: "Stripe",
    color: "var(--chart-1)",
  },
  paystack: {
    label: "Paystack",
    color: "var(--chart-2)",
  },
  circle: {
    label: "Circle (USDC)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export function PaymentTrendsChart({ data, className }: PaymentTrendsChartProps) {
  return (
    <ChartContainer config={chartConfig} className={className ?? "min-h-[300px] w-full"}>
      <AreaChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
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
        <defs>
          <linearGradient id="fillStripe" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-stripe)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-stripe)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillPaystack" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-paystack)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-paystack)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillCircle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-circle)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-circle)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="stripe"
          type="monotone"
          fill="url(#fillStripe)"
          stroke="var(--color-stripe)"
          strokeWidth={2}
          stackId="1"
        />
        <Area
          dataKey="paystack"
          type="monotone"
          fill="url(#fillPaystack)"
          stroke="var(--color-paystack)"
          strokeWidth={2}
          stackId="1"
        />
        <Area
          dataKey="circle"
          type="monotone"
          fill="url(#fillCircle)"
          stroke="var(--color-circle)"
          strokeWidth={2}
          stackId="1"
        />
      </AreaChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const samplePaymentTrendsData: PaymentTrendData[] = [
  { date: "Jan 1", stripe: 4200, paystack: 1800, circle: 800 },
  { date: "Jan 8", stripe: 5100, paystack: 2200, circle: 1200 },
  { date: "Jan 15", stripe: 4800, paystack: 1900, circle: 950 },
  { date: "Jan 22", stripe: 6200, paystack: 2800, circle: 1500 },
  { date: "Jan 29", stripe: 5500, paystack: 2400, circle: 1100 },
  { date: "Feb 5", stripe: 7100, paystack: 3200, circle: 1800 },
  { date: "Feb 12", stripe: 6800, paystack: 2900, circle: 1650 },
];
