"use client";

import Link from "next/link";

import SafetyBadge from "@/components/SafetyBadge";
import { NewListingsSkeleton } from "@/components/SkeletonLoader";
import type { NewListingToken } from "@/lib/types";

interface NewListingsFeedProps {
  tokens: NewListingToken[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function NewListingsFeed({
  tokens,
  isLoading = false,
  emptyMessage = "No fresh Solana listings found right now.",
}: NewListingsFeedProps) {
  if (isLoading) {
    return <NewListingsSkeleton />;
  }

  if (!tokens.length) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center text-slate-400">
        {emptyMessage}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {tokens.map((token) => {
        const isPending = token.riskMetrics === null;

        return (
          <article
            key={token.address}
            className={joinClasses(
              "group rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:border-emerald-400/25",
              isPending
                ? "animate-pulse bg-[linear-gradient(110deg,rgba(17,24,39,0.96),rgba(30,41,59,0.82),rgba(17,24,39,0.96))] bg-[length:200%_100%]"
                : undefined,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <TokenAvatar
                    name={token.name}
                    symbol={token.symbol}
                    logoUri={token.logoUri}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold text-slate-100">
                      {token.name}
                    </h3>
                    <p className="truncate text-xs uppercase tracking-[0.24em] text-slate-500">
                      {token.symbol}
                    </p>
                  </div>
                </div>
              </div>
              <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                New
              </span>
            </div>

            <div className="mt-5">
              <SafetyBadge
                score={token.safetyScore}
                level={token.safetyLevel}
                showScore={false}
              />
            </div>

            <dl className="mt-5 space-y-3">
              <Metric label="Listed" value={formatRelativeTime(token)} />
              <Metric label="Price" value={formatCurrency(token.price)} />
              <Metric label="Address" value={truncateAddress(token.address)} mono />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/token/${token.address}`}
                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                Deep dive
              </Link>
              <a
                href={token.birdeyeUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
              >
                Birdeye
              </a>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function Metric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-900/80 pb-3 last:border-none last:pb-0">
      <dt className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </dt>
      <dd className={joinClasses("text-right text-sm text-slate-200", mono ? "font-mono" : undefined)}>
        {value}
      </dd>
    </div>
  );
}

function TokenAvatar({
  name,
  symbol,
  logoUri,
}: {
  name: string;
  symbol: string;
  logoUri: string | null;
}) {
  const fallback = symbol.slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();

  if (logoUri) {
    return (
      <img
        src={logoUri}
        alt={`${name} logo`}
        className="h-12 w-12 rounded-2xl border border-slate-700 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900 font-mono text-xs text-slate-300">
      {fallback}
    </div>
  );
}

function formatRelativeTime(token: NewListingToken) {
  const timestamp =
    token.listedAtUnix ??
    (token.listedAt ? Math.floor(new Date(token.listedAt).getTime() / 1000) : null);

  if (!timestamp) {
    return "Unknown";
  }

  const now = Math.floor(Date.now() / 1000);
  const diff = timestamp - now;
  const abs = Math.abs(diff);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (abs < 60) {
    return formatter.format(Math.round(diff), "second");
  }

  if (abs < 3600) {
    return formatter.format(Math.round(diff / 60), "minute");
  }

  if (abs < 86400) {
    return formatter.format(Math.round(diff / 3600), "hour");
  }

  return formatter.format(Math.round(diff / 86400), "day");
}

function formatCurrency(value: number | null) {
  if (value === null) {
    return "--";
  }

  if (value < 0.01) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 6,
      maximumFractionDigits: 6,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(value);
}

function truncateAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
