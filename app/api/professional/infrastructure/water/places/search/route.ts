import { NextResponse } from "next/server";
import { TomTomPlacesSearchAdapter } from "@/core/water/tomtom-places-search-adapter";
import { GooglePlacesSearchAdapter } from "@/core/water/google-places-search-adapter";
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

  if (providers.length === 0) {
    return NextResponse.json(
      {
        status: "provider_not_configured",
        results: [],
        failedProviders: [],
        fallback: "/api/professional/infrastructure/water/address/search",
        message: "Δεν υπάρχει ακόμη ενεργοποιημένος εξωτερικός provider. Διατηρείται η ελεγχόμενη fallback αναζήτηση.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
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
      providerStrategy: "POLICY_BASED_MULTI_PROVIDER",
      results: outcome.results,
      failedProviders: outcome.failedProviders,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
