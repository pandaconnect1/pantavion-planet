import type { UnifiedPlaceResult } from "./water-unified-place-search-contract";

export type GooglePlacesSearchConfig = {
  apiKey: string;
  baseUrl?: string;
};

type GoogleTextSearchResponse = {
  places?: Array<{
    id?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
};

/**
 * EEA-safe map integration adapter.
 * For Pantavion's third-party map UI this adapter intentionally requests only
 * place ID and coordinates. Google descriptive Places content is not returned
 * into the map result list.
 */
export class GooglePlacesSearchAdapter {
  constructor(private readonly config: GooglePlacesSearchConfig) {}

  async search(query: string): Promise<UnifiedPlaceResult[]> {
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2 || !this.config.apiKey) return [];

    const response = await fetch(
      `${this.config.baseUrl ?? "https://places.googleapis.com"}/v1/places:searchText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.config.apiKey,
          "X-Goog-FieldMask": "places.id,places.location",
        },
        body: JSON.stringify({
          textQuery: cleanQuery,
          regionCode: "CY",
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!response.ok) throw new Error(`google_places_error_${response.status}`);
    const body = (await response.json()) as GoogleTextSearchResponse;

    return (body.places ?? []).flatMap((place, index) => {
      const lat = place.location?.latitude;
      const lng = place.location?.longitude;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

      return [{
        resultId: `google:${place.id ?? index}`,
        kind: "PLACE_NAME",
        // Do not expose Google descriptive Places content with the Pantavion map.
        displayName: cleanQuery,
        secondaryLabel: null,
        coordinates: { lat: lat as number, lng: lng as number },
        source: "GOOGLE_MAPS",
        sourceResultId: place.id ?? null,
        confidence: null,
        persistence: "SESSION_ONLY",
      } satisfies UnifiedPlaceResult];
    });
  }
}
