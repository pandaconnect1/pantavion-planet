/**
 * Founder water directive — 2026-10-01.
 *
 * This is an executable contract, not a LIVE claim. It defines one canonical
 * approved network state rendered consistently across all map views while
 * preserving every imported/master source byte-for-byte.
 */

export type WaterCanonicalViewId = "A" | "B" | "C" | "D" | "E";
export type WaterOperationalViewId = "B_ROADS" | "C_TERRAIN" | "D_CADASTRAL";

export const PANTAVION_WATER_CANONICAL_SYNC_ID =
  "pantavion_water_canonical_sync_v1" as const;

export const pantavionWaterCanonicalSyncPolicy = {
  canonicalNetworkIsSingleSourceOfApprovedTruth: true,
  approvedChangeRendersOnEveryMapView: true,
  approvedChangeMustNotBeCopiedIndependentlyPerMap: true,
  pendingChangeDoesNotAlterCanonicalNetwork: true,
  founderOrAuthorizedSupervisorApprovalRequired: true,
  approvalAuditRequired: true,
  rollbackRequired: true,
  originalMapSourcesRemainImmutable: true,
  accessRoutingServingFixMustNotMutateMapAGeometry: true,
  importedMasterBCDESourcesRemainImmutable: true,
} as const;

export const pantavionWaterOperationalViews = [
  {
    id: "B_ROADS",
    label: "B — Οδικό δίκτυο",
    background: "official-roads",
    networkOverlay: "canonical-approved-water-network",
    purpose: "field operations, valves, pipes, faults, repairs and extensions",
  },
  {
    id: "C_TERRAIN",
    label: "Γ — Φυσικό έδαφος / υψόμετρα",
    background: "official-topography-terrain-contours",
    networkOverlay: "canonical-approved-water-network",
    purpose:
      "elevation, terrain and hydraulic-engineering analysis using measured/verified data",
  },
  {
    id: "D_CADASTRAL",
    label: "Δ — Κτηματολογικό",
    background: "official-cadastral-parcels",
    networkOverlay: "canonical-approved-water-network",
    purpose: "parcels, boundaries, planning and network development",
  },
] as const;

export type WaterLibraryArtifactKind =
  | "photo"
  | "pdf"
  | "scan"
  | "dwg"
  | "dxf"
  | "kml"
  | "kmz"
  | "geopdf"
  | "geotiff"
  | "other";

export interface WaterLibraryArtifactContract {
  artifactId: string;
  kind: WaterLibraryArtifactKind;
  originalRef: string;
  originalFingerprint: string;
  originalBytesImmutable: true;
  uploadedBy: string;
  uploadedAt: string;
  classification: {
    area?: string;
    street?: string;
    parcelReference?: string;
    project?: string;
    networkAssetIds?: string[];
    tags?: string[];
  };
  localization: {
    state:
      | "unlocated"
      | "location_candidate"
      | "georeference_candidate"
      | "confirmed";
    candidateMapIds?: WaterCanonicalViewId[];
    evidence?: string[];
    founderOrAuthorizedReviewRequiredBeforeCanonicalUse: true;
  };
}

export const pantavionWaterLibraryPolicy = {
  libraryButtonRequiredBesideMapLayers: true,
  preserveOriginalBeforeAnalysis: true,
  acceptPhotosPdfScansCadKmlKmzAndFutureFormats: true,
  classifyByAreaStreetParcelProjectAssetAndTags: true,
  aiMayProposeAreaAndGeoreference: true,
  aiMustNotSilentlyPromoteLocationToCanonical: true,
  showArtifactOnMapWhenLocationConfirmed: true,
  showLinkedArtifactsFromMapAsset: true,
  sourceArtifactNeverOverwrittenByDerivedGeoreference: true,
} as const;

export const pantavionWaterHydraulicTruthPolicy = {
  terrainAndElevationViewRequired: true,
  pressureReadingsMayBeMeasuredOrVerified: true,
  calculatedPressureMustBeLabelledCalculated: true,
  estimatedValuesMustNeverBePresentedAsMeasured: true,
  pipeDiameterMaterialElevationPrvTankPumpAndTelemetryMayFeedAnalysis: true,
  aiMayExplainAndRecommendChecks: true,
  aiMustNotInventMissingHydraulicInputs: true,
} as const;

export function getPantavionWaterCanonicalSyncContract() {
  return {
    id: PANTAVION_WATER_CANONICAL_SYNC_ID,
    version: "1.0.0",
    status: "contract_active_runtime_verification_required",
    sync: pantavionWaterCanonicalSyncPolicy,
    operationalViews: pantavionWaterOperationalViews,
    library: pantavionWaterLibraryPolicy,
    hydraulics: pantavionWaterHydraulicTruthPolicy,
  };
}
