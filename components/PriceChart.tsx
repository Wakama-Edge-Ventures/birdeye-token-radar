"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SkeletonLoader from "@/components/SkeletonLoader";
import type { PriceHistoryPoint } from "@/lib/types";

interface PriceChartProps {
  points: PriceHistoryPoint[];
  isLoading?: boolean;
  height?: number;
}

export default function PriceChart({
  points,
  isLoading = false,
  height = 320,
}: PriceChartProps) {
  if (isLoading) {
    return <SkeletonLoader className="h-[320px] rounded-3xl border border-slate-800/80" />;
  }

  if (!points.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/70 text-sm text-slate-400">
        No price history available yet.
      </div>
    );
  }

  const chartData = points.map((point) => ({
    timestamp: point.timestamp,
    value: point.value,
    label: formatXAxisLabel(point.timestamp),
  }));

  return (
    <div
      className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"
      style={{ height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="rgba(51,65,85,0.35)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            minTickGap={32}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: "#64748b", fontSize: 12 }}
            tickFormatter={formatYAxisLabel}
            width={68}
          />
          <Tooltip
            cursor={{ stroke: "rgba(6,214,160,0.25)", strokeWidth: 1 }}
            contentStyle={{
              background: "rgba(15, 23, 42, 0.95)",
              border: "1px solid rgba(51,65,85,0.8)",
              borderRadius: "16px",
              color: "#f8fafc",
            }}
            formatter={(value) => [
              formatTooltipPrice(
                typeof value === "number" ? value : Number(value ?? 0),
              ),
              "Price",
            ]}
            labelFormatter={(_, payload) => {
              const point = payload?.[0]?.payload as { timestamp?: number } | undefined;
              return point?.timestamp ? formatTooltipDate(point.timestamp) : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#06d6a0"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: "#06d6a0", stroke: "#0a0e17", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function formatXAxisLabel(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}

function formatYAxisLabel(value: number) {
  if (value >= 1) {
    return `$${value.toFixed(2)}`;
  }

  return `$${value.toFixed(4)}`;
}

function formatTooltipPrice(value: number) {
  if (value >= 1) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })}`;
  }

  return `$${value.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 8,
  })}`;
}

function formatTooltipDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp * 1000));
}
