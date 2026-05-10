export const PANTAVION_WATER_SPATIAL_INDEX_VERSION =
  "water-spatial-index-v1" as const;

export type PantavionWaterSpatialIndexProvider =
  | "none"
  | "postgis-gist"
  | "flatgeobuf"
  | "mbtiles-index"
  | "pmtiles-index"
  | "derived-bbox-index";

export interface PantavionWaterSpatialIndexReadinessInput {
  fullMasterSourceProtected: boolean;
  derivedIndexAllowed: boolean;
  indexProviderSelected: boolean;
  indexBuiltFromFullMaster: boolean;
  indexCoversCompleteNetwork: boolean;
  indexStoresRawNetworkPayload: boolean;
  indexStoresCompleteNetworkPayload: boolean;
  duplicateStreetNameDisambiguationRequired: boolean;
  coordinateReferenceSystemDeclared: boolean;
  founderAdminApprovalRequired: boolean;
  indexProvider: PantavionWaterSpatialIndexProvider;
}

export interface PantavionWaterSpatialIndexReadinessResult {
  version: typeof PANTAVION_WATER_SPATIAL_INDEX_VERSION;
  spatialIndexReady: boolean;
  productionIndexAllowed: boolean;
  blockers: string[];
  warnings: string[];
  indexProvider: PantavionWaterSpatialIndexProvider;
  mayStoreRawNetworkPayload: false;
  mayStoreCompleteNetworkPayload: false;
}

export function evaluateWaterSpatialIndexReadiness(
  input: PantavionWaterSpatialIndexReadinessInput,
): PantavionWaterSpatialIndexReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.fullMasterSourceProtected) {
    blockers.push("Protected full master source is required before spatial indexing.");
  }

  if (!input.derivedIndexAllowed) {
    blockers.push("Derived spatial index must be explicitly allowed before indexing.");
  }

  if (!input.indexProviderSelected) {
    blockers.push("Spatial index provider must be selected before bbox or tile serving.");
  }

  if (!input.indexBuiltFromFullMaster) {
    blockers.push("Spatial index must be derived from the full master network, not a sample.");
  }

  if (!input.indexCoversCompleteNetwork) {
    blockers.push("Spatial index must cover the complete controlled water network.");
  }

  if (input.indexStoresRawNetworkPayload) {
    blockers.push("Spatial index must not store raw KMZ/KML/full GeoJSON payloads.");
  }

  if (input.indexStoresCompleteNetworkPayload) {
    blockers.push("Spatial index must not store complete network payloads.");
  }

  if (!input.duplicateStreetNameDisambiguationRequired) {
    blockers.push(
      "Duplicate street names and repeated addresses must require place/zone disambiguation before search or serving.",
    );
  }

  if (!input.coordinateReferenceSystemDeclared) {
    blockers.push("Coordinate reference system must be declared before spatial indexing.");
  }

  if (!input.founderAdminApprovalRequired) {
    blockers.push("Founder/admin approval is required before production spatial index activation.");
  }

  if (input.indexProvider === "none") {
    blockers.push("Spatial index provider is not selected.");
  }

  if (input.derivedIndexAllowed && !input.indexProviderSelected) {
    warnings.push(
      "Spatial index may be derived later, but production serving remains blocked until a provider is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_SPATIAL_INDEX_VERSION,
    spatialIndexReady: blockers.length === 0,
    productionIndexAllowed: blockers.length === 0,
    blockers,
    warnings,
    indexProvider: input.indexProvider,
    mayStoreRawNetworkPayload: false,
    mayStoreCompleteNetworkPayload: false,
  };
}

export const PANTAVION_WATER_BLOCKED_SPATIAL_INDEX_READINESS =
  evaluateWaterSpatialIndexReadiness({
    fullMasterSourceProtected: true,
    derivedIndexAllowed: true,
    indexProviderSelected: false,
    indexBuiltFromFullMaster: false,
    indexCoversCompleteNetwork: false,
    indexStoresRawNetworkPayload: false,
    indexStoresCompleteNetworkPayload: false,
    duplicateStreetNameDisambiguationRequired: true,
    coordinateReferenceSystemDeclared: false,
    founderAdminApprovalRequired: true,
    indexProvider: "none",
  });
