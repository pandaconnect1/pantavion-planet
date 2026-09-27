export const PANTAVION_WATER_AUTHENTIC_SOURCE_TRUTH_ID =
  "pantavion_water_authentic_source_truth_v1" as const;

export type PantavionAuthenticWaterSourceState =
  | "verified_live"
  | "byte_verified_not_ingested"
  | "registered_unverified"
  | "blocked";

export interface PantavionAuthenticWaterSource {
  id: string;
  label: string;
  role: "operational" | "canonical_master" | "legacy_master" | "future_master";
  state: PantavionAuthenticWaterSourceState;
  authenticSourceRequired: true;
  immutableOriginalRequired: true;
  rawBrowserExposureAllowed: false;
  fileName?: string;
  byteSize?: number;
  sha256?: string;
  dwgHeader?: string;
  sourceKey?: string;
  runtimeTruthSource?: string;
  notes: readonly string[];
}

export const PANTAVION_AUTHENTIC_WATER_SOURCES: readonly PantavionAuthenticWaterSource[] = [
  {
    id: "A",
    label: "Map A — Authentic Operational Network",
    role: "operational",
    state: "verified_live",
    authenticSourceRequired: true,
    immutableOriginalRequired: true,
    rawBrowserExposureAllowed: false,
    runtimeTruthSource:
      "public.water_map_a_live_status + public.water_map_a_full_status",
    notes: [
      "Production status is ready_exact.",
      "122857 placemarks, 125398 line strings, 528063 coordinate points.",
      "Browser delivery remains segmented/viewport-only.",
    ],
  },
  {
    id: "B_CANONICAL",
    label: "Map B — Canonical Authentic DWG",
    role: "canonical_master",
    state: "byte_verified_not_ingested",
    authenticSourceRequired: true,
    immutableOriginalRequired: true,
    rawBrowserExposureAllowed: false,
    fileName: "MASTER 2025_Μ_15.1.2026_ANDREASPAP-01-02-014.dwg",
    byteSize: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
    dwgHeader: "AC1032",
    sourceKey: "canonical-2026-andreaspap",
    runtimeTruthSource:
      "Library byte verification + water_map_ingest_catalog / water_map_versions when production ingest completes",
    notes: [
      "Exact source bytes verified.",
      "Not production-live until private Storage upload, server-side verification, version creation and derived delivery complete.",
      "Unknown CRS/alignment must not be invented.",
    ],
  },
  {
    id: "B_LEGACY",
    label: "Legacy Authentic DWG — GEORGE 85.7 MB",
    role: "legacy_master",
    state: "byte_verified_not_ingested",
    authenticSourceRequired: true,
    immutableOriginalRequired: true,
    rawBrowserExposureAllowed: false,
    fileName: "GEORGE_MAP_MASTER_B_C_FINAL (4).dwg",
    byteSize: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    dwgHeader: "AC1032",
    sourceKey: "legacy-george-85m",
    runtimeTruthSource:
      "Library byte verification + water_map_ingest_catalog / water_map_versions when production ingest completes",
    notes: [
      "Exact source bytes verified.",
      "Kept separate from the canonical master.",
      "Not production-live until private Storage upload, verification, versioning and derived delivery complete.",
    ],
  },
] as const;

export const PANTAVION_WATER_ENGINEERING_WORKSPACE_TRUTH = {
  id: "ENGINEERING_INTELLIGENCE",
  isAuthenticSourceMap: false,
  description:
    "Engineering/intelligence workspace that combines approved source-map views, field evidence, telemetry and analytical overlays. It must never be presented as a separate authentic master unless a real source artifact is registered and verified.",
} as const;

export const PANTAVION_WATER_FUTURE_MAP_POLICY = {
  arbitraryFutureMapIdsAllowed: true,
  authenticSourceRequiredBeforeCallingItAMasterMap: true,
  sourceBytesOrAuthoritativeFeedRequired: true,
  exactIdentityOrProviderProvenanceRequired: true,
  noDerivedWorkspaceMayBePromotedByNamingAlone: true,
  dEFAndFutureLettersRemainUnassignedUntilAuthenticSourcesExist: true,
} as const;

export function getPantavionWaterAuthenticSourceTruth() {
  return {
    id: PANTAVION_WATER_AUTHENTIC_SOURCE_TRUTH_ID,
    version: "1.0.0",
    sources: PANTAVION_AUTHENTIC_WATER_SOURCES,
    engineeringWorkspace: PANTAVION_WATER_ENGINEERING_WORKSPACE_TRUTH,
    futureMapPolicy: PANTAVION_WATER_FUTURE_MAP_POLICY,
  };
}
