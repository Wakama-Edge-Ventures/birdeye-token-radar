import type {
  SafetyLevel,
  SafetyScoreBreakdownItem,
  SafetyScoreResult,
  TokenOverview,
  TokenRiskMetrics,
} from "@/lib/types";

const METRIC_WEIGHT = 25;

export function deriveRiskMetricsFromOverview(
  overview: Pick<
    TokenOverview,
    "address" | "holderCount" | "liquidity" | "volume24h" | "marketCap"
  >,
): TokenRiskMetrics {
  return {
    address: overview.address,
    holderCount: overview.holderCount,
    liquidity: overview.liquidity,
    volume24h: overview.volume24h,
    marketCap: overview.marketCap,
  };
}

export function computeSafetyScore(riskMetrics: TokenRiskMetrics): number {
  return getSafetyScoreBreakdown(riskMetrics).reduce((score, item) => {
    if (item.level === null) {
      return score;
    }

    if (item.level === "safe") {
      return score + item.weight;
    }

    if (item.level === "caution") {
      return score + Math.round(item.weight * 0.6);
    }

    return score;
  }, 0);
}

export function getSafetyLevel(score: number): SafetyLevel {
  if (score >= 80) {
    return "safe";
  }

  if (score >= 50) {
    return "caution";
  }

  return "danger";
}

export function getSafetyLabel(level: SafetyLevel): string {
  if (level === "safe") {
    return "Safe";
  }

  if (level === "caution") {
    return "Caution";
  }

  return "Danger";
}

export function getSafetyScoreBreakdown(
  riskMetrics: TokenRiskMetrics,
): SafetyScoreBreakdownItem[] {
  return [
    {
      label: "Holder count",
      level: getHolderCountLevel(riskMetrics.holderCount),
      weight: METRIC_WEIGHT,
      message: getHolderCountMessage(riskMetrics.holderCount),
    },
    {
      label: "Liquidity",
      level: getLiquidityLevel(riskMetrics.liquidity),
      weight: METRIC_WEIGHT,
      message: getLiquidityMessage(riskMetrics.liquidity),
    },
    {
      label: "Volume 24h",
      level: getVolumeLevel(riskMetrics.volume24h),
      weight: METRIC_WEIGHT,
      message: getVolumeMessage(riskMetrics.volume24h),
    },
    {
      label: "Market cap",
      level: getMarketCapLevel(riskMetrics.marketCap),
      weight: METRIC_WEIGHT,
      message: getMarketCapMessage(riskMetrics.marketCap),
    },
  ];
}

export function getSafetyScoreResult(
  riskMetrics: TokenRiskMetrics,
): SafetyScoreResult {
  if (!hasCompleteRiskMetrics(riskMetrics)) {
    return {
      score: null,
      level: null,
      breakdown: getSafetyScoreBreakdown(riskMetrics),
    };
  }

  const score = computeSafetyScore(riskMetrics);

  return {
    score,
    level: getSafetyLevel(score),
    breakdown: getSafetyScoreBreakdown(riskMetrics),
  };
}

function getHolderCountLevel(holderCount: number | null): SafetyLevel | null {
  if (holderCount === null) {
    return null;
  }

  if (holderCount < 100) {
    return "danger";
  }

  if (holderCount <= 1000) {
    return "caution";
  }

  return "safe";
}

function getLiquidityLevel(liquidity: number | null): SafetyLevel | null {
  if (liquidity === null) {
    return null;
  }

  if (liquidity < 10_000) {
    return "danger";
  }

  if (liquidity <= 100_000) {
    return "caution";
  }

  return "safe";
}

function getVolumeLevel(volume24h: number | null): SafetyLevel | null {
  if (volume24h === null) {
    return null;
  }

  if (volume24h < 5_000) {
    return "danger";
  }

  if (volume24h <= 50_000) {
    return "caution";
  }

  return "safe";
}

function getMarketCapLevel(marketCap: number | null): SafetyLevel | null {
  if (marketCap === null) {
    return null;
  }

  if (marketCap < 50_000) {
    return "danger";
  }

  if (marketCap <= 500_000) {
    return "caution";
  }

  return "safe";
}

function getHolderCountMessage(holderCount: number | null) {
  if (holderCount === null) {
    return "Holder count is unavailable, so this metric is treated as high risk.";
  }

  if (holderCount < 100) {
    return "Fewer than 100 holders suggests fragile ownership distribution.";
  }

  if (holderCount <= 1000) {
    return "Between 100 and 1,000 holders suggests moderate traction.";
  }

  return "More than 1,000 holders suggests broader market participation.";
}

function getLiquidityMessage(liquidity: number | null) {
  if (liquidity === null) {
    return "Liquidity is unavailable, so this metric is treated as high risk.";
  }

  if (liquidity < 10_000) {
    return "Liquidity below $10K increases slippage and exit risk.";
  }

  if (liquidity <= 100_000) {
    return "Liquidity between $10K and $100K is usable but still thin.";
  }

  return "Liquidity above $100K supports healthier trading depth.";
}

function getVolumeMessage(volume24h: number | null) {
  if (volume24h === null) {
    return "24h volume is unavailable, so this metric is treated as high risk.";
  }

  if (volume24h < 5_000) {
    return "24h volume below $5K points to weak trading activity.";
  }

  if (volume24h <= 50_000) {
    return "24h volume between $5K and $50K suggests moderate activity.";
  }

  return "24h volume above $50K suggests stronger active demand.";
}

function getMarketCapMessage(marketCap: number | null) {
  if (marketCap === null) {
    return "Market cap is unavailable, so this metric is treated as high risk.";
  }

  if (marketCap < 50_000) {
    return "Market cap below $50K suggests an extremely early or fragile token.";
  }

  if (marketCap <= 500_000) {
    return "Market cap between $50K and $500K suggests mid-risk early growth.";
  }

  return "Market cap above $500K suggests a more established launch profile.";
}

function hasCompleteRiskMetrics(riskMetrics: TokenRiskMetrics) {
  return (
    riskMetrics.holderCount !== null &&
    riskMetrics.liquidity !== null &&
    riskMetrics.volume24h !== null &&
    riskMetrics.marketCap !== null
  );
}
