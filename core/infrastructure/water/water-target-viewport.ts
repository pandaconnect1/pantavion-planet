export const PANTAVION_WATER_TARGET_VIEWPORT_VERSION =
  "water-target-viewport-search-v1" as const;

export type PantavionWaterTargetViewportSource =
  | "current-location"
  | "address-search"
  | "manual-map-pan-zoom"
  | "founder-admin-selected-area";

export interface PantavionWaterTargetViewportReadinessInput {
  currentLocationViewportAllowed: boolean;
  addressSearchViewportAllowed: boolean;
  manualPanZoomViewportAllowed: boolean;
  founderAdminSelectedViewportAllowed: boolean;
  addressCandidateDisambiguationRequired: boolean;
  placeZoneDisambiguationRequired: boolean;
  selectedCandidateRequiredBeforeNetworkLoad: boolean;
  bboxDerivedFromSelectedTargetRequired: boolean;
  viewportBufferPolicyRequired: boolean;
  accessFilteringRequired: boolean;
  auditLoggingRequired: boolean;
  rawExportBlocked: boolean;
  completeNetworkExportBlocked: boolean;
  founderAdminApprovalRequired: boolean;
}

export interface PantavionWaterTargetViewportReadinessResult {
  version: typeof PANTAVION_WATER_TARGET_VIEWPORT_VERSION;
  targetViewportReady: boolean;
  productionTargetViewportAllowed: boolean;
  blockers: string[];
  warnings: string[];
  allowedSources: PantavionWaterTargetViewportSource[];
  mayLoadNetworkFromCurrentLocationOnly: false;
  mayAutoPickAmbiguousAddress: false;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
}

export function evaluateWaterTargetViewportReadiness(
  input: PantavionWaterTargetViewportReadinessInput,
): PantavionWaterTargetViewportReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const allowedSources: PantavionWaterTargetViewportSource[] = [];

  if (input.currentLocationViewportAllowed) {
    allowedSources.push("current-location");
  }

  if (input.addressSearchViewportAllowed) {
    allowedSources.push("address-search");
  }

  if (input.manualPanZoomViewportAllowed) {
    allowedSources.push("manual-map-pan-zoom");
  }

  if (input.founderAdminSelectedViewportAllowed) {
    allowedSources.push("founder-admin-selected-area");
  }

  if (!input.currentLocationViewportAllowed) {
    warnings.push("Current-location viewport is not enabled yet.");
  }

  if (!input.addressSearchViewportAllowed) {
    blockers.push("Address-search target viewport must be supported before map search serving.");
  }

  if (!input.manualPanZoomViewportAllowed) {
    blockers.push("Manual pan/zoom target viewport must be supported before controlled map serving.");
  }

  if (!input.founderAdminSelectedViewportAllowed) {
    blockers.push("Founder/admin selected target viewport must be supported before controlled production use.");
  }

  if (!input.addressCandidateDisambiguationRequired) {
    blockers.push("Address search must return candidates when street names or addresses repeat.");
  }

  if (!input.placeZoneDisambiguationRequired) {
    blockers.push("Place/zone disambiguation is required before loading water network from search.");
  }

  if (!input.selectedCandidateRequiredBeforeNetworkLoad) {
    blockers.push("A selected address/place candidate is required before network loading.");
  }

  if (!input.bboxDerivedFromSelectedTargetRequired) {
    blockers.push("BBOX must be derived from the selected target, not only from current GPS location.");
  }

  if (!input.viewportBufferPolicyRequired) {
    blockers.push("Viewport buffer policy is required before target viewport serving.");
  }

  if (!input.accessFilteringRequired) {
    blockers.push("Target viewport serving must require access filtering.");
  }

  if (!input.auditLoggingRequired) {
    blockers.push("Target viewport serving must require audit logging.");
  }

  if (!input.rawExportBlocked) {
    blockers.push("Target viewport serving must block raw KMZ/KML/full GeoJSON export.");
  }

  if (!input.completeNetworkExportBlocked) {
    blockers.push("Target viewport serving must block complete network export.");
  }

  if (!input.founderAdminApprovalRequired) {
    blockers.push("Founder/admin approval is required before production target viewport activation.");
  }

  return {
    version: PANTAVION_WATER_TARGET_VIEWPORT_VERSION,
    targetViewportReady: blockers.length === 0,
    productionTargetViewportAllowed: blockers.length === 0,
    blockers,
    warnings,
    allowedSources,
    mayLoadNetworkFromCurrentLocationOnly: false,
    mayAutoPickAmbiguousAddress: false,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
  };
}

export const PANTAVION_WATER_BLOCKED_TARGET_VIEWPORT_READINESS =
  evaluateWaterTargetViewportReadiness({
    currentLocationViewportAllowed: true,
    addressSearchViewportAllowed: true,
    manualPanZoomViewportAllowed: true,
    founderAdminSelectedViewportAllowed: true,
    addressCandidateDisambiguationRequired: true,
    placeZoneDisambiguationRequired: true,
    selectedCandidateRequiredBeforeNetworkLoad: true,
    bboxDerivedFromSelectedTargetRequired: true,
    viewportBufferPolicyRequired: false,
    accessFilteringRequired: true,
    auditLoggingRequired: true,
    rawExportBlocked: true,
    completeNetworkExportBlocked: true,
    founderAdminApprovalRequired: true,
  });
