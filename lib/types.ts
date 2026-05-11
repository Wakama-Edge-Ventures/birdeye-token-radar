export type NumericLike = number | string | null;

export type SafetyLevel = "safe" | "caution" | "danger";

export interface BirdeyeApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface BirdeyeListData<T> {
  items?: T[];
  tokens?: T[];
  total?: number;
  updateUnixTime?: number;
  updateTime?: string;
  [key: string]: unknown;
}

export interface BirdeyeTrendingTokenRaw {
  address: string;
  symbol?: string | null;
  name?: string | null;
  logo_uri?: string | null;
  rank?: NumericLike;
  price?: NumericLike;
  volume24h?: NumericLike;
  volume_24h?: NumericLike;
  v24hUSD?: NumericLike;
  price_change_24h_percent?: NumericLike;
  priceChange24hPercent?: NumericLike;
  v24hChangePercent?: NumericLike;
  market_cap?: NumericLike;
  marketcap?: NumericLike;
  liquidity?: NumericLike;
  decimals?: NumericLike;
  [key: string]: unknown;
}

export interface BirdeyeNewListingTokenRaw {
  address: string;
  symbol?: string | null;
  name?: string | null;
  logo_uri?: string | null;
  listed_at?: string | null;
  listed_at_unix?: NumericLike;
  listed_time?: string | null;
  list_time?: string | null;
  price?: NumericLike;
  volume24h?: NumericLike;
  volume_24h?: NumericLike;
  v24hUSD?: NumericLike;
  market_cap?: NumericLike;
  marketcap?: NumericLike;
  decimals?: NumericLike;
  [key: string]: unknown;
}

export interface BirdeyeTokenOverviewRaw {
  address?: string;
  symbol?: string | null;
  name?: string | null;
  logo_uri?: string | null;
  decimals?: NumericLike;
  price?: NumericLike;
  volume24h?: NumericLike;
  volume_24h?: NumericLike;
  v24hUSD?: NumericLike;
  marketCap?: NumericLike;
  market_cap?: NumericLike;
  marketcap?: NumericLike;
  liquidity?: NumericLike;
  price_change_24h_percent?: NumericLike;
  priceChange24hPercent?: NumericLike;
  v24hChangePercent?: NumericLike;
  holder?: NumericLike;
  holder_count?: NumericLike;
  supply?: NumericLike;
  circulating_supply?: NumericLike;
  fully_diluted_valuation?: NumericLike;
  description?: string | null;
  extensions?: Record<string, string | null> | null;
  website?: string | null;
  twitter?: string | null;
  telegram?: string | null;
  discord?: string | null;
  [key: string]: unknown;
}

export interface BirdeyePriceHistoryPointRaw {
  unixTime?: NumericLike;
  time?: NumericLike;
  value?: NumericLike;
  price?: NumericLike;
  open?: NumericLike;
  high?: NumericLike;
  low?: NumericLike;
  close?: NumericLike;
  [key: string]: unknown;
}

export interface TokenIdentity {
  address: string;
  symbol: string;
  name: string;
  logoUri: string | null;
  decimals: number | null;
}

export interface TokenMarketSnapshot {
  price: number | null;
  priceChange24hPercent: number | null;
  volume24h: number | null;
  marketCap: number | null;
  liquidity: number | null;
}

export interface TokenRiskMetrics {
  address: string;
  holderCount: number | null;
  liquidity: number | null;
  volume24h: number | null;
  marketCap: number | null;
}

export interface SafetyScoreBreakdownItem {
  label: string;
  level: SafetyLevel | null;
  weight: number;
  message: string;
}

export interface SafetyScoreResult {
  score: number | null;
  level: SafetyLevel | null;
  breakdown: SafetyScoreBreakdownItem[];
}

export interface TokenRadarToken extends TokenIdentity, TokenMarketSnapshot {
  birdeyeUrl: string;
  safetyScore: number | null;
  safetyLevel: SafetyLevel | null;
  riskMetrics: TokenRiskMetrics | null;
}

export interface TrendingToken extends TokenRadarToken {
  rank: number | null;
}

export interface NewListingToken extends TokenRadarToken {
  listedAt: string | null;
  listedAtUnix: number | null;
}

export interface TokenOverview extends TokenIdentity, TokenMarketSnapshot {
  holderCount: number | null;
  supply: number | null;
  circulatingSupply: number | null;
  fullyDilutedValuation: number | null;
  description: string | null;
  website: string | null;
  xUrl: string | null;
  telegramUrl: string | null;
  discordUrl: string | null;
}

export interface PriceHistoryPoint {
  timestamp: number;
  value: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
}

export interface TrendingTokensResponse {
  tokens: TrendingToken[];
  fetchedAt: string;
  apiCallsUsed: number;
}

export interface NewListingsResponse {
  tokens: NewListingToken[];
  fetchedAt: string;
  apiCallsUsed: number;
}

export interface TokenRiskResponse {
  token: TokenOverview;
  riskMetrics: TokenRiskMetrics;
  safety: SafetyScoreResult;
  fetchedAt: string;
  apiCallsUsed: number;
}

export interface TokenOverviewResponse {
  token: TokenOverview;
  fetchedAt: string;
  apiCallsUsed: number;
}

export interface TokenPriceHistoryResponse {
  address: string;
  points: PriceHistoryPoint[];
  fetchedAt: string;
  apiCallsUsed: number;
}

export interface TokenDetailResponse {
  overview: TokenOverview;
  riskMetrics: TokenRiskMetrics;
  safety: SafetyScoreResult;
  priceHistory: PriceHistoryPoint[];
}

export interface ApiErrorResponse {
  error: string;
  details?: string;
  status?: number;
}
