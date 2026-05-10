import {
  PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS,
} from "./water-access-control-readiness";

export const PANTAVION_WATER_ACCESS_FILTERING_VERSION =
  "water-access-filtering-v1" as const;

export type PantavionWaterAccessFilteringMode =
  | "blocked"
  | "diagnostic-founder-admin"
  | "viewport-scoped"
  | "operator-scoped"
  | "founder-admin-controlled";

export interface PantavionWaterAccessFilteringReadinessInput {
  accessControlReady: boolean;
  authorizedPersonStoreReady: boolean;
  bboxQueryProviderReady: boolean;
  viewportScopedFilteringRequired: boolean;
  manualPanZoomRevalidationRequired: boolean;
  placeZoneDisambiguationRequired: boolean;
  accessLevelFilteringRequired: boolean;
  statusFilteringRequired: boolean;
  auditLoggingRequired: boolean;
  rawExportBlocked: boolean;
  completeNetworkExportBlocked: boolean;
  founderAdminOverrideRequiresAudit: boolean;
  productionApprovalRequired: boolean;
  mode: PantavionWaterAccessFilteringMode;
}

export interface PantavionWaterAccessFilteringReadinessResult {
  version: typeof PANTAVION_WATER_ACCESS_FILTERING_VERSION;
  accessFilteringReady: boolean;
  productionAccessFilteringAllowed: boolean;
  blockers: string[];
  warnings: string[];
  mode: PantavionWaterAccessFilteringMode;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  mayBypassFounderApproval: false;
}

export function evaluateWaterAccessFilteringReadiness(
  input: PantavionWaterAccessFilteringReadinessInput,
): PantavionWaterAccessFilteringReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.accessControlReady) {
    blockers.push("Access control must be ready before access filtering activation.");
  }

  if (!input.authorizedPersonStoreReady) {
    blockers.push("Authorized person store must be ready before production access filtering.");
  }

  if (!input.bboxQueryProviderReady) {
    blockers.push("BBOX query provider must be ready before viewport access filtering.");
  }

  if (!input.viewportScopedFilteringRequired) {
    blockers.push("Viewport-scoped filtering is required before controlled spatial serving.");
  }

  if (!input.manualPanZoomRevalidationRequired) {
    blockers.push("Manual pan/zoom movement must revalidate access before returning any network data.");
  }

  if (!input.placeZoneDisambiguationRequired) {
    blockers.push(
      "Place/zone disambiguation is required because street names and addresses can repeat across locations.",
    );
  }

  if (!input.accessLevelFilteringRequired) {
    blockers.push("Access-level filtering is required before controlled water network serving.");
  }

  if (!input.statusFilteringRequired) {
    blockers.push("Authorized person status filtering is required before controlled water network serving.");
  }

  if (!input.auditLoggingRequired) {
    blockers.push("Access filtering decisions must be audit logged.");
  }

  if (!input.rawExportBlocked) {
    blockers.push("Access filtering must not allow raw KMZ/KML/full GeoJSON export.");
  }

  if (!input.completeNetworkExportBlocked) {
    blockers.push("Access filtering must not allow complete network export.");
  }

  if (!input.founderAdminOverrideRequiresAudit) {
    blockers.push("Founder/admin override must require audit logging.");
  }

  if (!input.productionApprovalRequired) {
    blockers.push("Founder/admin approval is required before production access filtering activation.");
  }

  if (input.mode === "blocked") {
    warnings.push(
      "Access filtering contract exists, but serving remains blocked until access control, bbox provider, and durable stores are ready.",
    );
  }

  return {
    version: PANTAVION_WATER_ACCESS_FILTERING_VERSION,
    accessFilteringReady: blockers.length === 0,
    productionAccessFilteringAllowed: blockers.length === 0,
    blockers,
    warnings,
    mode: input.mode,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    mayBypassFounderApproval: false,
  };
}

export const PANTAVION_WATER_BLOCKED_ACCESS_FILTERING_READINESS =
  evaluateWaterAccessFilteringReadiness({
    accessControlReady: PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS.accessControlReady,
    authorizedPersonStoreReady: false,
    bboxQueryProviderReady: false,
    viewportScopedFilteringRequired: true,
    manualPanZoomRevalidationRequired: true,
    placeZoneDisambiguationRequired: true,
    accessLevelFilteringRequired: true,
    statusFilteringRequired: true,
    auditLoggingRequired: true,
    rawExportBlocked: true,
    completeNetworkExportBlocked: true,
    founderAdminOverrideRequiresAudit: true,
    productionApprovalRequired: true,
    mode: "blocked",
  });
