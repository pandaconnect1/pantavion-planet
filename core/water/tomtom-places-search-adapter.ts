import type { UnifiedPlaceResult } from "./water-unified-place-search-contract";

export type TomTomPlacesSearchConfig = {
  apiKey: string;
  baseUrl?: string;
};

type TomTomDiscoverResult = {
  id?: string;
  type?: string;
  name?: string;
  displayName?: string;
  position?: { lat?: number; lon?: number };
  address?: { freeformAddress?: string };
};

type TomTomDiscoverResponse = {
  results?: TomTomDiscoverResult[];
};

export class TomTomPlacesSearchAdapter {
  constructor(private readonly config: TomTomPlacesSearchConfig) {}

  async discover(query: string): Promise<UnifiedPlaceResult[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery || !this.config.apiKey) return [];

    const response = await fetch(
      `${this.config.baseUrl ?? "https://api.tomtom.com"}/maps/orbis/places/discover`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "TomTom-Api-Key": this.config.apiKey,
          "TomTom-Api-Version": "3",
          Attributes: "results(id,type,name,displayName,position,address)",
        },
        body: JSON.stringify({
          query: cleanQuery,
          countryCodes: ["CY"],
          language: "el-GR",
          limit: 20,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) throw new Error(`tomtom_places_error_${response.status}`);
    const body = (await response.json()) as TomTomDiscoverResponse;

    return (body.results ?? []).flatMap((item, index) => {
      const lat = item.position?.lat;
      const lng = item.position?.lon;
      const displayName = item.displayName || item.name;
      if (!displayName) return [];

      return [{
        resultId: `tomtom:${item.id ?? index}`,
        kind: classifyKind(item.type),
        displayName,
        secondaryLabel: item.address?.freeformAddress ?? null,
        coordinates:
          Number.isFinite(lat) && Number.isFinite(lng)
            ? { lat: lat as number, lng: lng as number }
            : null,
        source: "TOMTOM",
        sourceResultId: item.id ?? null,
        confidence: null,
        persistence: "SESSION_ONLY",
      } satisfies UnifiedPlaceResult];
    });
  }
}

function classifyKind(type?: string): UnifiedPlaceResult["kind"] {
  const value = type?.toLowerCase() ?? "";
  if (value.includes("street")) return "STREET";
  if (value.includes("address")) return "ADDRESS";
  if (value.includes("hotel")) return "HOTEL";
  if (value.includes("poi")) return "POI";
  return "PLACE_NAME";
}
