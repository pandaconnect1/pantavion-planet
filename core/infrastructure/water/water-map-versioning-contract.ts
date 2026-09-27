export const PANTAVION_WATER_MAP_VERSIONING_CONTRACT_ID =
  "pantavion_water_map_versioning_v1" as const;

export type PantavionWaterMapVersionStatus =
  | "received"
  | "inspected"
  | "candidate"
  | "approved_reference"
  | "superseded_reference"
  | "archived";

export interface PantavionWaterMapVersion {
  versionId: string;
  mapId: string;
  versionNumber: number;
  label: string;
  status: PantavionWaterMapVersionStatus;
  sourceRef: string;
  sourceFingerprint: string;
  sourceDate?: string;
  receivedAt: string;
  receivedBy: string;
  coordinateReferenceSystem?: {
    authority: "EPSG" | "ESRI";
    code: string;
  };
  notes?: string[];
  immutableSource: true;
  deletedAutomatically: false;
}

export interface PantavionWaterMapVersionComparison {
  oldVersionId: string;
  newVersionId: string;
  compareMode: "side-by-side" | "toggle" | "swipe" | "difference-overlay";
  changes: {
    newAssets: string[];
    removedAssets: string[];
    geometryChangedAssets: string[];
    attributeChangedAssets: string[];
    matchedLocalPatchIds: string[];
    unmatchedLocalPatchIds: string[];
    conflicts: string[];
  };
  truth: {
    comparisonDoesNotMutateEitherSource: true;
    localChangesRemainSeparateUntilReconciled: true;
    conflictsRequireReview: true;
  };
}

export interface PantavionWaterMapVersionSelection {
  mapId: string;
  selectedVersionId: string;
  availableVersionIds: string[];
  mode: "single-version" | "compare-two-versions";
  compareWithVersionId?: string;
  overlays: {
    approvedSpatialPatches: true;
    pendingOwnPatches: boolean;
    evidencePins: true;
    protectedWaterNetwork: true;
  };
}

export function assertPantavionWaterMapVersion(
  version: PantavionWaterMapVersion,
) {
  if (!version.versionId?.trim()) throw new Error("water_map_version_id_required");
  if (!version.mapId?.trim()) throw new Error("water_map_version_map_id_required");
  if (!Number.isInteger(version.versionNumber) || version.versionNumber < 1) {
    throw new Error("water_map_version_number_invalid");
  }
  if (!version.sourceRef?.trim()) throw new Error("water_map_version_source_ref_required");
  if (!version.sourceFingerprint?.trim()) {
    throw new Error("water_map_version_fingerprint_required");
  }
  return version;
}

export function getPantavionWaterMapVersioningContract() {
  return {
    id: PANTAVION_WATER_MAP_VERSIONING_CONTRACT_ID,
    version: "1.0.0",
    doctrine: {
      neverReplaceOldMapBlindly: true,
      preserveEveryOriginalVersion: true,
      oldAndNewSelectable: true,
      oldAndNewComparable: true,
      localApprovedChangesRemainIndependentOverlays: true,
      localChangesCanRenderOnOldAndNewUntilReconciled: true,
      matchingLocalChangesMayBeOfficializedAfterReview: true,
      unmatchedLocalChangesMustBePreserved: true,
      conflictsRequireExplicitReview: true,
      rollbackToPriorReferenceRequired: true,
      noAutomaticDeletionOfSupersededMap: true,
    },
    selectionModes: [
      "single-version",
      "compare-two-versions",
    ],
    compareModes: [
      "side-by-side",
      "toggle",
      "swipe",
      "difference-overlay",
    ],
    migrationPipeline: [
      "preserve_new_source",
      "verify_source_fingerprint",
      "detect_or_confirm_crs",
      "normalize_for_comparison_without_mutating_source",
      "compare_against_current_reference",
      "compare_against_local_spatial_patches",
      "match_equivalent_changes",
      "detect_new_removed_geometry_attribute_differences",
      "flag_conflicts",
      "authorized_review",
      "approve_new_reference_when_authorized",
      "preserve_old_reference_as_superseded",
      "keep_unmatched_local_changes",
      "retain_rollback_path",
    ],
  };
}
