import {
  PANTAVION_WATER_BLOCKED_SPATIAL_INDEX_READINESS,
} from "./water-spatial-index";

export const PANTAVION_WATER_BBOX_QUERY_PROVIDER_VERSION =
  "water-bbox-query-provider-v1" as const;

export type PantavionWaterBboxQueryProvider =
  | "none"
  | "postgis-bbox-api"
  | "protected-bbox-api"
  | "derived-bbox-query"
  | "protected-vector-tile-bounds";

export interface PantavionWaterBboxQueryProviderReadinessInput {
  fullMasterSourceProtected: boolean;
  spatialIndexReady: boolean;
  providerSelected: boolean;
  providerBackedByCompleteIndex: boolean;
  bboxValidationReady: boolean;
  viewportLimitEnforced: boolean;
  zoomLimitEnforced: boolean;
  accessFilteringRequired: boolean;
  auditLoggingRequired: boolean;
  duplicateStreetNameDisambiguationRequired: boolean;
  rawExportBlocked: boolean;
  completeNetworkExportBlocked: boolean;
  browserFullNetworkBlocked: boolean;
  founderAdminApprovalRequired: boolean;
  provider: PantavionWaterBboxQueryProvider;
}

export interface PantavionWaterBboxQueryProviderReadinessResult {
  version: typeof PANTAVION_WATER_BBOX_QUERY_PROVIDER_VERSION;
  bboxQueryProviderReady: boolean;
  productionBboxQueriesAllowed: boolean;
  blockers: string[];
  warnings: string[];
  provider: PantavionWaterBboxQueryProvider;
  mayReturnRawMaster: false;
  mayReturnCompleteNetwork: false;
  mayBypassAccessFiltering: false;
}

export function evaluateWaterBboxQueryProviderReadiness(
  input: PantavionWaterBboxQueryProviderReadinessInput,
): PantavionWaterBboxQueryProviderReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.fullMasterSourceProtected) {
    blockers.push("Protected full master source is required before bbox query serving.");
  }

  if (!input.spatialIndexReady) {
    blockers.push("Spatial index must be ready before bbox query provider activation.");
  }

  if (!input.providerSelected) {
    blockers.push("BBOX query provider must be selected before viewport serving.");
  }

  if (!input.providerBackedByCompleteIndex) {
    blockers.push("BBOX query provider must be backed by the complete controlled spatial index.");
  }

  if (!input.bboxValidationReady) {
    blockers.push("BBOX query provider requires strict bbox validation.");
  }

  if (!input.viewportLimitEnforced) {
    blockers.push("BBOX query provider requires viewport limit enforcement.");
  }

  if (!input.zoomLimitEnforced) {
    blockers.push("BBOX query provider requires zoom limit enforcement.");
  }

  if (!input.accessFilteringRequired) {
    blockers.push("BBOX query provider must require access filtering.");
  }

  if (!input.auditLoggingRequired) {
    blockers.push("BBOX query provider must require audit logging.");
  }

  if (!input.duplicateStreetNameDisambiguationRequired) {
    blockers.push(
      "BBOX query provider must preserve duplicate street-name and place/zone disambiguation rules.",
    );
  }

  if (!input.rawExportBlocked) {
    blockers.push("BBOX query provider must block raw KMZ/KML/full GeoJSON export.");
  }

  if (!input.completeNetworkExportBlocked) {
    blockers.push("BBOX query provider must block complete network export.");
  }

  if (!input.browserFullNetworkBlocked) {
    blockers.push("BBOX query provider must block browser full-network loading.");
  }

  if (!input.founderAdminApprovalRequired) {
    blockers.push("Founder/admin approval is required before production bbox query activation.");
  }

  if (input.provider === "none") {
    blockers.push("BBOX query provider is not selected.");
  }

  if (input.bboxValidationReady && input.viewportLimitEnforced && !input.providerSelected) {
    warnings.push(
      "BBOX validation rules are ready, but production viewport serving remains blocked until a provider is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_BBOX_QUERY_PROVIDER_VERSION,
    bboxQueryProviderReady: blockers.length === 0,
    productionBboxQueriesAllowed: blockers.length === 0,
    blockers,
    warnings,
    provider: input.provider,
    mayReturnRawMaster: false,
    mayReturnCompleteNetwork: false,
    mayBypassAccessFiltering: false,
  };
}

export const PANTAVION_WATER_BLOCKED_BBOX_QUERY_PROVIDER_READINESS =
  evaluateWaterBboxQueryProviderReadiness({
    fullMasterSourceProtected: true,
    spatialIndexReady: PANTAVION_WATER_BLOCKED_SPATIAL_INDEX_READINESS.spatialIndexReady,
    providerSelected: false,
    providerBackedByCompleteIndex: false,
    bboxValidationReady: true,
    viewportLimitEnforced: true,
    zoomLimitEnforced: true,
    accessFilteringRequired: true,
    auditLoggingRequired: true,
    duplicateStreetNameDisambiguationRequired: true,
    rawExportBlocked: true,
    completeNetworkExportBlocked: true,
    browserFullNetworkBlocked: true,
    founderAdminApprovalRequired: true,
    provider: "none",
  });
