import type { UnifiedPlaceResult, UnifiedPlaceSource } from "./water-unified-place-search-contract";

export interface WaterPlaceSearchProvider {
  readonly id: UnifiedPlaceSource;
  readonly enabled: boolean;
  search(query: string): Promise<UnifiedPlaceResult[]>;
}

export type WaterPlaceSearchOutcome = {
  results: UnifiedPlaceResult[];
  failedProviders: UnifiedPlaceSource[];
};

const SOURCE_PRIORITY: Partial<Record<UnifiedPlaceSource, number>> = {
  PANTAVION_VERIFIED: 0,
  CYPRUS_OFFICIAL: 1,
  GOOGLE_MAPS: 2,
  TOMTOM: 3,
  HERE: 4,
  MAPBOX: 5,
  OPENSTREETMAP: 6,
};

function spatialBucket(result: UnifiedPlaceResult) {
  if (!result.coordinates) return "no-coordinate";
  return `${result.coordinates.lat.toFixed(5)}:${result.coordinates.lng.toFixed(5)}`;
}

function identityKey(result: UnifiedPlaceResult) {
  if (result.sourceResultId) return `${result.source}:${result.sourceResultId}`;
  // Never collapse same-name places unless their source and spatial context agree.
  return `${result.source}:${result.kind}:${result.displayName.toLocaleLowerCase()}:${spatialBucket(result)}`;
}

export async function searchWaterPlaces(
  query: string,
  providers: readonly WaterPlaceSearchProvider[],
): Promise<WaterPlaceSearchOutcome> {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return { results: [], failedProviders: [] };

  const enabled = providers.filter((provider) => provider.enabled);
  const settled = await Promise.allSettled(enabled.map((provider) => provider.search(cleanQuery)));

  const failedProviders: UnifiedPlaceSource[] = [];
  const merged: UnifiedPlaceResult[] = [];

  settled.forEach((entry, index) => {
    if (entry.status === "fulfilled") merged.push(...entry.value);
    else failedProviders.push(enabled[index].id);
  });

  const unique = new Map<string, UnifiedPlaceResult>();
  for (const result of merged) {
    const key = identityKey(result);
    if (!unique.has(key)) unique.set(key, result);
  }

  const results = [...unique.values()].sort((a, b) => {
    const sourceDelta = (SOURCE_PRIORITY[a.source] ?? 99) - (SOURCE_PRIORITY[b.source] ?? 99);
    if (sourceDelta !== 0) return sourceDelta;
    return (b.confidence ?? 0) - (a.confidence ?? 0);
  });

  return { results, failedProviders };
}
