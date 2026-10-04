import { NextResponse } from "next/server";
import { TomTomPlacesSearchAdapter } from "@/core/water/tomtom-places-search-adapter";
import { GooglePlacesSearchAdapter } from "@/core/water/google-places-search-adapter";
import { CyprusDlsRoadSearchAdapter } from "@/core/water/cyprus-dls-road-search-adapter";
import {
  searchWaterPlaces,
  type WaterPlaceSearchProvider,
} from "@/core/water/water-place-search-orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { status: "missing_query", results: [], message: "Γράψε τουλάχιστον 2 χαρακτήρες." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const providers: WaterPlaceSearchProvider[] = [];
  const dlsRoadSearchUrl = process.env.CYPRUS_DLS_ROAD_SEARCH_URL?.trim();
  const dls = new CyprusDlsRoadSearchAdapter({
    baseUrl: dlsRoadSearchUrl || undefined,
  });
  providers.push({
    id: "CYPRUS_OFFICIAL",
    enabled: true,
    search: (value) => dls.search(value),
  });

  const tomTomApiKey = process.env.TOMTOM_API_KEY?.trim();
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

  if (googleApiKey) {
    const google = new GooglePlacesSearchAdapter({ apiKey: googleApiKey });
    providers.push({ id: "GOOGLE_MAPS", enabled: true, search: (value) => google.search(value) });
  }

  if (tomTomApiKey) {
    const tomtom = new TomTomPlacesSearchAdapter({ apiKey: tomTomApiKey });
    providers.push({
      id: "TOMTOM",
      enabled: true,
      search: (value) => tomtom.discover(value),
    });
  }

  const outcome = await searchWaterPlaces(query, providers);

  if (outcome.results.length === 0 && outcome.failedProviders.length === providers.length) {
    return NextResponse.json(
      {
        status: "provider_error",
        results: [],
        failedProviders: outcome.failedProviders,
        fallback: "/api/professional/infrastructure/water/address/search",
        message: "Οι διαθέσιμοι providers δεν ανταποκρίθηκαν. Διατηρείται η ελεγχόμενη fallback αναζήτηση.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    {
      status: outcome.failedProviders.length ? "degraded" : "ready",
      providerStrategy: "CYPRUS_OFFICIAL_FIRST_WITH_POLICY_BASED_FAILOVER",
      results: outcome.results,
      failedProviders: outcome.failedProviders,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
