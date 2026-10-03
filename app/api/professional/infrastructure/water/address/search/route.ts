import { NextResponse } from "next/server";
import { waterAddressSearchQueries } from "@/core/infrastructure/water/water-address-search-query";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  boundingbox?: [string, string, string, string];
  importance?: number;
  type?: string;
  class?: string;
};

function value(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key)?.trim() ?? "";
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const street = value(url.searchParams, "street");
  const houseNumber = value(url.searchParams, "houseNumber");
  const area = value(url.searchParams, "area");
  const postalCode = value(url.searchParams, "postalCode");

  const queries = waterAddressSearchQueries({ street, houseNumber, area, postalCode });
  let query = queries[0];

  if (!street && !area && !postalCode) {
    return NextResponse.json(
      {
        status: "missing_query",
        candidates: [],
        selectedCandidateIdRequired: true,
        mayAutoPickAmbiguousAddress: false,
        message: "Δώσε οδό, περιοχή ή ταχυδρομικό κώδικα.",
      },
      { status: 400 },
    );
  }

  const providerUrl = new URL("https://nominatim.openstreetmap.org/search");
  providerUrl.searchParams.set("format", "jsonv2");
  providerUrl.searchParams.set("addressdetails", "1");
  providerUrl.searchParams.set("limit", "8");
  providerUrl.searchParams.set("countrycodes", "cy");
  let results: NominatimResult[] = [];
  try {
    for (const [index, candidateQuery] of queries.entries()) {
      // Bound the fallback to one alternative and avoid back-to-back
      // provider requests when an English/Greeklish spelling was not indexed.
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1100));
      query = candidateQuery;
      providerUrl.searchParams.set("q", query);
      const response = await fetch(providerUrl, {
        headers: {
          "User-Agent": "PantavionWaterModule/1.0 (https://pantavion.com)",
          "Accept-Language": "el,en",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("address_provider_unavailable");
      const body: unknown = await response.json();
      if (!Array.isArray(body)) throw new Error("invalid_address_response");
      results = (body as NominatimResult[]).filter((item) =>
        item && typeof item.lat === "string" && item.lat.trim() !== "" &&
        typeof item.lon === "string" && item.lon.trim() !== "" &&
        Number.isFinite(Number(item.lat)) && Math.abs(Number(item.lat)) <= 90 &&
        Number.isFinite(Number(item.lon)) && Math.abs(Number(item.lon)) <= 180,
      );
      if (results.length > 0) break;
    }
  } catch {
    return NextResponse.json(
      {
        status: "provider_error",
        candidates: [],
        selectedCandidateIdRequired: true,
        mayAutoPickAmbiguousAddress: false,
        message: "Η υπηρεσία διευθύνσεων δεν ανταποκρίθηκε. Δοκίμασε ξανά ή επίλεξε σημείο στον χάρτη.",
      },
      { status: 502 },
    );
  }

  const candidates = results.map((item, index) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);

    const bbox = item.boundingbox
      ? {
          minLat: Number(item.boundingbox[0]),
          maxLat: Number(item.boundingbox[1]),
          minLng: Number(item.boundingbox[2]),
          maxLng: Number(item.boundingbox[3]),
        }
      : {
          minLat: lat - 0.01,
          maxLat: lat + 0.01,
          minLng: lng - 0.01,
          maxLng: lng + 0.01,
        };

    return {
      candidateId: `cy-address-${item.place_id}-${index}`,
      displayName: item.display_name,
      streetName: street || null,
      houseNumber: houseNumber || null,
      municipalityOrCity: area || null,
      districtQuarterSectorZone: null,
      locality: item.display_name,
      postalCode: postalCode || null,
      coordinates: { lat, lng },
      bbox,
      confidence: item.importance ?? null,
      source: "openstreetmap_nominatim_controlled_address_search",
      providerType: item.type ?? item.class ?? "address",
    };
  });

  return NextResponse.json(
    {
      status: "candidates_returned",
      query,
      candidates,
      candidateCount: candidates.length,
      selectedCandidateIdRequired: true,
      mayAutoPickAmbiguousAddress: false,
      rule:
        "Address search returns candidates. Pantavion must not auto-pick repeated street/address names. User/admin selection is required before bbox segment loading.",
      dataReturned: false,
      waterNetworkDataReturned: false,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
