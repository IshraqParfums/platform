"use client";

import { useId } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  resolveChartValueFormat,
  type ChartValueFormat,
} from "@/components/ui/chart-value-format";
import { cn } from "@/lib/cn";

export type { ChartValueFormat };

export function ChartLine({
  data,
  valueFormat = "number",
  className,
}: {
  data: { label: string; value: number }[];
  valueFormat?: ChartValueFormat;
  className?: string;
}) {
  const gradientId = useId();
  const formatValue = resolveChartValueFormat(valueFormat);

  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-gold)"
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor="var(--color-gold)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="color-mix(in srgb, var(--color-ink) 8%, transparent)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={formatValue}
          />
          <Tooltip
            formatter={(value) => formatValue(Number(value))}
            contentStyle={{
              borderRadius: 8,
              borderColor: "color-mix(in srgb, var(--color-ink) 12%, transparent)",
              fontSize: 13,
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--color-gold-deep)"
            strokeWidth={2}
            fill={`url(#${gradientId})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
