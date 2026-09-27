import type { PantavionUtilityDomain } from "./pantavion-utility-coordination-contract";

export const PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_CONTRACT_ID =
  "pantavion_infrastructure_update_gateway_v1" as const;

export type PantavionInfrastructureUpdateIntakeMode =
  | "provider_webhook"
  | "scheduled_api_pull"
  | "secure_file_upload"
  | "portal_change_form"
  | "signed_manifest_drop"
  | "field_submission";

export type PantavionInfrastructureUpdateOperation =
  | "create"
  | "update"
  | "correct"
  | "retire"
  | "replace"
  | "bulk_replace";

export type PantavionInfrastructureUpdateState =
  | "received"
  | "identity_verified"
  | "source_preserved"
  | "validated"
  | "diff_ready"
  | "review_required"
  | "approved"
  | "published"
  | "rejected"
  | "quarantined"
  | "superseded";

export type PantavionInfrastructureAccuracyClass =
  | "surveyed"
  | "as_built"
  | "provider_declared"
  | "digitized"
  | "approximate"
  | "unknown";

export interface PantavionInfrastructureDepthEvidence {
  depthM?: number;
  depthReference?:
    | "ground_level"
    | "road_surface"
    | "cover_level"
    | "invert_level"
    | "asset_centerline"
    | "unknown";
  upstreamDepthM?: number;
  downstreamDepthM?: number;
  coverLevelM?: number;
  invertLevelM?: number;
  elevationM?: number;
  verticalDatum?: string;
  measuredAt?: string;
  method?: string;
}

export interface PantavionInfrastructureAccuracyEvidence {
  class: PantavionInfrastructureAccuracyClass;
  horizontalAccuracyM?: number;
  verticalAccuracyM?: number;
  surveyMethod?: string;
  surveyDate?: string;
  surveyReference?: string;
}

export interface PantavionInfrastructureSourceProvenance {
  providerOrganizationId: string;
  providerOrganizationName: string;
  datasetId: string;
  datasetName: string;
  providerRecordId?: string;
  providerVersion?: string;
  sourceUpdatedAt?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  licenseOrAgreementRef?: string;
  sourceUrl?: string;
  sourceCrs?: {
    authority: "EPSG" | "ESRI" | "OTHER";
    code: string;
  };
}

export interface PantavionInfrastructureUpdateEnvelope {
  updateId: string;
  idempotencyKey: string;
  intakeMode: PantavionInfrastructureUpdateIntakeMode;
  utility: PantavionUtilityDomain;
  operation: PantavionInfrastructureUpdateOperation;
  submittedAt: string;
  provenance: PantavionInfrastructureSourceProvenance;
  payload: {
    contentType: string;
    fileName?: string;
    sizeBytes?: number;
    sha256?: string;
    storageReference?: string;
    externalReference?: string;
  };
  spatialScope?: {
    type: "Point" | "LineString" | "Polygon" | "MultiPolygon" | "bbox" | "unknown";
    coordinates?: unknown;
    bbox?: [number, number, number, number];
  };
  technicalEvidence?: {
    depth?: PantavionInfrastructureDepthEvidence;
    accuracy?: PantavionInfrastructureAccuracyEvidence;
    diameterMm?: number;
    material?: string;
    pressureBar?: number;
    voltageKv?: number;
    assetClass?: string;
    installationDate?: string;
    inspectionDate?: string;
  };
}

export interface PantavionInfrastructureUpdateProcessingResult {
  updateId: string;
  state: PantavionInfrastructureUpdateState;
  preservedOriginal: boolean;
  providerIdentityVerified: boolean;
  signatureOrCredentialVerified: boolean;
  sourceHashVerified: boolean;
  licenseOrAgreementChecked: boolean;
  geometryValidated: boolean;
  crsValidated: boolean;
  depthEvidencePreserved: boolean;
  accuracyEvidencePreserved: boolean;
  diffAgainstCurrentReady: boolean;
  canonicalMutationPerformed: false;
  reviewRequired: boolean;
  publishableVersionId?: string;
  warnings: string[];
}

export const PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY = {
  oneGatewayForAllInfrastructureProviders: true,
  supportedIntakeModes: [
    "provider_webhook",
    "scheduled_api_pull",
    "secure_file_upload",
    "portal_change_form",
    "signed_manifest_drop",
    "field_submission",
  ] as const,
  simplestProviderPath:
    "secure_file_upload_or_portal_change_form_when_no_api_exists",
  preferredAutomatedPath:
    "provider_webhook_or_scheduled_api_pull_when_machine_feed_exists",
  immutableOriginalRequired: true,
  providerIdentityRequired: true,
  signedOrAuthenticatedMachineUpdatesRequired: true,
  idempotencyRequired: true,
  sourceHashRequiredWhenBytesAreDelivered: true,
  sourceCrsPreservationRequired: true,
  depthAndAccuracyEvidenceMustNeverBeInvented: true,
  providerDepthValuesMustRetainReferenceDatumAndMethod: true,
  noDirectCanonicalMutation: true,
  compareAgainstCurrentVersionBeforePublish: true,
  humanOrGovernedApprovalRequiredForAuthoritativePromotion: true,
  rollbackRequired: true,
  provenanceRequired: true,
  auditTrailRequired: true,
  staleSourceWarningRequired: true,
  missingDataMustNotBeInterpretedAsAssetAbsent: true,
  externalProviderFailureMustNotDeleteExistingCanonicalData: true,
} as const;

export const PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE = [
  "receive_update",
  "authenticate_provider",
  "enforce_idempotency",
  "preserve_original_payload",
  "verify_hash_or_signature",
  "record_license_or_data_sharing_authority",
  "detect_format_and_route_through_universal_artifact_intake",
  "validate_crs_geometry_and_schema",
  "preserve_depth_accuracy_and_engineering_metadata",
  "compare_with_current_provider_version",
  "generate_spatial_and_attribute_diff",
  "detect_conflicts_with_local_field_changes",
  "review_or_auto_approve_under_provider_policy",
  "create_new_version",
  "publish_layer_version",
  "retain_previous_version_for_rollback",
  "notify_affected_users_and_conflict_checks",
] as const;

export const PANTAVION_PROVIDER_UPDATE_EXPERIENCE = {
  noTechnicalIntegrationRequired: {
    title: "Simple provider portal",
    steps: [
      "choose_dataset",
      "upload_file_or_draw_change",
      "enter_effective_date",
      "optionally_enter_depth_accuracy_or_notes",
      "submit",
    ],
  },
  machineIntegration: {
    title: "Automatic provider sync",
    methods: [
      "webhook",
      "scheduled_rest_or_arcgis_poll",
      "wfs_or_feature_service_sync",
      "signed_manifest_and_file_drop",
    ],
    changeDetection: [
      "provider_version",
      "etag",
      "last_modified",
      "content_hash",
      "feature_level_delta_when_supported",
    ],
  },
} as const;

export function getPantavionInfrastructureUpdateGatewayContract() {
  return {
    id: PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_CONTRACT_ID,
    version: "1.0.0",
    policy: PANTAVION_INFRASTRUCTURE_UPDATE_GATEWAY_POLICY,
    pipeline: PANTAVION_INFRASTRUCTURE_UPDATE_PIPELINE,
    providerExperience: PANTAVION_PROVIDER_UPDATE_EXPERIENCE,
    truth: {
      providerUpdatesCanBeAcceptedByMultipleChannels: true,
      updatesDoNotMutateCanonicalLayersDirectly: true,
      depthAndAccuracyAreFirstClassEvidenceWhenProvided: true,
      automaticLiveProviderConnectionsRequireRealCredentialsOrPublicFeeds: true,
      unsupportedFormatsMayBePreservedForLaterAdapters: true,
    },
  };
}
