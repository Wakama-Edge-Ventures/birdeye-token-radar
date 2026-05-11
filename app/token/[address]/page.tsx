import type { Metadata } from "next";
import Link from "next/link";

import PriceChart from "@/components/PriceChart";
import SafetyBadge from "@/components/SafetyBadge";
import { buildBirdeyeTokenUrl, getTokenOverview, getTokenPriceHistory } from "@/lib/birdeye";
import {
  deriveRiskMetricsFromOverview,
  getSafetyLabel,
  getSafetyScoreResult,
} from "@/lib/safety-score";

export const dynamic = "force-dynamic";

type TokenDetailPageProps = {
  params: Promise<{ address: string }>;
};

export async function generateMetadata({
  params,
}: TokenDetailPageProps): Promise<Metadata> {
  const { address } = await params;
  const shortAddress = truncateAddress(address);

  return {
    title: `${shortAddress} | Token Detail`,
    description: `Overview, price history, and overview-based risk scoring for Solana token ${shortAddress}.`,
  };
}

export default async function TokenDetailPage({
  params,
}: TokenDetailPageProps) {
  const { address } = await params;
  const result = await loadTokenDetailPageData(address);

  if (!result.ok) {
    return (
      <div className="min-h-screen bg-[#0a0e17] text-slate-100">
        <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-4 py-8 text-center">
          <div className="rounded-[30px] border border-rose-400/20 bg-rose-500/10 px-8 py-8 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-rose-300">
              Token detail unavailable
            </div>
            <h1 className="mt-3 font-mono text-3xl font-semibold text-slate-50">
              We could not load this token right now
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              {result.message}
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
              >
                Return to dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { overview, priceHistory, riskMetrics, safety } = result;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      <main className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Back to dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-400">
              Solana
            </span>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Powered by Birdeye Data
            </span>
          </div>
        </div>

        <section className="rounded-[30px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(6,214,160,0.14),transparent_30%),linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <TokenAvatar
                  logoUri={overview.logoUri}
                  name={overview.name}
                  symbol={overview.symbol}
                />
                <div>
                  <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
                    Token detail
                  </div>
                  <h1 className="mt-1 font-mono text-3xl font-semibold text-slate-50 sm:text-4xl">
                    {overview.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-400">
                    <span className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 font-mono uppercase tracking-[0.18em] text-slate-200">
                      {overview.symbol}
                    </span>
                    <span className="font-mono">{overview.address}</span>
                  </div>
                </div>
              </div>

              <p className="max-w-3xl text-sm leading-7 text-slate-400">
                {overview.description ??
                  "Live Birdeye overview data with an overview-based risk model built from holder count, liquidity, 24h volume, and market cap."}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3 xl:items-end">
              <SafetyBadge score={safety.score} level={safety.level} />
              <p className="max-w-sm text-sm leading-6 text-slate-400 xl:text-right">
                {safety.level
                  ? `${getSafetyLabel(safety.level)} signal based on free-plan overview metrics instead of paid security metadata.`
                  : "Risk score unavailable until Birdeye returns holder, liquidity, volume, and market cap metrics."}
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Price"
            value={formatPrice(overview.price)}
            tone="neutral"
          />
          <MetricCard
            label="Market Cap"
            value={formatCompactCurrency(overview.marketCap)}
            tone={getMetricTone(riskMetrics.marketCap, 50_000, 500_000)}
          />
          <MetricCard
            label="Liquidity"
            value={formatCompactCurrency(overview.liquidity)}
            tone={getMetricTone(riskMetrics.liquidity, 10_000, 100_000)}
          />
          <MetricCard
            label="Volume 24h"
            value={formatCompactCurrency(overview.volume24h)}
            tone={getMetricTone(riskMetrics.volume24h, 5_000, 50_000)}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <div className="space-y-4 rounded-[30px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
                  Price history
                </div>
                <h2 className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                  24-hour chart
                </h2>
              </div>
              <div className={joinClasses("font-mono text-sm", getChangeClassName(overview.priceChange24hPercent))}>
                {formatPercent(overview.priceChange24hPercent)}
              </div>
            </div>
            <PriceChart points={priceHistory} />
          </div>

          <div className="space-y-6">
            <section className="rounded-[30px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
                Risk breakdown
              </div>
              <h2 className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                Overview-based score
              </h2>
              <div className="mt-5 space-y-4">
                {safety.breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-100">{item.label}</div>
                      <span
                        className={joinClasses(
                          "rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]",
                          getLevelBadgeClassName(item.level),
                        )}
                      >
                        {item.level ? getSafetyLabel(item.level) : "N/A"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
                Holder stats
              </div>
              <h2 className="mt-1 font-mono text-2xl font-semibold text-slate-50">
                Token fundamentals
              </h2>
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <DetailMetric label="Holders" value={formatInteger(overview.holderCount)} />
                <DetailMetric label="Supply" value={formatInteger(overview.supply)} />
                <DetailMetric
                  label="Circulating supply"
                  value={formatInteger(overview.circulatingSupply)}
                />
                <DetailMetric
                  label="FDV"
                  value={formatCompactCurrency(overview.fullyDilutedValuation)}
                />
              </dl>
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
          <section className="rounded-[30px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
              Links
            </div>
            <h2 className="mt-1 font-mono text-2xl font-semibold text-slate-50">
              Research trail
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              <ExternalLink href={buildBirdeyeTokenUrl(overview.address)} label="Birdeye" />
              {overview.website ? <ExternalLink href={overview.website} label="Website" /> : null}
              {overview.xUrl ? <ExternalLink href={overview.xUrl} label="X" /> : null}
              {overview.telegramUrl ? (
                <ExternalLink href={overview.telegramUrl} label="Telegram" />
              ) : null}
              {overview.discordUrl ? (
                <ExternalLink href={overview.discordUrl} label="Discord" />
              ) : null}
            </div>
          </section>

          <section className="rounded-[30px] border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
            <div className="text-[11px] uppercase tracking-[0.28em] text-emerald-300">
              Risk model
            </div>
            <h2 className="mt-1 font-mono text-2xl font-semibold text-slate-50">
              Free-plan scoring rules
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-400">
              <li>Holder count below 100 is treated as dangerous, 100 to 1,000 as caution, above 1,000 as safer.</li>
              <li>Liquidity below $10K is treated as dangerous, $10K to $100K as caution, above $100K as safer.</li>
              <li>24h volume below $5K is treated as dangerous, $5K to $50K as caution, above $50K as safer.</li>
              <li>Market cap below $50K is treated as dangerous, $50K to $500K as caution, above $500K as safer.</li>
            </ul>
          </section>
        </section>
      </main>
    </div>
  );
}

async function loadTokenDetailPageData(address: string) {
  try {
    const overview = await getTokenOverview(address);
    const priceHistory = await getTokenPriceHistory(address).catch(() => []);
    const riskMetrics = deriveRiskMetricsFromOverview(overview);
    const safety = getSafetyScoreResult(riskMetrics);

    return {
      ok: true as const,
      overview,
      priceHistory,
      riskMetrics,
      safety,
    };
  } catch (error) {
    return {
      ok: false as const,
      message:
        error instanceof Error
          ? error.message
          : "Failed to load the token detail page.",
    };
  }
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "safe" | "caution" | "danger" | "neutral";
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
          {label}
        </div>
        <span className={joinClasses("h-2.5 w-2.5 rounded-full", getToneDotClassName(tone))} />
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold text-slate-50">
        {value}
      </div>
    </article>
  );
}

function DetailMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <dt className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 font-mono text-lg text-slate-100">{value}</dd>
    </div>
  );
}

function TokenAvatar({
  logoUri,
  name,
  symbol,
}: {
  logoUri: string | null;
  name: string;
  symbol: string;
}) {
  const fallback = symbol.slice(0, 2).toUpperCase() || name.slice(0, 2).toUpperCase();

  if (logoUri) {
    return (
      <img
        src={logoUri}
        alt={`${name} logo`}
        className="h-16 w-16 rounded-3xl border border-slate-700 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-slate-700 bg-slate-950 font-mono text-sm text-slate-300">
      {fallback}
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-emerald-400/40 hover:text-emerald-300"
    >
      {label}
    </a>
  );
}

function formatPrice(value: number | null) {
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

function formatInteger(value: number | null) {
  if (value === null) {
    return "--";
  }

  return new Intl.NumberFormat("en-US").format(value);
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

function getMetricTone(value: number | null, dangerMax: number, cautionMax: number) {
  if (value === null || value < dangerMax) {
    return "danger";
  }

  if (value <= cautionMax) {
    return "caution";
  }

  return "safe";
}

function getToneDotClassName(tone: "safe" | "caution" | "danger" | "neutral") {
  if (tone === "safe") {
    return "bg-emerald-400 shadow-[0_0_18px_rgba(6,214,160,0.38)]";
  }

  if (tone === "caution") {
    return "bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.3)]";
  }

  if (tone === "danger") {
    return "bg-rose-400 shadow-[0_0_18px_rgba(239,68,68,0.3)]";
  }

  return "bg-slate-500";
}

function getLevelBadgeClassName(level: "safe" | "caution" | "danger" | null) {
  if (level === null) {
    return "border border-slate-700 bg-slate-900 text-slate-400";
  }

  if (level === "safe") {
    return "border border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  }

  if (level === "caution") {
    return "border border-amber-400/20 bg-amber-500/10 text-amber-300";
  }

  return "border border-rose-400/20 bg-rose-500/10 text-rose-300";
}

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}
