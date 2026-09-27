import type { PantavionUtilityDomain } from "./pantavion-utility-coordination-contract";

export const PANTAVION_FIELD_OBSERVATION_CONTRACT_ID =
  "pantavion_infrastructure_field_observation_v1" as const;

export type PantavionFieldObservationType =
  | "inspection"
  | "missing_asset"
  | "leak"
  | "fault"
  | "position_correction"
  | "new_asset"
  | "depth_measurement"
  | "condition_update"
  | "other";

export type PantavionFieldObservationState =
  | "captured"
  | "pending_review"
  | "verified"
  | "approved_overlay"
  | "officialization_candidate"
  | "officialized"
  | "rejected"
  | "superseded";

export interface PantavionInfrastructureFieldObservation {
  observationId: string;
  organizationId: string;
  utility: PantavionUtilityDomain;
  type: PantavionFieldObservationType;
  state: PantavionFieldObservationState;
  capturedAt: string;
  location: {
    latitude: number;
    longitude: number;
    crs: { authority: "EPSG"; code: "4326" };
    source: "gps" | "map_click" | "survey" | "coordinate_entry";
    horizontalAccuracyM?: number;
  };
  linkedAsset?: {
    providerDatasetId?: string;
    providerAssetId?: string;
    pantavionAssetId?: string;
  };
  measured?: {
    depthM?: number;
    elevationM?: number;
    diameterMm?: number;
    pressureBar?: number;
    condition?: string;
    method?: string;
  };
  evidence: {
    artifactRefs: string[];
    note?: string;
  };
  provenance: {
    capturedBy: string;
    deviceId?: string;
    sourceLayerIds: string[];
  };
}

export const PANTAVION_FIELD_OBSERVATION_POLICY = {
  reusableAcrossUtilityOrganizations: true,
  gpsAccuracyMustBePreserved: true,
  measuredDepthMustRetainMethodAndMeaning: true,
  observationsNeverMutateProviderMasterDirectly: true,
  reviewRequiredBeforeSharedPromotion: true,
  originalObservationImmutable: true,
  linkedAssetPreferredWhenKnown: true,
  photoOrDocumentEvidenceSupported: true,
  offlineQueueCompatible: true,
  duplicateDetectionRequired: true,
  auditTrailRequired: true,
} as const;

export function getPantavionFieldObservationContract() {
  return {
    id: PANTAVION_FIELD_OBSERVATION_CONTRACT_ID,
    version: "1.0.0",
    policy: PANTAVION_FIELD_OBSERVATION_POLICY,
    workflow: [
      "capture_location",
      "record_accuracy",
      "link_visible_asset_when_known",
      "record_issue_or_measurement",
      "attach_evidence",
      "preserve_immutable_observation",
      "review",
      "promote_to_overlay_or_provider_update_candidate",
      "retain_history",
    ] as const,
  };
}
