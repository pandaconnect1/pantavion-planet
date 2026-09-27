import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "@/core/water/water-map-b-source-candidates";

export const WATER_MAP_B_DERIVED_STORAGE_BUCKET = "personal-media" as const;

export function waterMapBDerivedPrefix(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  return `water-network-private/derived/map-b/${source.sha256}`;
}

export function waterMapBDerivedManifestPath(sourceKey: WaterMapBSourceKey) {
  return `${waterMapBDerivedPrefix(sourceKey)}/manifest.json`;
}

export function waterMapBDerivedTilesPrefix(sourceKey: WaterMapBSourceKey) {
  return `${waterMapBDerivedPrefix(sourceKey)}/tiles`;
}

export function waterMapBDerivedTilePath(
  sourceKey: WaterMapBSourceKey,
  fileName: string,
) {
  return `${waterMapBDerivedTilesPrefix(sourceKey)}/${fileName}`;
}

export function normalizeWaterMapBSourceKey(value: unknown): WaterMapBSourceKey {
  return value === "legacy-george-85m"
    ? "legacy-george-85m"
    : "canonical-2026-andreaspap";
}
