import { NextRequest, NextResponse } from "next/server";

import {
  type BirdeyePriceHistoryOptions,
  type BirdeyePriceHistoryType,
  BirdeyeApiError,
  getTokenPriceHistory,
} from "@/lib/birdeye";
import type { ApiErrorResponse, TokenPriceHistoryResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const ALLOWED_PRICE_TYPES: BirdeyePriceHistoryType[] = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1H",
  "2H",
  "4H",
  "6H",
  "8H",
  "12H",
  "1D",
  "3D",
  "1W",
  "1M",
];

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

  const optionsResult = parsePriceHistoryOptions(request);

  if ("error" in optionsResult) {
    return NextResponse.json(optionsResult, { status: optionsResult.status });
  }

  try {
    const points = await getTokenPriceHistory(address, optionsResult);

    const response: TokenPriceHistoryResponse = {
      address,
      points,
      fetchedAt: new Date().toISOString(),
      apiCallsUsed: 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    return createErrorResponse(error);
  }
}

function parsePriceHistoryOptions(
  request: NextRequest,
): BirdeyePriceHistoryOptions | ApiErrorResponse {
  const type = request.nextUrl.searchParams.get("type");
  const timeFromValue = request.nextUrl.searchParams.get("timeFrom");
  const timeToValue = request.nextUrl.searchParams.get("timeTo");

  if (type && !ALLOWED_PRICE_TYPES.includes(type as BirdeyePriceHistoryType)) {
    return {
      error: "Invalid query parameter: type.",
      details: `Allowed values: ${ALLOWED_PRICE_TYPES.join(", ")}`,
      status: 400,
    };
  }

  const timeFrom = parseOptionalInteger(timeFromValue);
  const timeTo = parseOptionalInteger(timeToValue);

  if (timeFromValue && timeFrom === null) {
    return {
      error: "Invalid query parameter: timeFrom.",
      details: "timeFrom must be an integer unix timestamp in seconds.",
      status: 400,
    };
  }

  if (timeToValue && timeTo === null) {
    return {
      error: "Invalid query parameter: timeTo.",
      details: "timeTo must be an integer unix timestamp in seconds.",
      status: 400,
    };
  }

  if (timeFrom !== null && timeTo !== null && timeFrom >= timeTo) {
    return {
      error: "Invalid price history range.",
      details: "timeFrom must be less than timeTo.",
      status: 400,
    };
  }

  return {
    type: type ? (type as BirdeyePriceHistoryType) : undefined,
    timeFrom: timeFrom ?? undefined,
    timeTo: timeTo ?? undefined,
  };
}

function parseOptionalInteger(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
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
    error: "Failed to fetch token price history.",
    status: 500,
  };

  return NextResponse.json(response, { status: 500 });
}
