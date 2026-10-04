import { NextResponse } from "next/server";
import { cyprusStreetRegistryStore } from "@/core/water/cyprus-street-registry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function value(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() || undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const district = value(url.searchParams, "district");
  const municipalityOrCommunity = value(url.searchParams, "municipalityOrCommunity");
  const areaOrParish = value(url.searchParams, "areaOrParish");
  const query = value(url.searchParams, "q");
  const requestedLimit = Number(url.searchParams.get("limit") || 100);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 500))
    : 100;

  const streets = await cyprusStreetRegistryStore.list({
    district,
    municipalityOrCommunity,
    areaOrParish,
    query,
    limit,
  });

  return NextResponse.json(
    {
      status: streets.length > 0 ? "ready" : "registry_not_loaded",
      streets,
      count: streets.length,
      filters: { district, municipalityOrCommunity, areaOrParish, query },
      rule:
        "An empty registry must never be replaced with fabricated street data. Controlled external address search remains a fallback until verified registry ingestion is loaded.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
