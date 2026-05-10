export const PANTAVION_WATER_SPATIAL_SERVING_READINESS_VERSION =
  "water-spatial-serving-readiness-v1" as const;

export type PantavionWaterSpatialServingProvider =
  | "none"
  | "postgis"
  | "bbox-api"
  | "vector-tiles"
  | "pmtiles"
  | "mbtiles"
  | "protected-tile-service";

export interface PantavionWaterSpatialServingReadinessInput {
  fullMasterSourceProtected: boolean;
  spatialIndexAvailable: boolean;
  bboxQueryProviderAvailable: boolean;
  accessFilteringAvailable: boolean;
  auditLoggingAvailable: boolean;
  rawExportBlocked: boolean;
  browserFullNetworkBlocked: boolean;
  servingProvider: PantavionWaterSpatialServingProvider;
  founderAdminApprovalForProduction: boolean;
}

export interface PantavionWaterSpatialServingReadinessResult {
  version: typeof PANTAVION_WATER_SPATIAL_SERVING_READINESS_VERSION;
  spatialServingReady: boolean;
  productionActivationAllowed: boolean;
  blockers: string[];
  warnings: string[];
  servingProvider: PantavionWaterSpatialServingProvider;
  allowedServingPattern: "none" | "bbox-api" | "protected-vector-tile-service";
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
}

export function evaluateWaterSpatialServingReadiness(
  input: PantavionWaterSpatialServingReadinessInput,
): PantavionWaterSpatialServingReadinessResult {
  const spatialBlockers: string[] = [];
  const warnings: string[] = [];

  if (!input.fullMasterSourceProtected) {
    spatialBlockers.push("Protected full master source is required before spatial serving.");
  }

  if (!input.spatialIndexAvailable) {
    spatialBlockers.push("Spatial index is required before bbox or tile serving.");
  }

  if (!input.bboxQueryProviderAvailable) {
    spatialBlockers.push("BBOX query provider is required before viewport serving.");
  }

  if (!input.accessFilteringAvailable) {
    spatialBlockers.push("Access filtering is required before controlled spatial serving.");
  }

  if (!input.auditLoggingAvailable) {
    spatialBlockers.push("Audit logging is required before controlled spatial serving.");
  }

  if (!input.rawExportBlocked) {
    spatialBlockers.push("Raw KMZ/KML/full GeoJSON export must be blocked.");
  }

  if (!input.browserFullNetworkBlocked) {
    spatialBlockers.push("Browser full-network loading must be blocked.");
  }

  if (input.servingProvider === "none") {
    spatialBlockers.push("Spatial serving provider is not selected.");
  }

  const productionBlockers = [...spatialBlockers];

  if (!input.founderAdminApprovalForProduction) {
    productionBlockers.push(
      "Founder/admin approval is required before production spatial serving activation.",
    );
  }

  if (input.servingProvider === "pmtiles" || input.servingProvider === "mbtiles") {
    warnings.push(
      "PMTiles/MBTiles may be used only as controlled diagnostic or derived serving artifacts, not source truth.",
    );
  }

  return {
    version: PANTAVION_WATER_SPATIAL_SERVING_READINESS_VERSION,
    spatialServingReady: spatialBlockers.length === 0,
    productionActivationAllowed: productionBlockers.length === 0,
    blockers: productionBlockers,
    warnings,
    servingProvider: input.servingProvider,
    allowedServingPattern:
      input.servingProvider === "postgis" || input.servingProvider === "bbox-api"
        ? "bbox-api"
        : input.servingProvider === "vector-tiles" ||
            input.servingProvider === "protected-tile-service"
          ? "protected-vector-tile-service"
          : "none",
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
  };
}

export const PANTAVION_WATER_BLOCKED_SPATIAL_SERVING_READINESS =
  evaluateWaterSpatialServingReadiness({
    fullMasterSourceProtected: true,
    spatialIndexAvailable: false,
    bboxQueryProviderAvailable: false,
    accessFilteringAvailable: false,
    auditLoggingAvailable: false,
    rawExportBlocked: true,
    browserFullNetworkBlocked: true,
    servingProvider: "none",
    founderAdminApprovalForProduction: false,
  });
