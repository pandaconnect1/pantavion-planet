import { FINAL_MASTER_DWG_SHA256 } from "@/core/water/final-master-dwg-source";

export const WATER_MAP_B_DERIVED_STORAGE_BUCKET = "personal-media" as const;
export const WATER_MAP_B_DERIVED_PREFIX =
  `water-network-private/derived/map-b/${FINAL_MASTER_DWG_SHA256}` as const;
export const WATER_MAP_B_DERIVED_MANIFEST_PATH =
  `${WATER_MAP_B_DERIVED_PREFIX}/manifest.json` as const;
export const WATER_MAP_B_DERIVED_TILES_PREFIX =
  `${WATER_MAP_B_DERIVED_PREFIX}/tiles` as const;

export function waterMapBDerivedTilePath(fileName: string) {
  return `${WATER_MAP_B_DERIVED_TILES_PREFIX}/${fileName}`;
}
