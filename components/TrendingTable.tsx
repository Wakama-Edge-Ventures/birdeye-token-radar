"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import SafetyBadge from "@/components/SafetyBadge";
import { TrendingTableSkeleton } from "@/components/SkeletonLoader";
import type { TrendingToken } from "@/lib/types";

interface TrendingTableProps {
  tokens: TrendingToken[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function TrendingTable({
  tokens,
  isLoading = false,
  emptyMessage = "No trending tokens available right now.",
}: TrendingTableProps) {
  const [expandedAddress, setExpandedAddress] = useState<string | null>(null);

  if (isLoading) {
    return <TrendingTableSkeleton />;
  }

  if (!tokens.length) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-950/70 p-10 text-center text-slate-400">
        {emptyMessage}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/70 shadow-[0_18px_70px_rgba(0,0,0,0.28)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-800 bg-slate-950/90">
            <tr className="text-left text-[11px] uppercase tracking-[0.24em] text-slate-500">
              <th className="px-6 py-4 font-medium">Rank</th>
              <th className="px-6 py-4 font-medium">Token</th>
              <th className="px-6 py-4 font-medium">Price</th>
              <th className="px-6 py-4 font-medium">24h Change</th>
              <th className="px-6 py-4 font-medium">Volume 24h</th>
              <th className="px-6 py-4 font-medium">Safety Score</th>
              <th className="px-6 py-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {tokens.map((token) => {
              const isExpanded = expandedAddress === token.address;
              const isPending = token.riskMetrics === null;

              return (
                <FragmentRow
                  key={token.address}
                  isExpanded={isExpanded}
                  summaryRow={
                    <tr
                      onClick={() =>
                        setExpandedAddress(isExpanded ? null : token.address)
                      }
                      className={joinClasses(
                        "cursor-pointer border-b border-slate-900/80 transition hover:bg-slate-900/70",
                        isPending
                          ? "animate-pulse bg-[linear-gradient(110deg,rgba(17,24,39,0.85),rgba(30,41,59,0.7),rgba(17,24,39,0.85))] bg-[length:200%_100%]"
                          : undefined,
                      )}
                    >
                      <td className="px-6 py-5 font-mono text-sm text-slate-300">
                        {token.rank ?? "--"}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <TokenAvatar
                            name={token.name}
                            logoUri={token.logoUri}
                            symbol={token.symbol}
                          />
                          <div>
                            <div className="font-medium text-slate-100">
                              {token.name}
                            </div>
                            <div className="text-sm uppercase tracking-[0.18em] text-slate-500">
                              {token.symbol}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-slate-100">
                        {formatCurrency(token.price)}
                      </td>
                      <td
                        className={joinClasses(
                          "px-6 py-5 font-mono text-sm",
                          getChangeClassName(token.priceChange24hPercent),
                        )}
                      >
                        {formatPercent(token.priceChange24hPercent)}
                      </td>
                      <td className="px-6 py-5 font-mono text-sm text-slate-300">
                        {formatCompactCurrency(token.volume24h)}
                      </td>
                      <td className="px-6 py-5">
                        <SafetyBadge
                          score={token.safetyScore}
                          level={token.safetyLevel}
                        />
                      </td>
                      <td className="px-6 py-5">
                        <a
                          href={token.birdeyeUrl}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/20"
                        >
                          Birdeye
                        </a>
                      </td>
                    </tr>
                  }
                  detailRow={
                    <tr className="border-b border-slate-900/80 bg-slate-900/35">
                      <td colSpan={7} className="px-6 py-5">
                        <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                              Token profile
                            </div>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <InfoItem label="Address" value={truncateAddress(token.address)} mono />
                              <InfoItem label="Market cap" value={formatCompactCurrency(token.marketCap)} />
                              <InfoItem label="Liquidity" value={formatCompactCurrency(token.liquidity)} />
                              <InfoItem label="24h volume" value={formatCompactCurrency(token.volume24h)} />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                            <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                              Risk snapshot
                            </div>
                            {token.riskMetrics ? (
                              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                <InfoItem
                                  label="Holder count"
                                  value={
                                    token.riskMetrics.holderCount !== null
                                      ? formatNumber(token.riskMetrics.holderCount)
                                      : "--"
                                  }
                                />
                                <InfoItem
                                  label="Liquidity"
                                  value={formatCompactCurrency(token.riskMetrics.liquidity)}
                                />
                                <InfoItem
                                  label="Volume 24h"
                                  value={formatCompactCurrency(token.riskMetrics.volume24h)}
                                />
                                <InfoItem
                                  label="Market cap"
                                  value={formatCompactCurrency(token.riskMetrics.marketCap)}
                                />
                              </div>
                            ) : (
                              <p className="mt-3 text-sm text-slate-400">
                                Risk metrics are still loading for this token.
                              </p>
                            )}

                            <div className="mt-4 flex flex-wrap gap-3">
                              <Link
                                href={`/token/${token.address}`}
                                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
                              >
                                Open detail page
                              </Link>
                              <a
                                href={token.birdeyeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
                              >
                                View on Birdeye
                              </a>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FragmentRow({
  isExpanded,
  summaryRow,
  detailRow,
}: {
  isExpanded: boolean;
  summaryRow: ReactNode;
  detailRow: ReactNode;
}) {
  return (
    <>
      {summaryRow}
      {isExpanded ? detailRow : null}
    </>
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
        className="h-11 w-11 rounded-full border border-slate-700 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-700 bg-slate-900 font-mono text-xs text-slate-300">
      {fallback}
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
        {label}
      </div>
      <div className={joinClasses("mt-1 text-sm text-slate-200", mono ? "font-mono" : undefined)}>
        {value}
      </div>
    </div>
  );
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

function formatCompactCurrency(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "--";
  }

  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function getChangeClassName(value: number | null) {
  if (value === null) {
    return "text-slate-400";
  }

  if (value > 0) {
    return "text-emerald-300";
  }

  if (value < 0) {
    return "text-rose-300";
  }

  return "text-slate-300";
}

function truncateAddress(value: string) {
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
