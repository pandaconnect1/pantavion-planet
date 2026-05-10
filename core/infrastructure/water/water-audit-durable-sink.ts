export const PANTAVION_WATER_AUDIT_DURABLE_SINK_VERSION =
  "water-audit-durable-sink-v1" as const;

export type PantavionWaterAuditDurableSinkProvider =
  | "none"
  | "database"
  | "append-only-log"
  | "encrypted-object-storage"
  | "managed-audit-service";

export interface PantavionWaterAuditDurableSinkReadinessInput {
  sinkProviderSelected: boolean;
  appendOnlyRequired: boolean;
  encryptedAtRestRequired: boolean;
  retentionPolicyReady: boolean;
  tamperEvidenceRequired: boolean;
  founderAdminReviewRequired: boolean;
  rawNetworkPayloadStorageBlocked: boolean;
  completeNetworkPayloadStorageBlocked: boolean;
  productionWriteApprovalRequired: boolean;
  provider: PantavionWaterAuditDurableSinkProvider;
}

export interface PantavionWaterAuditDurableSinkReadinessResult {
  version: typeof PANTAVION_WATER_AUDIT_DURABLE_SINK_VERSION;
  durableAuditSinkReady: boolean;
  productionAuditSinkAllowed: boolean;
  blockers: string[];
  warnings: string[];
  provider: PantavionWaterAuditDurableSinkProvider;
  mayStoreRawNetworkPayload: false;
  mayStoreCompleteNetworkPayload: false;
  mayDeleteAuditTrailSilently: false;
}

export function evaluateWaterAuditDurableSinkReadiness(
  input: PantavionWaterAuditDurableSinkReadinessInput,
): PantavionWaterAuditDurableSinkReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.sinkProviderSelected) {
    blockers.push("Durable audit sink provider must be selected before production audit logging.");
  }

  if (!input.appendOnlyRequired) {
    blockers.push("Audit sink must require append-only write behavior.");
  }

  if (!input.encryptedAtRestRequired) {
    blockers.push("Audit sink must require encryption at rest.");
  }

  if (!input.retentionPolicyReady) {
    blockers.push("Audit retention policy is required before production audit logging.");
  }

  if (!input.tamperEvidenceRequired) {
    blockers.push("Audit sink must require tamper-evidence before production use.");
  }

  if (!input.founderAdminReviewRequired) {
    blockers.push("Founder/admin review is required before production audit sink activation.");
  }

  if (!input.rawNetworkPayloadStorageBlocked) {
    blockers.push("Durable audit sink must not store raw KMZ/KML/full GeoJSON payloads.");
  }

  if (!input.completeNetworkPayloadStorageBlocked) {
    blockers.push("Durable audit sink must not store complete water network payloads.");
  }

  if (!input.productionWriteApprovalRequired) {
    blockers.push("Founder/admin approval is required before production audit writes.");
  }

  if (input.provider === "none") {
    blockers.push("Durable audit sink provider is not selected.");
  }

  if (input.appendOnlyRequired && input.encryptedAtRestRequired && !input.sinkProviderSelected) {
    warnings.push(
      "Audit sink rules are defined, but production audit logging remains blocked until a durable provider is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_AUDIT_DURABLE_SINK_VERSION,
    durableAuditSinkReady: blockers.length === 0,
    productionAuditSinkAllowed: blockers.length === 0,
    blockers,
    warnings,
    provider: input.provider,
    mayStoreRawNetworkPayload: false,
    mayStoreCompleteNetworkPayload: false,
    mayDeleteAuditTrailSilently: false,
  };
}

export const PANTAVION_WATER_BLOCKED_AUDIT_DURABLE_SINK_READINESS =
  evaluateWaterAuditDurableSinkReadiness({
    sinkProviderSelected: false,
    appendOnlyRequired: true,
    encryptedAtRestRequired: true,
    retentionPolicyReady: false,
    tamperEvidenceRequired: true,
    founderAdminReviewRequired: true,
    rawNetworkPayloadStorageBlocked: true,
    completeNetworkPayloadStorageBlocked: true,
    productionWriteApprovalRequired: true,
    provider: "none",
  });
