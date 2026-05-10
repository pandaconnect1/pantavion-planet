export const PANTAVION_WATER_ACCESS_CONTROL_READINESS_VERSION =
  "water-access-control-readiness-v1" as const;

export interface PantavionWaterAccessControlReadinessInput {
  authorizedPersonSchemaReady: boolean;
  roleModelReady: boolean;
  founderAdminDiagnosticAccessReady: boolean;
  durableAuthorizedPersonStoreAvailable: boolean;
  accessDecisionAuditReady: boolean;
  rawExportBlocked: boolean;
  completeNetworkExportBlocked: boolean;
  founderAdminApprovalRequired: boolean;
}

export interface PantavionWaterAccessControlReadinessResult {
  version: typeof PANTAVION_WATER_ACCESS_CONTROL_READINESS_VERSION;
  accessControlReady: boolean;
  productionAccessAllowed: boolean;
  blockers: string[];
  warnings: string[];
  mayExportRawNetwork: false;
  mayExportCompleteNetwork: false;
}

export function evaluateWaterAccessControlReadiness(
  input: PantavionWaterAccessControlReadinessInput,
): PantavionWaterAccessControlReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.authorizedPersonSchemaReady) {
    blockers.push("Authorized person schema is required before controlled access.");
  }

  if (!input.roleModelReady) {
    blockers.push("Water role model is required before controlled access.");
  }

  if (!input.founderAdminDiagnosticAccessReady) {
    blockers.push("Founder/admin diagnostic access is required before controlled access testing.");
  }

  if (!input.durableAuthorizedPersonStoreAvailable) {
    blockers.push("Durable authorized person store is required before production access control.");
  }

  if (!input.accessDecisionAuditReady) {
    blockers.push("Access decision audit is required before production access control.");
  }

  if (!input.rawExportBlocked) {
    blockers.push("Raw KMZ/KML/full GeoJSON export must remain blocked.");
  }

  if (!input.completeNetworkExportBlocked) {
    blockers.push("Complete network export must remain blocked.");
  }

  if (!input.founderAdminApprovalRequired) {
    blockers.push("Founder/admin approval must be required before production access activation.");
  }

  if (
    input.authorizedPersonSchemaReady &&
    input.roleModelReady &&
    input.founderAdminDiagnosticAccessReady &&
    !input.durableAuthorizedPersonStoreAvailable
  ) {
    warnings.push(
      "Access schema and role model are ready, but production access remains blocked until durable authorized-person storage is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_ACCESS_CONTROL_READINESS_VERSION,
    accessControlReady: blockers.length === 0,
    productionAccessAllowed: blockers.length === 0,
    blockers,
    warnings,
    mayExportRawNetwork: false,
    mayExportCompleteNetwork: false,
  };
}

export const PANTAVION_WATER_BLOCKED_ACCESS_CONTROL_READINESS =
  evaluateWaterAccessControlReadiness({
    authorizedPersonSchemaReady: true,
    roleModelReady: true,
    founderAdminDiagnosticAccessReady: true,
    durableAuthorizedPersonStoreAvailable: false,
    accessDecisionAuditReady: true,
    rawExportBlocked: true,
    completeNetworkExportBlocked: true,
    founderAdminApprovalRequired: true,
  });
