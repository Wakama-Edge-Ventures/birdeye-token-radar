import { NextResponse } from "next/server";

import { BirdeyeApiError, getNewListings } from "@/lib/birdeye";
import type { ApiErrorResponse, NewListingsResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await getNewListings();

    const response: NewListingsResponse = {
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
    error: "Failed to fetch new listings.",
    status: 500,
  };

  return NextResponse.json(response, { status: 500 });
}
