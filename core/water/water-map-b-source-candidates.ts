import { WATER_MAP_B_EXPECTED_SOURCE } from "./water-map-b-source-identity";

export type WaterMapBSourceKey =
  | "canonical-2026-andreaspap"
  | "legacy-george-85m";

export const WATER_MAP_B_SOURCE_CANDIDATES = {
  "canonical-2026-andreaspap": {
    sourceKey: "canonical-2026-andreaspap",
    mapId: "B",
    mapRole: "map-b-authentic-master",
    label: "Map B — ANDREASPAP 2026",
    canonical: true,
    versionNumber: 1,
    fileName: WATER_MAP_B_EXPECTED_SOURCE.fileName,
    byteSize: WATER_MAP_B_EXPECTED_SOURCE.byteSize,
    sha256: WATER_MAP_B_EXPECTED_SOURCE.sha256,
    dwgHeader: WATER_MAP_B_EXPECTED_SOURCE.dwgHeader,
    storagePath:
      "water-network-private/source-masters/map-b-original/6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16.dwg",
  },
  "legacy-george-85m": {
    sourceKey: "legacy-george-85m",
    mapId: "C",
    mapRole: "map-c-authentic-master",
    label: "Map C — GEORGE 85 MB",
    canonical: true,
    versionNumber: 1,
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    byteSize: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    dwgHeader: "AC1032",
    storagePath:
      "water-network-private/source-masters/map-c-original/038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800.dwg",
  },
} as const;

export function getWaterMapBSourceCandidate(sourceKey: WaterMapBSourceKey) {
  return WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
}
