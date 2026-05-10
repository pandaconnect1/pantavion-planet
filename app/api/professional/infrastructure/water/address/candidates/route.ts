import { NextResponse } from "next/server";

import { planWaterAddressCandidateSearch } from "@/core/infrastructure/water/water-address-candidate-disambiguation";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const result = planWaterAddressCandidateSearch({
    query: url.searchParams.get("query") ?? url.searchParams.get("q") ?? "",
    houseNumber: url.searchParams.get("houseNumber") ?? undefined,
    municipalityCity:
      url.searchParams.get("municipalityCity") ??
      url.searchParams.get("city") ??
      undefined,
    districtQuarterSectorZone:
      url.searchParams.get("districtQuarterSectorZone") ??
      url.searchParams.get("district") ??
      url.searchParams.get("quarter") ??
      url.searchParams.get("sector") ??
      url.searchParams.get("zone") ??
      undefined,
    locality: url.searchParams.get("locality") ?? undefined,
    selectedCandidateId: url.searchParams.get("selectedCandidateId") ?? undefined,
    requestedBy: "system-diagnostic",
  });

  return NextResponse.json(result, {
    status: result.statusCode,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
