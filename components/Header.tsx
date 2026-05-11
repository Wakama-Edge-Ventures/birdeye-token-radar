"use client";

import type { ReactNode } from "react";

interface HeaderProps {
  autoRefresh: boolean;
  lastRefreshedAt?: string | null;
  totalTokensScanned: number;
  chain?: string;
  counterSlot?: ReactNode;
  onAutoRefreshChange?: (enabled: boolean) => void;
}

export default function Header({
  autoRefresh,
  lastRefreshedAt,
  totalTokensScanned,
  chain = "Solana",
  counterSlot,
  onAutoRefreshChange,
}: HeaderProps) {
  return (
    <header className="rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(6,214,160,0.18),transparent_32%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] px-5 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:px-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 font-mono text-xs uppercase tracking-[0.24em] text-emerald-300">
              Token Radar
            </span>
            <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-medium text-slate-300">
              Powered by Birdeye Data
            </span>
          </div>
          <div>
            <h1 className="font-mono text-3xl font-semibold tracking-tight text-slate-50 sm:text-4xl">
              New token radar with safety scoring
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Fresh Solana listings, trending movers, and instant rug-risk context
              in one live dashboard.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[520px] xl:max-w-[560px] xl:flex-1">
          <StatusChip label="Chain" value={chain} isLive={false} />
          <StatusChip
            label="Last refreshed"
            value={formatTimestamp(lastRefreshedAt)}
            isLive={autoRefresh}
          />
          <button
            type="button"
            onClick={() => onAutoRefreshChange?.(!autoRefresh)}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-left transition hover:border-emerald-400/30 hover:bg-slate-900"
          >
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Auto-refresh
              </div>
              <div className="mt-1 text-sm font-medium text-slate-100">
                {autoRefresh ? "Every 30s" : "Paused"}
              </div>
            </div>
            <div
              className={joinClasses(
                "relative h-7 w-13 rounded-full border transition",
                autoRefresh
                  ? "border-emerald-400/40 bg-emerald-500/20"
                  : "border-slate-700 bg-slate-900",
              )}
            >
              <span
                className={joinClasses(
                  "absolute top-1 h-5 w-5 rounded-full transition",
                  autoRefresh
                    ? "left-7 bg-emerald-300 shadow-[0_0_18px_rgba(6,214,160,0.4)]"
                    : "left-1 bg-slate-500",
                )}
              />
            </div>
          </button>

          {counterSlot ?? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Total tokens scanned
              </div>
              <div className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                {formatInteger(totalTokensScanned)}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusChip({
  label,
  value,
  isLive,
}: {
  label: string;
  value: string;
  isLive: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-500">
        <span>{label}</span>
        {isLive ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        ) : null}
      </div>
      <div className="mt-1 text-sm font-medium text-slate-100">{value}</div>
    </div>
  );
}

function formatTimestamp(value?: string | null) {
  if (!value) {
    return "Waiting for first sync";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
