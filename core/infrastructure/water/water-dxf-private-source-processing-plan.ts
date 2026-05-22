export const WATER_DXF_PRIVATE_SOURCE_PROCESSING_PLAN_VERSION = "2026-05-22.v1";

export const WATER_PRIVATE_SOURCE_INPUT_KINDS = [
  "dwg_master",
  "dxf_export",
  "kmz_reference",
  "kml_reference",
  "geojson_reference",
  "pdf_plan",
  "scanner_report",
  "contractor_as_built",
] as const;

export const WATER_PRIVATE_SOURCE_PROCESSING_STEPS = [
  "receive_private_source",
  "store_in_founder_source_vault",
  "record_provenance",
  "virus_and_integrity_check",
  "inspect_layers_and_geometry",
  "compare_against_reference_truth",
  "extract_lightweight_layers",
  "simplify_for_safe_map_use",
  "attach_version_and_rollback",
  "prepare_founder_preview",
  "founder_review",
  "founder_approval",
  "publish_approved_derived_layer",
] as const;

export const WATER_PRIVATE_SOURCE_PROCESSING_BLOCKERS = [
  "raw_source_is_public",
  "raw_source_committed_to_github",
  "raw_source_loaded_in_browser",
  "no_founder_approval",
  "no_backup",
  "no_rollback",
  "missing_provenance",
  "missing_reference_comparison",
  "data_loss_detected",
  "sensitive_layer_exposed_to_users",
] as const;

export type WaterPrivateSourceInputKind =
  (typeof WATER_PRIVATE_SOURCE_INPUT_KINDS)[number];

export type WaterPrivateSourceProcessingStep =
  (typeof WATER_PRIVATE_SOURCE_PROCESSING_STEPS)[number];

export type WaterPrivateSourceProcessingBlocker =
  (typeof WATER_PRIVATE_SOURCE_PROCESSING_BLOCKERS)[number];

export type WaterDxfPrivateSourceProcessingJob = {
  id: string;
  sourceKind: WaterPrivateSourceInputKind;
  title: string;
  originalFileName?: string;
  privateStorageRef?: string;
  sourceVaultRef?: string;
  referenceTruthRefs: string[];
  currentStep: WaterPrivateSourceProcessingStep;
  blockers: WaterPrivateSourceProcessingBlocker[];
  derivedLayerRefs: string[];
  founderPreviewRef?: string;
  founderApproved: boolean;
  rawSourcePublic: false;
  rawSourceInGitHub: false;
  rawSourceLoadedInBrowser: false;
  backupRef?: string;
  rollbackRef?: string;
  createdAt: string;
  updatedAt: string;
};

export const WATER_DXF_PRIVATE_SOURCE_PROCESSING_RULES = {
  version: WATER_DXF_PRIVATE_SOURCE_PROCESSING_PLAN_VERSION,
  largeFilesAreNotRejected: true,
  rawDwgDxfMustStayPrivate: true,
  rawDwgDxfMustNotEnterGitHub: true,
  rawDwgDxfMustNotEnterPublicFolder: true,
  rawDwgDxfMustNotEnterBrowserBundle: true,
  rawDwgDxfMustNotLoadDirectlyInBrowser: true,
  founderSourceVaultRequired: true,
  lightweightDerivedLayersRequired: true,
  referenceTruthComparisonRequired: true,
  founderApprovalRequiredBeforePublishing: true,
  backupRequiredBeforeMasterChange: true,
  rollbackRequired: true,
  noDataLossAllowed: true,
} as const;

export function createWaterDxfPrivateSourceProcessingJob(input: {
  id: string;
  sourceKind: WaterPrivateSourceInputKind;
  title: string;
  originalFileName?: string;
  privateStorageRef?: string;
  sourceVaultRef?: string;
  referenceTruthRefs?: string[];
  backupRef?: string;
  createdAt?: string;
}): WaterDxfPrivateSourceProcessingJob {
  const now = input.createdAt || new Date().toISOString();

  return {
    id: input.id,
    sourceKind: input.sourceKind,
    title: input.title,
    originalFileName: input.originalFileName,
    privateStorageRef: input.privateStorageRef,
    sourceVaultRef: input.sourceVaultRef,
    referenceTruthRefs: input.referenceTruthRefs || [],
    currentStep: "receive_private_source",
    blockers: [],
    derivedLayerRefs: [],
    founderApproved: false,
    rawSourcePublic: false,
    rawSourceInGitHub: false,
    rawSourceLoadedInBrowser: false,
    backupRef: input.backupRef,
    createdAt: now,
    updatedAt: now,
  };
}

export function hasWaterPrivateSourceProcessingBlocker(
  job: WaterDxfPrivateSourceProcessingJob,
) {
  return job.blockers.length > 0;
}

export function canPrepareWaterFounderPreview(
  job: WaterDxfPrivateSourceProcessingJob,
) {
  return (
    job.rawSourcePublic === false &&
    job.rawSourceInGitHub === false &&
    job.rawSourceLoadedInBrowser === false &&
    job.referenceTruthRefs.length > 0 &&
    job.blockers.length === 0
  );
}

export function canPublishWaterDerivedLayerFromPrivateSource(
  job: WaterDxfPrivateSourceProcessingJob,
) {
  return (
    job.founderApproved === true &&
    job.derivedLayerRefs.length > 0 &&
    job.rollbackRef !== undefined &&
    job.rawSourcePublic === false &&
    job.rawSourceInGitHub === false &&
    job.rawSourceLoadedInBrowser === false &&
    job.blockers.length === 0
  );
}