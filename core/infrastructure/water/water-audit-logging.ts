import type {
  PantavionWaterAuthorizedPerson,
} from "./water-serving-contract";

import type {
  PantavionWaterBoundingBox,
} from "./controlled-water-serving-scaffold";

export const PANTAVION_WATER_AUDIT_LOGGING_VERSION =
  "water-audit-logging-v1" as const;

export type PantavionWaterAuditAction =
  | "readiness-check"
  | "bbox-request"
  | "access-decision"
  | "spatial-serving-decision"
  | "production-activation-request"
  | "raw-export-attempt";

export interface PantavionWaterAuditLoggingReadinessInput {
  auditSchemaReady: boolean;
  durableAuditSinkAvailable: boolean;
  retentionPolicyReady: boolean;
  rawPayloadLoggingBlocked: boolean;
  founderAdminReviewRequired: boolean;
}

export interface PantavionWaterAuditLoggingReadinessResult {
  version: typeof PANTAVION_WATER_AUDIT_LOGGING_VERSION;
  auditLoggingReady: boolean;
  productionAuditAllowed: boolean;
  blockers: string[];
  warnings: string[];
  mayLogRawNetworkPayload: false;
  mayLogCompleteNetworkPayload: false;
}

export interface PantavionWaterAuditLogInput {
  action: PantavionWaterAuditAction;
  actor: PantavionWaterAuthorizedPerson;
  route: string;
  bbox?: PantavionWaterBoundingBox;
  zoom?: number;
  decisionAllowed: boolean;
  blockers: string[];
  rawNetworkReturned: false;
  completeNetworkReturned: false;
  timestampIso?: string;
}

export interface PantavionWaterAuditLogRecord {
  version: typeof PANTAVION_WATER_AUDIT_LOGGING_VERSION;
  action: PantavionWaterAuditAction;
  actor: {
    firstName: string;
    lastName: string;
    title: string;
    accessLevel: string;
    status: PantavionWaterAuthorizedPerson["status"];
  };
  route: string;
  bbox?: PantavionWaterBoundingBox;
  zoom?: number;
  decisionAllowed: boolean;
  blockers: string[];
  rawNetworkReturned: false;
  completeNetworkReturned: false;
  rawPayloadStored: false;
  completeNetworkPayloadStored: false;
  timestampIso: string;
}

export function evaluateWaterAuditLoggingReadiness(
  input: PantavionWaterAuditLoggingReadinessInput,
): PantavionWaterAuditLoggingReadinessResult {
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (!input.auditSchemaReady) {
    blockers.push("Audit schema is required before controlled water serving.");
  }

  if (!input.durableAuditSinkAvailable) {
    blockers.push("Durable audit sink is required before production spatial serving.");
  }

  if (!input.retentionPolicyReady) {
    blockers.push("Audit retention policy is required before production spatial serving.");
  }

  if (!input.rawPayloadLoggingBlocked) {
    blockers.push("Raw network payload logging must remain blocked.");
  }

  if (!input.founderAdminReviewRequired) {
    blockers.push("Founder/admin review must be required for production audit activation.");
  }

  if (input.auditSchemaReady && !input.durableAuditSinkAvailable) {
    warnings.push(
      "Audit schema exists, but production audit logging remains blocked until durable storage is selected.",
    );
  }

  return {
    version: PANTAVION_WATER_AUDIT_LOGGING_VERSION,
    auditLoggingReady: blockers.length === 0,
    productionAuditAllowed: blockers.length === 0,
    blockers,
    warnings,
    mayLogRawNetworkPayload: false,
    mayLogCompleteNetworkPayload: false,
  };
}

export function createWaterAuditLogRecord(
  input: PantavionWaterAuditLogInput,
): PantavionWaterAuditLogRecord {
  return {
    version: PANTAVION_WATER_AUDIT_LOGGING_VERSION,
    action: input.action,
    actor: {
      firstName: input.actor.firstName,
      lastName: input.actor.lastName,
      title: input.actor.title,
      accessLevel: input.actor.accessLevel,
      status: input.actor.status,
    },
    route: input.route,
    bbox: input.bbox,
    zoom: input.zoom,
    decisionAllowed: input.decisionAllowed,
    blockers: input.blockers,
    rawNetworkReturned: false,
    completeNetworkReturned: false,
    rawPayloadStored: false,
    completeNetworkPayloadStored: false,
    timestampIso: input.timestampIso ?? new Date().toISOString(),
  };
}

export const PANTAVION_WATER_BLOCKED_AUDIT_LOGGING_READINESS =
  evaluateWaterAuditLoggingReadiness({
    auditSchemaReady: true,
    durableAuditSinkAvailable: false,
    retentionPolicyReady: false,
    rawPayloadLoggingBlocked: true,
    founderAdminReviewRequired: true,
  });
