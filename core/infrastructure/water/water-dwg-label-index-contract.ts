export const PANTAVION_WATER_DWG_LABEL_INDEX_CONTRACT_ID =
  "pantavion_water_dwg_label_index_v1" as const;

export const PANTAVION_WATER_DWG_LABEL_INDEX_POLICY = {
  verifiedPrivateSourceRequired: true,
  sourceScope: "model_space_text_and_mtext",
  persistence: "memory_only",
  rawTextPublicExposureAllowed: false,
  rawGeometryPersistenceAllowed: false,
  streetNameMustComeFromCadTextOrOfficialAddressSource: true,
  streetNameInferenceFromGeometryAllowed: false,
  cadCoordinatesRemainCadCoordinatesUntilAlignmentVerified: true,
  gpsToCadOverlayRequiresAlignmentVerified: true,
  externalAddressSearchMayBeUsedAsFallback: true,
  sourceSwitchMustClearIndex: true,
  maximumIndexedLabelsPerOpenDocument: 50000,
} as const;

export function getPantavionWaterDwgLabelIndexContract() {
  return {
    id: PANTAVION_WATER_DWG_LABEL_INDEX_CONTRACT_ID,
    version: "1.0.0",
    policy: PANTAVION_WATER_DWG_LABEL_INDEX_POLICY,
    workflow: [
      "open_verified_private_dwg",
      "read_model_space_text_entities",
      "normalize_text_in_memory",
      "search_labels_locally",
      "center_cad_view_on_selected_label_when_coordinates_exist",
      "keep_gps_separate_until_alignment_verified",
    ] as const,
  };
}
