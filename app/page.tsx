"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
} from "react";

import ApiCallCounter from "@/components/ApiCallCounter";
import Header from "@/components/Header";
import NewListingsFeed from "@/components/NewListingsFeed";
import TrendingTable from "@/components/TrendingTable";
import type {
  ApiErrorResponse,
  NewListingsResponse,
  NewListingToken,
  TokenRadarToken,
  TokenRiskResponse,
  TrendingToken,
  TrendingTokensResponse,
} from "@/lib/types";

const AUTO_REFRESH_INTERVAL_MS = 30_000;
type LoadingPhase = "idle" | "trending" | "newListings" | "safety" | "complete";

export default function Home() {
  const [trendingTokens, setTrendingTokens] = useState<TrendingToken[]>([]);
  const [newListings, setNewListings] = useState<NewListingToken[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiCallCount, setApiCallCount] = useState(0);
  const [totalTokensScanned, setTotalTokensScanned] = useState(0);
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");

  const refreshDashboard = useEffectEvent(async (showInitialOverlay = false) => {
    setIsRefreshing(true);
    setErrorMessage(null);

    try {
      if (showInitialOverlay) {
        setLoadingPhase("trending");
      }

      const trendingResponse = await fetchJson<TrendingTokensResponse>(
        "/api/tokens/trending",
      );

      startTransition(() => {
        setTrendingTokens(trendingResponse.tokens);
      });

      if (showInitialOverlay) {
        setLoadingPhase("newListings");
      }

      const newListingsResponse = await fetchJson<NewListingsResponse>(
        "/api/tokens/new",
      );

      const tokensScannedThisCycle =
        trendingResponse.tokens.length + newListingsResponse.tokens.length;
      const apiCallsThisCycle = 2 + tokensScannedThisCycle;
      const refreshedAt = new Date().toISOString();

      startTransition(() => {
        setNewListings(newListingsResponse.tokens);
        setLastRefreshedAt(refreshedAt);
        setApiCallCount((current) => current + apiCallsThisCycle);
        setTotalTokensScanned((current) => current + tokensScannedThisCycle);
      });

      if (showInitialOverlay) {
        setLoadingPhase("safety");
      }

      await enrichTokensWithSafety(
        trendingResponse.tokens,
        (updatedToken, index) => {
          setTrendingTokens((current) =>
            replaceTokenAtIndex(current, index, updatedToken as TrendingToken),
          );
        },
      );

      await enrichTokensWithSafety(
        newListingsResponse.tokens,
        (updatedToken, index) => {
          setNewListings((current) =>
            replaceTokenAtIndex(current, index, updatedToken as NewListingToken),
          );
        },
      );

      if (showInitialOverlay) {
        setLoadingPhase("complete");
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load Birdeye dashboard data.",
      );
    } finally {
      setHasLoadedOnce(true);
      setIsRefreshing(false);
      if (showInitialOverlay) {
        setLoadingPhase("complete");
      }
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshDashboard(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshDashboard();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [autoRefresh]);

  const isInitialLoading = !hasLoadedOnce && isRefreshing;
  const hasData = trendingTokens.length > 0 || newListings.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0e17] text-slate-100">
      {!hasLoadedOnce ? <InitialLoadingOverlay phase={loadingPhase} /> : null}
      <div className="mx-auto flex min-h-screen w-full max-w-[1800px] gap-6 px-4 py-4 sm:px-6 sm:py-6">
        <aside className="hidden w-[260px] shrink-0 xl:flex xl:flex-col">
          <div className="sticky top-6 flex flex-1 flex-col rounded-[32px] border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.34em] text-emerald-300">
                Birdeye Token Radar
              </div>
              <h2 className="mt-3 font-mono text-2xl font-semibold text-slate-50">
                Solana early-warning dashboard
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Track fresh launches, trending momentum, and fast safety checks
                without exposing the API key client-side.
              </p>
            </div>

            <nav className="mt-8 space-y-3">
              <SidebarLink href="#overview" label="Overview" accent />
              <SidebarLink href="#trending" label="Trending Tokens" />
              <SidebarLink href="#new-listings" label="New Listings" />
            </nav>

            <div className="mt-8 space-y-4 rounded-3xl border border-slate-800 bg-slate-950/60 p-4">
              <SidebarMetric
                label="Tokens scanned"
                value={formatInteger(totalTokensScanned)}
              />
              <SidebarMetric
                label="API calls made"
                value={formatInteger(apiCallCount)}
              />
              <SidebarMetric
                label="Refresh cadence"
                value={autoRefresh ? "30 seconds" : "Manual"}
              />
            </div>

            <div className="mt-auto rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-300">
                Submission target
              </div>
              <p className="mt-2 text-sm leading-6 text-emerald-100/90">
                Keep the live feed running long enough to push the visible API
                counter past 50 calls for the Birdeye sprint checklist.
              </p>
            </div>
          </div>
        </aside>

        <main className="flex-1 space-y-6" id="overview">
          <Header
            autoRefresh={autoRefresh}
            lastRefreshedAt={lastRefreshedAt}
            totalTokensScanned={totalTokensScanned}
            onAutoRefreshChange={setAutoRefresh}
            counterSlot={
              <ApiCallCounter count={apiCallCount} label="API calls made" />
            }
          />

          <section className="grid gap-4 lg:grid-cols-3">
            <SummaryCard
              label="Trending tokens"
              value={formatInteger(trendingTokens.length)}
              description="Top Solana movers ranked by Birdeye trending data."
            />
            <SummaryCard
              label="New listings"
              value={formatInteger(newListings.length)}
              description="Fresh token launches discovered from the live listing feed."
            />
            <SummaryCard
              label="Safety coverage"
              value={`${formatCoverage([
                ...trendingTokens,
                ...newListings,
              ])}%`}
              description="How many visible tokens already have security data attached."
            />
          </section>

          {errorMessage ? (
            <section className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              <div className="font-medium">Birdeye sync warning</div>
              <p className="mt-1 text-rose-100/80">{errorMessage}</p>
            </section>
          ) : null}

          {!hasData && !isInitialLoading ? (
            <section className="rounded-3xl border border-slate-800 bg-slate-950/70 px-6 py-10 text-center text-slate-400">
              No token data is available yet. Start a refresh or check the Birdeye
              API key configuration.
            </section>
          ) : null}

          <section id="trending" className="space-y-4">
            <SectionHeading
              eyebrow="Top section"
              title="Trending Tokens"
              description="Each row pulls Birdeye trending data first, then fetches overview-based risk metrics to compute the safety score."
            />
            <TrendingTable
              tokens={trendingTokens}
              isLoading={isInitialLoading}
            />
          </section>

          <section id="new-listings" className="space-y-4">
            <SectionHeading
              eyebrow="Bottom section"
              title="New Listings Feed"
              description="Fresh Solana launches with relative listing time, Birdeye links, and safety badges once the overview-based risk lookups complete."
            />
            <NewListingsFeed
              tokens={newListings}
              isLoading={isInitialLoading}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]">
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold text-slate-50">
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-emerald-300">
        {eyebrow}
      </div>
      <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="font-mono text-2xl font-semibold text-slate-50">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  label,
  accent = false,
}: {
  href: string;
  label: string;
  accent?: boolean;
}) {
  return (
    <a
      href={href}
      className={joinClasses(
        "flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
        accent
          ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
          : "border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80",
      )}
    >
      <span>{label}</span>
      <span className="font-mono text-xs uppercase tracking-[0.24em]">
        Go
      </span>
    </a>
  );
}

function SidebarMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-mono text-xl font-semibold text-slate-100">
        {value}
      </div>
    </div>
  );
}

async function enrichTokensWithSafety<T extends TokenRadarToken>(
  tokens: T[],
  onTokenResolved: (token: T, index: number) => void,
): Promise<void> {
  for (const [index, token] of tokens.entries()) {
    if (index > 0) {
      await sleep(1_000);
    }

    try {
      const response = await fetchJson<TokenRiskResponse>(
        `/api/tokens/security?address=${encodeURIComponent(token.address)}`,
      );

      const enrichedToken = {
        ...token,
        price: response.token.price ?? token.price,
        priceChange24hPercent:
          response.token.priceChange24hPercent ?? token.priceChange24hPercent,
        volume24h: response.token.volume24h ?? token.volume24h,
        marketCap: response.token.marketCap ?? token.marketCap,
        liquidity: response.token.liquidity ?? token.liquidity,
        riskMetrics: response.riskMetrics,
        safetyScore: response.safety.score,
        safetyLevel: response.safety.level,
      } satisfies T;

      onTokenResolved(enrichedToken, index);
    } catch {
      onTokenResolved(token, index);
    }
  }
}

async function fetchJson<T>(input: string): Promise<T> {
  const response = await fetch(input, {
    cache: "no-store",
  });

  let payload: T | ApiErrorResponse | null = null;

  try {
    payload = (await response.json()) as T | ApiErrorResponse;
  } catch {
    throw new Error("Received an unreadable response from the dashboard API.");
  }

  if (!response.ok) {
    const apiError = payload as ApiErrorResponse;
    throw new Error(
      apiError.details
        ? `${apiError.error} ${apiError.details}`
        : apiError.error ?? "Dashboard request failed.",
    );
  }

  return payload as T;
}

function formatCoverage(tokens: TokenRadarToken[]) {
  if (!tokens.length) {
    return 0;
  }

  const covered = tokens.filter((token) => token.riskMetrics !== null).length;
  return Math.round((covered / tokens.length) * 100);
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function replaceTokenAtIndex<T>(tokens: T[], index: number, token: T) {
  return tokens.map((currentToken, currentIndex) =>
    currentIndex === index ? token : currentToken,
  );
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function InitialLoadingOverlay({ phase }: { phase: LoadingPhase }) {
  const steps = [
    { id: "trending", label: "Fetching trending tokens..." },
    { id: "newListings", label: "Fetching new listings..." },
    { id: "safety", label: "Computing safety scores..." },
  ] satisfies Array<{ id: Exclude<LoadingPhase, "idle" | "complete">; label: string }>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,14,23,0.88)] backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[32px] border border-slate-800 bg-[linear-gradient(180deg,rgba(17,24,39,0.98),rgba(10,14,23,0.98))] p-8 shadow-[0_32px_90px_rgba(0,0,0,0.4)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-emerald-300">
          Syncing with Birdeye
        </div>
        <h2 className="mt-3 font-mono text-3xl font-semibold text-slate-50">
          Loading dashboard data
        </h2>
        <p className="mt-3 animate-pulse text-sm leading-6 text-slate-400">
          Syncing with Birdeye...
        </p>

        <div className="mt-6 space-y-3">
          {steps.map((step, index) => {
            const status = getStepStatus(phase, step.id, index);

            return (
              <div
                key={step.id}
                className={joinClasses(
                  "flex items-center justify-between rounded-2xl border px-4 py-3 transition",
                  status === "complete"
                    ? "border-emerald-400/20 bg-emerald-500/10"
                    : status === "active"
                      ? "border-slate-700 bg-slate-900/80"
                      : "border-slate-800 bg-slate-950/60",
                )}
              >
                <span className="text-sm text-slate-200">{step.label}</span>
                <span
                  className={joinClasses(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.22em]",
                    status === "complete"
                      ? "bg-emerald-500/15 text-emerald-300"
                      : status === "active"
                        ? "animate-pulse bg-amber-500/15 text-amber-300"
                        : "bg-slate-900 text-slate-500",
                  )}
                >
                  {status === "complete"
                    ? "Done"
                    : status === "active"
                      ? "Live"
                      : "Queued"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getStepStatus(
  phase: LoadingPhase,
  step: "trending" | "newListings" | "safety",
  index: number,
) {
  const phaseOrder: LoadingPhase[] = [
    "idle",
    "trending",
    "newListings",
    "safety",
    "complete",
  ];
  const currentPhaseIndex = phaseOrder.indexOf(phase);
  const stepPhaseIndex = phaseOrder.indexOf(step);

  if (phase === "complete") {
    return "complete";
  }

  if (currentPhaseIndex > stepPhaseIndex) {
    return "complete";
  }

  if (phase === step) {
    return "active";
  }

  return index === 0 && phase === "idle" ? "active" : "pending";
}
