export type PantavionWaterMasterMapId = "A" | "B" | "C";

export type PantavionWaterMasterSourceKind =
  | "dwg"
  | "dxf"
  | "kmz"
  | "kml"
  | "geojson"
  | "survey"
  | "scanner"
  | "pdf"
  | "field_verified_source";

export type PantavionWaterDerivedLayerKind =
  | "browser_safe_network"
  | "approved_user_network"
  | "hydraulic_model_input"
  | "operations_layer"
  | "fault_history_layer"
  | "pressure_zone_layer"
  | "valve_layer"
  | "engineering_review_layer";

export type PantavionWaterLossPolicy =
  | "no_loss_allowed"
  | "visual_simplification_only"
  | "attribute_preserving"
  | "engineering_review_required"
  | "founder_approval_required";

export type PantavionWaterMasterIntegrityContract = {
  readonly doctrine: "PANTAVION_WATER_MASTER_MAPS_ARE_IMMUTABLE_ENGINEERING_RECORDS";
  readonly version: "1.0.0";
  readonly appliesTo: readonly PantavionWaterMasterMapId[];
  readonly rawSourcePublic: false;
  readonly rawSourceInGitHub: false;
  readonly rawSourceLoadedInBrowser: false;
  readonly noSilentMasterMutation: true;
  readonly noSamplingAsFinal: true;
  readonly noPreviewAsProduction: true;
  readonly noCoordinateMutationWithoutApproval: true;
  readonly noLayerOrAttributeDeletionWithoutApproval: true;
  readonly founderApprovalRequiredForMasterReplacement: true;
  readonly humanApprovalRequiredForOfficialTruth: true;
  readonly everyDerivedLayerRequiresProvenance: true;
  readonly everyDerivedLayerRequiresRollbackRef: true;
};

export type PantavionWaterMasterSourceRecord = {
  readonly mapId: PantavionWaterMasterMapId;
  readonly sourceKind: PantavionWaterMasterSourceKind;
  readonly sourceFileName: string;
  readonly sourceVersion: string;
  readonly sourceHashSha256: string;
  readonly sizeBytes: number;
  readonly createdAt: string;
  readonly registeredAt: string;
  readonly registeredBy: string;
  readonly storageLocation: "private_founder_admin_vault";
  readonly publicAccess: false;
  readonly githubTracked: false;
  readonly browserLoaded: false;
  readonly immutableEngineeringRecord: true;
  readonly notes?: string;
};

export type PantavionWaterDerivedLayerRecord = {
  readonly mapId: PantavionWaterMasterMapId;
  readonly layerKind: PantavionWaterDerivedLayerKind;
  readonly sourceFileName: string;
  readonly sourceVersion: string;
  readonly sourceHashSha256: string;
  readonly derivedLayerId: string;
  readonly derivedLayerHashSha256: string;
  readonly createdAt: string;
  readonly processingMethod: string;
  readonly processingTool?: string;
  readonly lossPolicy: PantavionWaterLossPolicy;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly rollbackRef: string;
  readonly browserSafe: true;
  readonly approvedUsersOnly: true;
  readonly rawSourcePublic: false;
  readonly rawSourceInGitHub: false;
  readonly rawSourceLoadedInBrowser: false;
  readonly officialTruthAfterHumanApprovalOnly: true;
};

export const PANTAVION_WATER_MASTER_MAP_INTEGRITY_CONTRACT: PantavionWaterMasterIntegrityContract = {
  doctrine: "PANTAVION_WATER_MASTER_MAPS_ARE_IMMUTABLE_ENGINEERING_RECORDS",
  version: "1.0.0",
  appliesTo: ["A", "B", "C"],
  rawSourcePublic: false,
  rawSourceInGitHub: false,
  rawSourceLoadedInBrowser: false,
  noSilentMasterMutation: true,
  noSamplingAsFinal: true,
  noPreviewAsProduction: true,
  noCoordinateMutationWithoutApproval: true,
  noLayerOrAttributeDeletionWithoutApproval: true,
  founderApprovalRequiredForMasterReplacement: true,
  humanApprovalRequiredForOfficialTruth: true,
  everyDerivedLayerRequiresProvenance: true,
  everyDerivedLayerRequiresRollbackRef: true,
} as const;

export function assertPantavionWaterMasterSourceIsProtected(
  source: PantavionWaterMasterSourceRecord
): true {
  if (source.publicAccess !== false) {
    throw new Error("PANTAVION_WATER_MASTER_SOURCE_MUST_NOT_BE_PUBLIC");
  }

  if (source.githubTracked !== false) {
    throw new Error("PANTAVION_WATER_MASTER_SOURCE_MUST_NOT_BE_TRACKED_IN_GITHUB");
  }

  if (source.browserLoaded !== false) {
    throw new Error("PANTAVION_WATER_MASTER_SOURCE_MUST_NOT_LOAD_IN_BROWSER");
  }

  if (source.storageLocation !== "private_founder_admin_vault") {
    throw new Error("PANTAVION_WATER_MASTER_SOURCE_MUST_STAY_IN_PRIVATE_VAULT");
  }

  if (source.immutableEngineeringRecord !== true) {
    throw new Error("PANTAVION_WATER_MASTER_SOURCE_MUST_BE_IMMUTABLE_ENGINEERING_RECORD");
  }

  return true;
}

export function assertPantavionWaterDerivedLayerIsValid(
  layer: PantavionWaterDerivedLayerRecord
): true {
  if (layer.rawSourcePublic !== false) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_MUST_NOT_EXPOSE_RAW_SOURCE_PUBLICLY");
  }

  if (layer.rawSourceInGitHub !== false) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_MUST_NOT_TRACK_RAW_SOURCE_IN_GITHUB");
  }

  if (layer.rawSourceLoadedInBrowser !== false) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_MUST_NOT_LOAD_RAW_SOURCE_IN_BROWSER");
  }

  if (layer.browserSafe !== true) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_MUST_BE_BROWSER_SAFE");
  }

  if (layer.approvedUsersOnly !== true) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_MUST_BE_APPROVED_USERS_ONLY");
  }

  if (!layer.sourceHashSha256 || !layer.derivedLayerHashSha256 || !layer.rollbackRef) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_REQUIRES_PROVENANCE_AND_ROLLBACK");
  }

  if (layer.officialTruthAfterHumanApprovalOnly !== true) {
    throw new Error("PANTAVION_WATER_DERIVED_LAYER_REQUIRES_HUMAN_APPROVAL_FOR_OFFICIAL_TRUTH");
  }

  return true;
}

export const PANTAVION_WATER_MASTER_MAP_NON_NEGOTIABLES = [
  "Master A/B/C sources are immutable engineering records.",
  "Raw DWG/DXF/KMZ/KML sources must never be public.",
  "Raw engineering sources must never be committed to GitHub.",
  "Raw engineering sources must never load directly in the browser.",
  "Derived layers must preserve provenance, source hash, method, approval, and rollback.",
  "No sampling or preview layer may be presented as production truth.",
  "No coordinates, layers, attributes, valves, pipes, zones, or records may be silently changed.",
  "AI may observe, compare, warn, and propose, but official truth requires human approval.",
] as const;
