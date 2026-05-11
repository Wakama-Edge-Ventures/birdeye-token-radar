import { NextResponse } from "next/server";

import { BirdeyeApiError, getTrendingTokens } from "@/lib/birdeye";
import type { ApiErrorResponse, TrendingTokensResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await getTrendingTokens();

    const response: TrendingTokensResponse = {
      tokens,
      fetchedAt: new Date().toISOString(),
      apiCallsUsed: 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}

function createErrorResponse(error: unknown) {
  if (error instanceof BirdeyeApiError) {
    const response: ApiErrorResponse = {
      error: error.message,
      details: error.details ?? undefined,
      status: error.status,
    };

    return NextResponse.json(response, { status: error.status });
  }

  const response: ApiErrorResponse = {
    error: "Failed to fetch trending tokens.",
    status: 500,
  };

  return NextResponse.json(response, { status: 500 });
}
