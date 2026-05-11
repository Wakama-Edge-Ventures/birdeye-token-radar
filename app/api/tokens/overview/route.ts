import { NextRequest, NextResponse } from "next/server";

import { BirdeyeApiError, getTokenOverview } from "@/lib/birdeye";
import type { ApiErrorResponse, TokenOverviewResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim();

  if (!address) {
    return NextResponse.json(
      {
        error: "Missing required query parameter: address.",
        status: 400,
      } satisfies ApiErrorResponse,
      { status: 400 },
    );
  }

  try {
    const token = await getTokenOverview(address);

    const response: TokenOverviewResponse = {
      token,
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
    error: "Failed to fetch token overview.",
    status: 500,
  };

  return NextResponse.json(response, { status: 500 });
}
