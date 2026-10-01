export type PantavionWaterChangeKind =
  | "REPLACE_MAP_SOURCE"
  | "ADD_MAP_SUPPLEMENT"
  | "ADD_NETWORK_EXTENSION"
  | "UPDATE_NETWORK_AFTER_FIELD_WORK"
  | "CORRECT_SURVEYED_NETWORK"
  | "UPDATE_REFERENCE_ROADS_OR_BASEMAP";

export type PantavionWaterAuthorizedChangeRequest = {
  requestId: string;
  kind: PantavionWaterChangeKind;
  requestedBy: string;
  requestedAt: string;
  reason: string;
  sourceEvidenceRefs: string[];
  affectedMapIds: Array<"A"|"B"|"C">;
};

export const PANTAVION_WATER_CHANGE_GOVERNANCE = {
  autonomousAssistantEditsAllowed: false,
  explicitAuthorizedUserRequestRequired: true,
  inPlaceMutationOfHistoricalVersionAllowed: false,
  destructiveOverwriteAllowed: false,
  eachAcceptedChangeCreatesNewVersion: true,
  previousVersionsRemainReadable: true,
  provenanceRequired: true,
  auditRequired: true,
  sourceEvidenceRequired: true,
  hydraulicSimulationMayDirectlyModifyNetwork: false,
  fieldApprovedChangeMayCreateNewNetworkVersion: true,
} as const;

export function assertWaterChangeRequestAuthorized(
  request: PantavionWaterAuthorizedChangeRequest,
) {
  if (!request.requestId || !request.requestedBy || !request.requestedAt) {
    throw new Error("water_change_request_identity_required");
  }
  if (!request.reason.trim()) {
    throw new Error("water_change_reason_required");
  }
  if (!request.sourceEvidenceRefs.length) {
    throw new Error("water_change_source_evidence_required");
  }
  if (!request.affectedMapIds.length) {
    throw new Error("water_change_affected_map_required");
  }
  return true;
}
