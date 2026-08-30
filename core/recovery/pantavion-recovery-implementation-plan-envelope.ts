import { createHash } from "node:crypto";

import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  type PantavionRecoveryWorkUnit,
} from "./pantavion-recovery-runtime-fabric.ts";

export type PantavionRecoveryPlanDisposition =
  | "SCOPED_INTERNAL_DRAFT_PLAN"
  | "GOVERNED_HOLD_PRESERVATION"
  | "RECURSIVE_PROVENANCE_PRESERVATION";

export interface PantavionRecoveryImplementationPlanEnvelope {
  marker: "pantavion_recovery_implementation_plan_envelope_v1";
  planEnvelopeId: string;
  workUnitId: string;
  recordId: string;
  partitionOrdinal: number;
  sourceBinding: {
    sourceFingerprint: string;
    orderedIdFingerprint: string;
    globalOrdinal: number;
    sourceRecordSha256: string;
    semanticRecordSha256: string;
    workUnitDigest: string;
  };
  disposition: PantavionRecoveryPlanDisposition;
  planning: {
    templateId:
      | "pantavion_scoped_internal_draft_plan_v1"
      | "pantavion_governed_hold_preservation_plan_v1"
      | "pantavion_recursive_provenance_preservation_plan_v1";
    currentImplementationState: "idea" | "blocked";
    eligibleNextState: "coded" | null;
    scopedInternalDraftReady: boolean;
    founderAuthorizationRequiredForScopedBuild: true;
    requiredEvidence: string[];
    blockerCodes: string[];
  };
  scope: {
    module: string | null;
    subsystem: string | null;
    capability: string | null;
    feature: string | null;
    artifactType: string | null;
    canonicalTarget: string | null;
  };
  previousPlanEnvelopeDigest: string | null;
  planEnvelopeDigest: string;
  rawPayloadDuplicatedIntoControlPlane: false;
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
}

const REQUIRED_SCOPED_BUILD_EVIDENCE = [
  "bounded_file_scope",
  "acceptance_criteria",
  "rollback_boundary",
  "security_privacy_legal_gate",
  "typescript",
  "tests",
  "build",
  "audit",
] as const;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_plan_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(",")}}`;
  }
  throw new Error("recovery_plan_unsupported_digest_value");
}

function assertSha256(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    throw new Error(`${label}_must_be_sha256`);
  }
}

function assertNonEmpty(label: string, value: unknown): asserts value is string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label}_required`);
}

export function digestPantavionRecoveryWorkUnitForPlanning(unit: PantavionRecoveryWorkUnit): string {
  return sha256(canonicalJson({ ...unit, workUnitDigest: undefined }));
}

export function digestPantavionRecoveryImplementationPlanEnvelope(
  envelope: PantavionRecoveryImplementationPlanEnvelope,
): string {
  return sha256(canonicalJson({ ...envelope, planEnvelopeDigest: undefined }));
}

function assertWorkUnitAuthority(unit: PantavionRecoveryWorkUnit): void {
  if (
    unit.governance.executionAuthority !== false ||
    unit.governance.releaseAuthority !== false ||
    unit.governance.productionWriteAuthority !== false
  ) {
    throw new Error("recovery_plan_work_unit_authority_forbidden");
  }
}

function assertWorkUnit(input: {
  unit: PantavionRecoveryWorkUnit;
  expectedGlobalOrdinal: number;
  expectedPreviousWorkUnitDigest: string | null;
}): void {
  const { unit } = input;
  if (unit.version !== "pantavion_recovery_work_unit_v1") {
    throw new Error("recovery_plan_work_unit_version_invalid");
  }
  if (!/^recovery_work_unit_[0-9a-f]{64}$/.test(unit.workUnitId)) {
    throw new Error("recovery_plan_work_unit_id_invalid");
  }
  assertNonEmpty("recovery_plan_record_id", unit.recordId);
  assertSha256("recovery_plan_idempotency_key", unit.idempotencyKey);
  assertSha256("recovery_plan_source_record", unit.source.sourceRecordSha256);
  assertSha256("recovery_plan_semantic_record", unit.source.semanticRecordSha256);
  assertSha256("recovery_plan_work_unit_digest", unit.workUnitDigest);
  if (unit.source.globalOrdinal !== input.expectedGlobalOrdinal) {
    throw new Error("recovery_plan_global_ordinal_mismatch");
  }
  if (unit.previousWorkUnitDigest !== input.expectedPreviousWorkUnitDigest) {
    throw new Error("recovery_plan_work_unit_chain_mismatch");
  }
  if (
    unit.corpus.sourceFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint ||
    unit.corpus.orderedIdFingerprint !== PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint ||
    unit.corpus.sourceRecordCount !== PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount
  ) {
    throw new Error("recovery_plan_corpus_binding_mismatch");
  }
  assertWorkUnitAuthority(unit);
  if (digestPantavionRecoveryWorkUnitForPlanning(unit) !== unit.workUnitDigest) {
    throw new Error("recovery_plan_work_unit_digest_mismatch");
  }
}

function resolvePlanning(unit: PantavionRecoveryWorkUnit): {
  disposition: PantavionRecoveryPlanDisposition;
  templateId: PantavionRecoveryImplementationPlanEnvelope["planning"]["templateId"];
  currentImplementationState: "idea" | "blocked";
  eligibleNextState: "coded" | null;
  scopedInternalDraftReady: boolean;
  requiredEvidence: string[];
  blockerCodes: string[];
} {
  if (unit.runtimeLane === "CLASSIFIED_CANDIDATE") {
    if (unit.implementationState !== "idea" || unit.nextAction !== "PLAN_SCOPED_INTERNAL_DRAFT") {
      throw new Error("recovery_plan_classified_state_invalid");
    }
    assertNonEmpty("recovery_plan_module", unit.route.module);
    assertNonEmpty("recovery_plan_subsystem", unit.route.subsystem);
    assertNonEmpty("recovery_plan_capability", unit.route.capability);
    assertNonEmpty("recovery_plan_canonical_target", unit.route.canonicalTarget);
    return {
      disposition: "SCOPED_INTERNAL_DRAFT_PLAN",
      templateId: "pantavion_scoped_internal_draft_plan_v1",
      currentImplementationState: "idea",
      eligibleNextState: "coded",
      scopedInternalDraftReady: true,
      requiredEvidence: [...REQUIRED_SCOPED_BUILD_EVIDENCE],
      blockerCodes: [],
    };
  }

  if (unit.runtimeLane === "GOVERNED_HOLD") {
    if (unit.implementationState !== "blocked" || unit.nextAction !== "PRESERVE_GOVERNED_HOLD") {
      throw new Error("recovery_plan_hold_state_invalid");
    }
    assertNonEmpty("recovery_plan_hold_disposition", unit.governance.disposition);
    assertNonEmpty("recovery_plan_hold_owner", unit.governance.canonicalOwner);
    assertNonEmpty("recovery_plan_hold_reason", unit.governance.reason);
    return {
      disposition: "GOVERNED_HOLD_PRESERVATION",
      templateId: "pantavion_governed_hold_preservation_plan_v1",
      currentImplementationState: "blocked",
      eligibleNextState: null,
      scopedInternalDraftReady: false,
      requiredEvidence: [],
      blockerCodes: ["governed_hold_requires_resolution"],
    };
  }

  if (unit.runtimeLane === "QUARANTINED_RECURSIVE") {
    if (
      unit.implementationState !== "blocked" ||
      unit.nextAction !== "PRESERVE_RECURSIVE_PROVENANCE"
    ) {
      throw new Error("recovery_plan_recursive_state_invalid");
    }
    return {
      disposition: "RECURSIVE_PROVENANCE_PRESERVATION",
      templateId: "pantavion_recursive_provenance_preservation_plan_v1",
      currentImplementationState: "blocked",
      eligibleNextState: null,
      scopedInternalDraftReady: false,
      requiredEvidence: [],
      blockerCodes: ["recursive_artifact_is_not_executable"],
    };
  }

  throw new Error("recovery_plan_runtime_lane_invalid");
}

export function materializePantavionRecoveryImplementationPlanEnvelope(input: {
  unit: PantavionRecoveryWorkUnit;
  expectedGlobalOrdinal: number;
  expectedPreviousWorkUnitDigest: string | null;
  previousPlanEnvelopeDigest: string | null;
}): PantavionRecoveryImplementationPlanEnvelope {
  assertWorkUnit(input);
  if (input.expectedGlobalOrdinal === 1) {
    if (input.previousPlanEnvelopeDigest !== null) {
      throw new Error("recovery_plan_first_envelope_chain_must_be_empty");
    }
  } else {
    assertSha256("recovery_plan_previous_envelope", input.previousPlanEnvelopeDigest);
  }

  const planning = resolvePlanning(input.unit);
  const planEnvelopeId = `recovery_plan_envelope_${sha256([
    input.unit.workUnitId,
    input.unit.workUnitDigest,
    planning.templateId,
  ].join(":"))}`;
  const unsigned = {
    marker: "pantavion_recovery_implementation_plan_envelope_v1" as const,
    planEnvelopeId,
    workUnitId: input.unit.workUnitId,
    recordId: input.unit.recordId,
    partitionOrdinal: Math.ceil(
      input.unit.source.globalOrdinal / PANTAVION_RECOVERY_CORPUS_CONTRACT.batchSize,
    ),
    sourceBinding: {
      sourceFingerprint: input.unit.corpus.sourceFingerprint,
      orderedIdFingerprint: input.unit.corpus.orderedIdFingerprint,
      globalOrdinal: input.unit.source.globalOrdinal,
      sourceRecordSha256: input.unit.source.sourceRecordSha256,
      semanticRecordSha256: input.unit.source.semanticRecordSha256,
      workUnitDigest: input.unit.workUnitDigest,
    },
    disposition: planning.disposition,
    planning: {
      templateId: planning.templateId,
      currentImplementationState: planning.currentImplementationState,
      eligibleNextState: planning.eligibleNextState,
      scopedInternalDraftReady: planning.scopedInternalDraftReady,
      founderAuthorizationRequiredForScopedBuild: true as const,
      requiredEvidence: planning.requiredEvidence,
      blockerCodes: planning.blockerCodes,
    },
    scope: {
      module: input.unit.route.module,
      subsystem: input.unit.route.subsystem,
      capability: input.unit.route.capability,
      feature: input.unit.route.feature,
      artifactType: input.unit.route.artifactType,
      canonicalTarget: input.unit.route.canonicalTarget,
    },
    previousPlanEnvelopeDigest: input.previousPlanEnvelopeDigest,
    rawPayloadDuplicatedIntoControlPlane: false as const,
    authority: {
      analysis: true as const,
      planning: true as const,
      codeMutation: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };

  return {
    ...unsigned,
    planEnvelopeDigest: sha256(canonicalJson(unsigned)),
  };
}
