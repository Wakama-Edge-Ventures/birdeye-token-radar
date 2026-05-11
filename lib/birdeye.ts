import "server-only";

import type {
  BirdeyeApiResponse,
  BirdeyeListData,
  BirdeyeNewListingTokenRaw,
  BirdeyePriceHistoryPointRaw,
  BirdeyeTokenOverviewRaw,
  BirdeyeTrendingTokenRaw,
  NewListingToken,
  NumericLike,
  PriceHistoryPoint,
  TokenOverview,
  TrendingToken,
} from "@/lib/types";

const BIRDEYE_API_BASE_URL = "https://public-api.birdeye.so";
const BIRDEYE_CHAIN = "solana";
const DEFAULT_TRENDING_LIMIT = 10;
const DEFAULT_NEW_LISTINGS_LIMIT = 10;
const DEFAULT_PRICE_HISTORY_TYPE = "1H";
const DEFAULT_PRICE_HISTORY_LOOKBACK_SECONDS = 24 * 60 * 60;
const RATE_LIMIT_RETRY_DELAY_MS = 5_000;
const MAX_RATE_LIMIT_RETRIES = 1;
let hasLoggedTrendingSample = false;
let hasLoggedOverviewSample = false;

export type BirdeyePriceHistoryType =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1H"
  | "2H"
  | "4H"
  | "6H"
  | "8H"
  | "12H"
  | "1D"
  | "3D"
  | "1W"
  | "1M";

export interface BirdeyePriceHistoryOptions {
  type?: BirdeyePriceHistoryType;
  timeFrom?: number;
  timeTo?: number;
}

export class BirdeyeApiError extends Error {
  readonly status: number;
  readonly details: string | null;

  constructor(message: string, status = 500, details: string | null = null) {
    super(message);
    this.name = "BirdeyeApiError";
    this.status = status;
    this.details = details;
  }
}

export function buildBirdeyeTokenUrl(address: string): string {
  return `https://birdeye.so/token/${address}?chain=${BIRDEYE_CHAIN}`;
}

export async function getTrendingTokens(): Promise<TrendingToken[]> {
  const response = await birdeyeGet<BirdeyeListData<BirdeyeTrendingTokenRaw>>(
    "/defi/token_trending",
    {
      sort_by: "rank",
      sort_type: "asc",
      offset: 0,
      limit: DEFAULT_TRENDING_LIMIT,
    },
  );

  return extractListItems<BirdeyeTrendingTokenRaw>(response.data).map(
    normalizeTrendingToken,
  );
}

export async function getNewListings(): Promise<NewListingToken[]> {
  const response = await birdeyeGet<BirdeyeListData<BirdeyeNewListingTokenRaw>>(
    "/defi/v2/tokens/new_listing",
    {
      limit: DEFAULT_NEW_LISTINGS_LIMIT,
    },
  );

  return extractListItems<BirdeyeNewListingTokenRaw>(response.data).map(
    normalizeNewListingToken,
  );
}

export async function getTokenOverview(address: string): Promise<TokenOverview> {
  const response = await birdeyeGet<BirdeyeTokenOverviewRaw>(
    "/defi/token_overview",
    { address },
  );

  return normalizeTokenOverview(response.data, address);
}

export async function getTokenPriceHistory(
  address: string,
  options: BirdeyePriceHistoryOptions = {},
): Promise<PriceHistoryPoint[]> {
  const timeTo = options.timeTo ?? Math.floor(Date.now() / 1000);
  const timeFrom =
    options.timeFrom ?? timeTo - DEFAULT_PRICE_HISTORY_LOOKBACK_SECONDS;
  const type = options.type ?? DEFAULT_PRICE_HISTORY_TYPE;

  const response = await birdeyeGet<unknown>("/defi/history_price", {
    address,
    address_type: "token",
    type,
    time_from: timeFrom,
    time_to: timeTo,
  });

  return extractListItems<BirdeyePriceHistoryPointRaw>(response.data, [
    "items",
    "history",
    "points",
  ])
    .map(normalizePriceHistoryPoint)
    .filter((point): point is PriceHistoryPoint => point !== null)
    .sort((left, right) => left.timestamp - right.timestamp);
}

async function birdeyeGet<T>(
  pathname: string,
  query: Record<string, string | number | boolean | undefined>,
): Promise<BirdeyeApiResponse<T>> {
  const apiKey = process.env.BIRDEYE_API_KEY;

  if (!apiKey) {
    throw new BirdeyeApiError(
      "Missing BIRDEYE_API_KEY environment variable.",
      500,
    );
  }

  const url = new URL(pathname, BIRDEYE_API_BASE_URL);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    console.info("[Birdeye] Request", {
      url: url.toString(),
      method: "GET",
      chain: BIRDEYE_CHAIN,
      hasApiKey: Boolean(apiKey),
      attempt: attempt + 1,
    });

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "X-API-KEY": apiKey,
        "x-chain": BIRDEYE_CHAIN,
      },
      cache: "no-store",
    });

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      console.error("[Birdeye] Non-JSON response", {
        url: url.toString(),
        status: response.status,
        attempt: attempt + 1,
      });

      throw new BirdeyeApiError(
        "Birdeye returned a non-JSON response.",
        response.status || 502,
      );
    }

    console.info("[Birdeye] Response", {
      url: url.toString(),
      status: response.status,
      attempt: attempt + 1,
    });

    if (pathname === "/defi/token_trending" && !hasLoggedTrendingSample) {
      console.info("[Birdeye] token_trending raw sample", payload);
      hasLoggedTrendingSample = true;
    }

    if (pathname === "/defi/token_overview" && !hasLoggedOverviewSample) {
      console.info("[Birdeye] token_overview raw sample", payload);
      hasLoggedOverviewSample = true;
    }

    if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES) {
      console.warn("[Birdeye] Rate limited, retrying after delay", {
        url: url.toString(),
        status: response.status,
        retryDelayMs: RATE_LIMIT_RETRY_DELAY_MS,
      });
      await sleep(RATE_LIMIT_RETRY_DELAY_MS);
      continue;
    }

    const parsed = normalizeApiResponse<T>(payload);

    if (!response.ok || !parsed.success) {
      console.error("[Birdeye] Request failed", {
        url: url.toString(),
        status: response.status,
        attempt: attempt + 1,
        message: parsed.message ?? null,
      });

      throw new BirdeyeApiError(
        parsed.message ?? `Birdeye request failed for ${pathname}.`,
        response.status || 502,
        stringifyDetails(payload),
      );
    }

    return parsed;
  }

  throw new BirdeyeApiError(`Birdeye request failed for ${pathname}.`, 502);
}

function normalizeApiResponse<T>(payload: unknown): BirdeyeApiResponse<T> {
  if (!isRecord(payload)) {
    throw new BirdeyeApiError("Unexpected Birdeye response format.", 502);
  }

  return {
    success: Boolean(payload.success),
    data: payload.data as T,
    message: asNullableString(payload.message) ?? undefined,
  };
}

function extractListItems<T>(
  data: unknown,
  preferredKeys: string[] = ["tokens", "items", "data"],
): T[] {
  if (Array.isArray(data)) {
    return data as T[];
  }

  if (!isRecord(data)) {
    return [];
  }

  for (const key of preferredKeys) {
    const candidate = data[key];

    if (Array.isArray(candidate)) {
      return candidate as T[];
    }
  }

  return [];
}

function normalizeTrendingToken(token: BirdeyeTrendingTokenRaw): TrendingToken {
  const symbol = asNullableString(token.symbol) ?? "UNKNOWN";
  const name =
    asNullableString(token.name) ??
    asNullableString(token.symbol) ??
    shortenAddress(token.address);

  return {
    address: token.address,
    symbol,
    name,
    logoUri: asNullableString(token.logo_uri),
    decimals: toNumber(token.decimals),
    price: toNumber(token.price),
    priceChange24hPercent: toNumber(
      token.price_change_24h_percent ??
        token.priceChange24hPercent ??
        token.v24hChangePercent,
    ),
    volume24h: toNumber(token.volume24h ?? token.volume_24h ?? token.v24hUSD),
    marketCap: toNumber(token.market_cap ?? token.marketcap),
    liquidity: toNumber(token.liquidity),
    birdeyeUrl: buildBirdeyeTokenUrl(token.address),
    safetyScore: null,
    safetyLevel: null,
    riskMetrics: null,
    rank: toNumber(token.rank),
  };
}

function normalizeNewListingToken(
  token: BirdeyeNewListingTokenRaw,
): NewListingToken {
  const symbol = asNullableString(token.symbol) ?? "UNKNOWN";
  const name =
    asNullableString(token.name) ??
    asNullableString(token.symbol) ??
    shortenAddress(token.address);

  return {
    address: token.address,
    symbol,
    name,
    logoUri: asNullableString(token.logo_uri),
    decimals: toNumber(token.decimals),
    price: toNumber(token.price),
    priceChange24hPercent: null,
    volume24h: toNumber(token.volume24h ?? token.volume_24h ?? token.v24hUSD),
    marketCap: toNumber(token.market_cap ?? token.marketcap),
    liquidity: null,
    birdeyeUrl: buildBirdeyeTokenUrl(token.address),
    safetyScore: null,
    safetyLevel: null,
    riskMetrics: null,
    listedAt:
      asNullableString(token.listed_at) ??
      asNullableString(token.listed_time) ??
      asNullableString(token.list_time),
    listedAtUnix: toNumber(token.listed_at_unix),
  };
}

function normalizeTokenOverview(
  raw: BirdeyeTokenOverviewRaw,
  address: string,
): TokenOverview {
  const extensions = asRecord(raw.extensions);

  return {
    address: asNullableString(raw.address) ?? address,
    symbol: asNullableString(raw.symbol) ?? "UNKNOWN",
    name:
      asNullableString(raw.name) ??
      asNullableString(raw.symbol) ??
      shortenAddress(address),
    logoUri: asNullableString(raw.logo_uri),
    decimals: toNumber(raw.decimals),
    price: toNumber(raw.price),
    priceChange24hPercent: toNumber(
      raw.price_change_24h_percent ??
        raw.priceChange24hPercent ??
        raw.v24hChangePercent,
    ),
    volume24h: toNumber(raw.volume24h ?? raw.volume_24h ?? raw.v24hUSD),
    marketCap: toNumber(raw.marketCap ?? raw.market_cap ?? raw.marketcap),
    liquidity: toNumber(raw.liquidity),
    holderCount: toNumber(raw.holder_count ?? raw.holder),
    supply: toNumber(raw.supply),
    circulatingSupply: toNumber(raw.circulating_supply),
    fullyDilutedValuation: toNumber(raw.fully_diluted_valuation),
    description: asNullableString(raw.description),
    website:
      asNullableString(raw.website) ?? asNullableString(extensions?.website),
    xUrl:
      asNullableString(raw.twitter) ??
      asNullableString(extensions?.twitter) ??
      asNullableString(extensions?.x),
    telegramUrl:
      asNullableString(raw.telegram) ?? asNullableString(extensions?.telegram),
    discordUrl:
      asNullableString(raw.discord) ?? asNullableString(extensions?.discord),
  };
}

function normalizePriceHistoryPoint(
  raw: BirdeyePriceHistoryPointRaw,
): PriceHistoryPoint | null {
  const timestamp = toNumber(raw.unixTime ?? raw.time);
  const value = toNumber(raw.value ?? raw.price ?? raw.close);

  if (timestamp === null || value === null) {
    return null;
  }

  return {
    timestamp,
    value,
    open: toNumber(raw.open),
    high: toNumber(raw.high),
    low: toNumber(raw.low),
    close: toNumber(raw.close),
  };
}

function toNumber(value: NumericLike | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return isRecord(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function stringifyDetails(payload: unknown): string | null {
  if (!isRecord(payload)) {
    return null;
  }

  const details = payload.data ?? payload.message ?? payload.error;

  if (typeof details === "string") {
    return details;
  }

  try {
    return JSON.stringify(details);
  } catch {
    return null;
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
