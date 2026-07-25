"use client";

import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface CollectionRateData {
  collected: number;
  total: number;
}

interface CollectionRateChartProps {
  data: CollectionRateData;
  className?: string;
}

const chartConfig = {
  collected: {
    label: "Collected",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Remaining",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function CollectionRateChart({ data, className }: CollectionRateChartProps) {
  const rate = ((data.collected / data.total) * 100).toFixed(1);
  const remaining = data.total - data.collected;

  const chartData = [
    {
      name: "collection",
      collected: data.collected,
      remaining: remaining,
    },
  ];

  return (
    <ChartContainer config={chartConfig} className={className ?? "mx-auto aspect-square min-h-[200px] w-full max-w-[250px]"}>
      <RadialBarChart
        data={chartData}
        endAngle={180}
        innerRadius={80}
        outerRadius={130}
        startAngle={0}
      >
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name) => (
                <span>
                  {chartConfig[name as keyof typeof chartConfig]?.label}: $
                  {Number(value).toLocaleString()}
                </span>
              )}
            />
          }
        />
        <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) - 16}
                      className="fill-foreground text-3xl font-bold"
                    >
                      {rate}%
                    </tspan>
                    <tspan
                      x={viewBox.cx}
                      y={(viewBox.cy || 0) + 8}
                      className="fill-muted-foreground text-sm"
                    >
                      Collection Rate
                    </tspan>
                  </text>
                );
              }
            }}
          />
        </PolarRadiusAxis>
        <RadialBar
          dataKey="collected"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-collected)"
          className="stroke-transparent stroke-2"
        />
        <RadialBar
          dataKey="remaining"
          stackId="a"
          cornerRadius={5}
          fill="var(--color-remaining)"
          className="stroke-transparent stroke-2"
        />
      </RadialBarChart>
    </ChartContainer>
  );
}

// Sample data for demonstration
export const sampleCollectionRateData: CollectionRateData = {
  collected: 78500,
  total: 95000,
};
