import { WATER_MAP_B_EXPECTED_SOURCE } from "./water-map-b-source-identity";

export type WaterMapBSourceKey =
  | "canonical-2026-andreaspap"
  | "legacy-george-85m";

export const WATER_MAP_B_SOURCE_CANDIDATES = {
  "canonical-2026-andreaspap": {
    sourceKey: "canonical-2026-andreaspap",
    label: "Canonical Map B — ANDREASPAP 2026",
    canonical: true,
    fileName: WATER_MAP_B_EXPECTED_SOURCE.fileName,
    byteSize: WATER_MAP_B_EXPECTED_SOURCE.byteSize,
    sha256: WATER_MAP_B_EXPECTED_SOURCE.sha256,
    dwgHeader: WATER_MAP_B_EXPECTED_SOURCE.dwgHeader,
    storagePath:
      "water-network-private/source-masters/map-b-original/MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
  },
  "legacy-george-85m": {
    sourceKey: "legacy-george-85m",
    label: "Legacy Map B candidate — GEORGE 85 MB",
    canonical: false,
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    byteSize: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    dwgHeader: "AC1032",
    storagePath:
      "water-network-private/source-masters/map-b-candidates/legacy-george-85m/GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
  },
} as const;

export function getWaterMapBSourceCandidate(sourceKey: WaterMapBSourceKey) {
  return WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
}
