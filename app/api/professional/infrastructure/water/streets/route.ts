import { NextResponse } from "next/server";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { cyprusStreetRegistryStore } from "@/core/water/cyprus-street-registry-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function value(params: URLSearchParams, key: string) {
  return params.get(key)?.trim() || undefined;
}

export async function GET(request: Request) {
  // Internal register data: authorize before any registry read, as the street directory does.
  const access = await authorizeWaterMapRequest(request);
  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error, dataReturned: false },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const url = new URL(request.url);
  const district = value(url.searchParams, "district");
  const municipalityOrCommunity = value(url.searchParams, "municipalityOrCommunity");
  const areaOrParish = value(url.searchParams, "areaOrParish");
  const query = value(url.searchParams, "q");
  const requestedLimit = Number(url.searchParams.get("limit") || 100);
  const limit = Number.isFinite(requestedLimit)
    ? Math.max(1, Math.min(Math.trunc(requestedLimit), 500))
    : 100;
  const filters = { district, municipalityOrCommunity, areaOrParish, query };

  try {
    const streets = await cyprusStreetRegistryStore.list({
      district,
      municipalityOrCommunity,
      areaOrParish,
      query,
      limit,
    });

    return NextResponse.json(
      {
        status: "ready",
        streets,
        count: streets.length,
        filters,
        rule:
          "Records come only from the verified Limassol postal register (CC BY 4.0). They carry no map coordinates: a point is chosen on the map, never inferred from a name. Never fabricate street data.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        status: "registry_unavailable",
        streets: [],
        count: 0,
        filters,
        rule: "The street registry could not be read. No street data is returned.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
