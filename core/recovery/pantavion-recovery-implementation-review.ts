import { createHash } from "node:crypto";

import {
  verifyPantavionRecoveryBuildAdmission,
  type PantavionRecoveryBuildAdmission,
} from "./pantavion-recovery-build-admission.ts";
import type { PantavionRecoveryBuildReadinessPacket } from "./pantavion-recovery-build-readiness.ts";
import {
  verifyPantavionRecoveryBoundedExecution,
  type PantavionRecoveryBoundedExecution,
  type PantavionRecoveryBoundedStepId,
  type PantavionRecoveryStepEvidence,
  type PantavionRecoveryStepEvidenceOrigin,
} from "./pantavion-recovery-bounded-step-execution.ts";

export const PANTAVION_RECOVERY_REVIEW_STEP_ORDER: readonly PantavionRecoveryBoundedStepId[] = [
  "source_binding",
  "isolated_code_preparation",
  "unit_verification",
  "security_verification",
  "rollback_evidence",
  "exact_revision_evidence",
];

export type PantavionRecoveryImplementationReviewStatus =
  | "synthetic_rehearsal"
  | "external_attestation_required";

export interface PantavionRecoveryImplementationReviewPacket {
  marker: "pantavion_recovery_implementation_review_v1";
  packetId: string;
  status: PantavionRecoveryImplementationReviewStatus;
  repository: "pandaconnect1/pantavion-planet";
  observedAt: string;
  source: {
    readinessOrdinal: number;
    readinessDigest: string;
    admissionId: string;
    admissionDigest: string;
    executionId: string;
    executionDigest: string;
    buildOrderId: string;
    workspaceId: string;
    baseRevision: string;
  };
  corpus: {
    memberCount: number;
    firstGlobalOrdinal: number;
    lastGlobalOrdinal: number;
    orderedMemberWorkUnitIdFingerprint: string;
  };
  protocol: {
    requiredStepIds: PantavionRecoveryBoundedStepId[];
    receiptCount: 6;
    checkpointCount: 7;
    receiptChainHead: string;
    checkpointChainHead: string;
    evidenceChainDigest: string;
  };
  revision: {
    evidenceDigest: string;
    artifactDigest: string;
    rollbackDigest: string;
    isolatedCommit: string;
    isolatedTreeDigest: string;
  };
  evidence: {
    origin: PantavionRecoveryStepEvidenceOrigin;
    syntheticOnly: boolean;
    realWorkspaceEvidence: boolean;
    externalRevisionAttestationRequired: true;
  };
  review: {
    currentLifecycleState: "IDEA";
    requestedLifecycleState: "CODED";
    founderAal2Required: true;
    founderDecisionRequired: true;
    founderDecisionRecorded: false;
    readyForLifecyclePromotion: false;
    blockers: string[];
  };
  authority: {
    canonicalRepositoryWrite: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
    lifecyclePromotion: false;
  };
  previousReviewPacketDigest: string | null;
  completion: false;
  packetDigest: string;
}

type PantavionRecoveryFinalStepEvidence = Omit<PantavionRecoveryStepEvidence, "revision"> & {
  revision: {
    isolatedCommit: string;
    isolatedTreeDigest: string;
  };
};

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_review_non_finite_number");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(",")}}`;
  }
  throw new Error("recovery_review_unsupported_digest_value");
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function assertGitCommitSha(label: string, value: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${label}_must_be_git_commit_sha`);
}

function parseTimestamp(label: string, value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label}_invalid`);
  return parsed;
}

function exactKeys(value: object, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function bytesEqual(left: Uint8Array, right: Uint8Array): boolean {
  return left.byteLength === right.byteLength && left.every((value, index) => value === right[index]);
}

function verifyReadinessPacket(packet: PantavionRecoveryBuildReadinessPacket): boolean {
  try {
    const { readinessDigest, ...unsigned } = packet;
    assertSha256("recovery_review_readiness_digest", readinessDigest);
    assertSha256(
      "recovery_review_membership_fingerprint",
      packet.membership.orderedMemberWorkUnitIdFingerprint,
    );
    if (sha256(canonicalJson(unsigned)) !== readinessDigest) return false;
    if (
      packet.marker !== "pantavion_recovery_build_readiness_packet_v1" ||
      !Number.isInteger(packet.buildOrderOrdinal) ||
      packet.buildOrderOrdinal < 1 ||
      !Number.isInteger(packet.membership.memberCount) ||
      packet.membership.memberCount < 1 ||
      !Number.isInteger(packet.membership.firstGlobalOrdinal) ||
      !Number.isInteger(packet.membership.lastGlobalOrdinal) ||
      packet.membership.firstGlobalOrdinal < 1 ||
      packet.membership.lastGlobalOrdinal < packet.membership.firstGlobalOrdinal ||
      packet.currentImplementationState !== "IDEA" ||
      packet.ownerControl.state !== "awaiting_owner" ||
      packet.ownerControl.releaseAuthorized !== false ||
      packet.completion !== false
    ) return false;
    if (
      packet.authority.codeMutation !== false ||
      packet.authority.execution !== false ||
      packet.authority.productionWrite !== false ||
      packet.authority.merge !== false ||
      packet.authority.deployment !== false ||
      packet.authority.publicExposure !== false ||
      packet.authority.release !== false
    ) return false;
    return true;
  } catch {
    return false;
  }
}

function parseFinalEvidence(input: {
  execution: PantavionRecoveryBoundedExecution;
  admission: PantavionRecoveryBuildAdmission;
  finalEvidenceBytes: Uint8Array;
  finalArtifactBytes: Uint8Array;
  finalRollbackBytes: Uint8Array;
}): PantavionRecoveryFinalStepEvidence {
  if (
    !(input.finalEvidenceBytes instanceof Uint8Array) ||
    !(input.finalArtifactBytes instanceof Uint8Array) ||
    !(input.finalRollbackBytes instanceof Uint8Array) ||
    input.finalEvidenceBytes.byteLength < 1 ||
    input.finalArtifactBytes.byteLength < 1 ||
    input.finalRollbackBytes.byteLength < 1
  ) throw new Error("recovery_review_final_bytes_required");
  let evidence: PantavionRecoveryStepEvidence;
  try {
    evidence = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input.finalEvidenceBytes));
  } catch {
    throw new Error("recovery_review_final_evidence_invalid_json");
  }
  const canonicalBytes = new TextEncoder().encode(canonicalJson(evidence));
  if (!bytesEqual(canonicalBytes, input.finalEvidenceBytes)) {
    throw new Error("recovery_review_final_evidence_not_canonical");
  }
  if (
    !exactKeys(evidence, [
      "marker", "origin", "admissionDigest", "admissionId", "sessionId", "intentId",
      "buildOrderId", "workspaceId", "baseRevision", "stepId", "claim", "capability",
      "scope", "access", "observedAt", "artifactDigest", "rollbackDigest", "source",
      "revision", "isolation", "authority",
    ]) ||
    !exactKeys(evidence.revision, ["isolatedCommit", "isolatedTreeDigest"])
  ) throw new Error("recovery_review_final_evidence_schema_invalid");
  const receipt = input.execution.evidence.at(-1);
  if (
    !receipt ||
    receipt.stepId !== "exact_revision_evidence" ||
    evidence.marker !== "pantavion_recovery_step_evidence_v1" ||
    evidence.stepId !== "exact_revision_evidence" ||
    evidence.claim !== "exact_revision_bound" ||
    evidence.admissionDigest !== input.admission.admissionDigest ||
    evidence.admissionId !== input.admission.admissionId ||
    evidence.sessionId !== input.execution.session.id ||
    evidence.intentId !== input.execution.session.intentId ||
    evidence.buildOrderId !== input.execution.buildOrderId ||
    evidence.workspaceId !== input.execution.workspaceId ||
    evidence.baseRevision !== input.execution.baseRevision ||
    receipt.evidenceDigest !== sha256(input.finalEvidenceBytes) ||
    receipt.artifactDigest !== sha256(input.finalArtifactBytes) ||
    receipt.rollbackDigest !== sha256(input.finalRollbackBytes) ||
    evidence.artifactDigest !== receipt.artifactDigest ||
    evidence.rollbackDigest !== receipt.rollbackDigest ||
    evidence.revision.isolatedCommit === null ||
    evidence.revision.isolatedTreeDigest === null
  ) throw new Error("recovery_review_final_evidence_binding_invalid");
  const isolatedCommit = evidence.revision.isolatedCommit;
  const isolatedTreeDigest = evidence.revision.isolatedTreeDigest;
  assertGitCommitSha("recovery_review_isolated_commit", isolatedCommit);
  assertSha256("recovery_review_isolated_tree", isolatedTreeDigest);
  return { ...evidence, revision: { isolatedCommit, isolatedTreeDigest } };
}

function reviewBlockers(origin: PantavionRecoveryStepEvidenceOrigin): string[] {
  if (origin === "synthetic_test_only") {
    return [
      "synthetic_inputs_not_external_evidence",
      "trusted_repository_attestation_missing",
      "founder_code_review_not_recorded",
      "canonical_revision_not_recorded",
    ];
  }
  return [
    "trusted_repository_attestation_missing",
    "founder_code_review_not_recorded",
    "canonical_revision_not_recorded",
  ];
}

function packetId(input: {
  readinessDigest: string;
  admissionDigest: string;
  executionDigest: string;
  finalEvidenceDigest: string;
  observedAt: string;
}): string {
  return `recovery_review_${sha256(canonicalJson(input))}`;
}

function withPacketDigest(
  unsigned: Omit<PantavionRecoveryImplementationReviewPacket, "packetDigest">,
): PantavionRecoveryImplementationReviewPacket {
  return { ...unsigned, packetDigest: sha256(canonicalJson(unsigned)) };
}

export function createPantavionRecoveryImplementationReviewPacket(input: {
  execution: PantavionRecoveryBoundedExecution;
  admission: PantavionRecoveryBuildAdmission;
  readinessPacket: PantavionRecoveryBuildReadinessPacket;
  finalEvidenceBytes: Uint8Array;
  finalArtifactBytes: Uint8Array;
  finalRollbackBytes: Uint8Array;
  previousReviewPacketDigest: string | null;
  observedAt: string;
}): PantavionRecoveryImplementationReviewPacket {
  const observedAt = new Date(input.observedAt).toISOString();
  if (!verifyReadinessPacket(input.readinessPacket)) {
    throw new Error("recovery_review_readiness_invalid");
  }
  if (!verifyPantavionRecoveryBuildAdmission(input.admission, observedAt)) {
    throw new Error("recovery_review_admission_invalid_or_expired");
  }
  if (!verifyPantavionRecoveryBoundedExecution(input.execution, input.admission, observedAt)) {
    throw new Error("recovery_review_execution_invalid_or_expired");
  }
  if (
    input.execution.status !== "bounded_protocol_complete" ||
    input.execution.session.state !== "completed" ||
    input.execution.evidence.length !== 6 ||
    input.execution.checkpoints.length !== 7 ||
    input.execution.lifecycle.promotionRecorded !== false ||
    input.execution.completion !== false
  ) throw new Error("recovery_review_protocol_incomplete");
  if (
    input.readinessPacket.readinessDigest !== input.admission.source.readinessDigest ||
    input.readinessPacket.buildOrderId !== input.admission.source.buildOrderId ||
    input.readinessPacket.buildOrderDigest !== input.admission.source.buildOrderDigest ||
    input.readinessPacket.buildOrderId !== input.execution.buildOrderId
  ) throw new Error("recovery_review_source_binding_invalid");
  const actualStepIds = input.execution.evidence.map((receipt) => receipt.stepId);
  if (canonicalJson(actualStepIds) !== canonicalJson(PANTAVION_RECOVERY_REVIEW_STEP_ORDER)) {
    throw new Error("recovery_review_step_order_invalid");
  }
  const origins = new Set(input.execution.evidence.map((receipt) => receipt.origin));
  if (origins.size !== 1) throw new Error("recovery_review_mixed_evidence_origins");
  const origin = input.execution.evidence[0].origin;
  const finalEvidence = parseFinalEvidence(input);
  if (finalEvidence.origin !== origin) throw new Error("recovery_review_final_origin_mismatch");
  const finalReceipt = input.execution.evidence.at(-1);
  const receiptHead = input.execution.session.receipts.at(-1);
  const checkpointHead = input.execution.checkpoints.at(-1);
  if (!finalReceipt || !receiptHead || !checkpointHead) {
    throw new Error("recovery_review_chain_head_missing");
  }
  if (input.readinessPacket.buildOrderOrdinal === 1) {
    if (input.previousReviewPacketDigest !== null) {
      throw new Error("recovery_review_first_chain_must_be_empty");
    }
  } else {
    if (input.previousReviewPacketDigest === null) {
      throw new Error("recovery_review_previous_digest_required");
    }
    assertSha256("recovery_review_previous_digest", input.previousReviewPacketDigest);
  }
  if (
    parseTimestamp("recovery_review_observed_at", observedAt) <
      parseTimestamp("recovery_review_execution_updated_at", input.execution.updatedAt)
  ) throw new Error("recovery_review_observed_before_execution");
  let status: PantavionRecoveryImplementationReviewStatus = "external_attestation_required";
  if (origin === "synthetic_test_only") status = "synthetic_rehearsal";
  const unsigned: Omit<PantavionRecoveryImplementationReviewPacket, "packetDigest"> = {
    marker: "pantavion_recovery_implementation_review_v1",
    packetId: packetId({
      readinessDigest: input.readinessPacket.readinessDigest,
      admissionDigest: input.admission.admissionDigest,
      executionDigest: input.execution.executionDigest,
      finalEvidenceDigest: finalReceipt.evidenceDigest,
      observedAt,
    }),
    status,
    repository: "pandaconnect1/pantavion-planet",
    observedAt,
    source: {
      readinessOrdinal: input.readinessPacket.buildOrderOrdinal,
      readinessDigest: input.readinessPacket.readinessDigest,
      admissionId: input.admission.admissionId,
      admissionDigest: input.admission.admissionDigest,
      executionId: input.execution.executionId,
      executionDigest: input.execution.executionDigest,
      buildOrderId: input.execution.buildOrderId,
      workspaceId: input.execution.workspaceId,
      baseRevision: input.execution.baseRevision,
    },
    corpus: {
      memberCount: input.readinessPacket.membership.memberCount,
      firstGlobalOrdinal: input.readinessPacket.membership.firstGlobalOrdinal,
      lastGlobalOrdinal: input.readinessPacket.membership.lastGlobalOrdinal,
      orderedMemberWorkUnitIdFingerprint:
        input.readinessPacket.membership.orderedMemberWorkUnitIdFingerprint,
    },
    protocol: {
      requiredStepIds: [...PANTAVION_RECOVERY_REVIEW_STEP_ORDER],
      receiptCount: 6,
      checkpointCount: 7,
      receiptChainHead: receiptHead.receiptDigest,
      checkpointChainHead: checkpointHead.checkpointDigest,
      evidenceChainDigest: sha256(canonicalJson(input.execution.evidence)),
    },
    revision: {
      evidenceDigest: finalReceipt.evidenceDigest,
      artifactDigest: finalReceipt.artifactDigest,
      rollbackDigest: finalReceipt.rollbackDigest,
      isolatedCommit: finalEvidence.revision.isolatedCommit,
      isolatedTreeDigest: finalEvidence.revision.isolatedTreeDigest,
    },
    evidence: {
      origin,
      syntheticOnly: origin === "synthetic_test_only",
      realWorkspaceEvidence: origin === "isolated_workspace",
      externalRevisionAttestationRequired: true,
    },
    review: {
      currentLifecycleState: "IDEA",
      requestedLifecycleState: "CODED",
      founderAal2Required: true,
      founderDecisionRequired: true,
      founderDecisionRecorded: false,
      readyForLifecyclePromotion: false,
      blockers: reviewBlockers(origin),
    },
    authority: {
      canonicalRepositoryWrite: false,
      productionWrite: false,
      merge: false,
      deployment: false,
      publicExposure: false,
      release: false,
      lifecyclePromotion: false,
    },
    previousReviewPacketDigest: input.previousReviewPacketDigest,
    completion: false,
  };
  const packet = withPacketDigest(unsigned);
  if (!verifyPantavionRecoveryImplementationReviewPacket({
    packet,
    execution: input.execution,
    admission: input.admission,
    readinessPacket: input.readinessPacket,
    finalEvidenceBytes: input.finalEvidenceBytes,
    finalArtifactBytes: input.finalArtifactBytes,
    finalRollbackBytes: input.finalRollbackBytes,
    observedAt,
  })) throw new Error("recovery_review_self_verification_failed");
  return packet;
}

export function verifyPantavionRecoveryImplementationReviewPacket(input: {
  packet: PantavionRecoveryImplementationReviewPacket;
  execution: PantavionRecoveryBoundedExecution;
  admission: PantavionRecoveryBuildAdmission;
  readinessPacket: PantavionRecoveryBuildReadinessPacket;
  finalEvidenceBytes: Uint8Array;
  finalArtifactBytes: Uint8Array;
  finalRollbackBytes: Uint8Array;
  observedAt: string;
}): boolean {
  try {
    const { packetDigest, ...unsigned } = input.packet;
    assertSha256("recovery_review_packet_digest", packetDigest);
    if (sha256(canonicalJson(unsigned)) !== packetDigest) return false;
    if (!verifyReadinessPacket(input.readinessPacket)) return false;
    if (!verifyPantavionRecoveryBuildAdmission(input.admission, input.observedAt)) return false;
    if (!verifyPantavionRecoveryBoundedExecution(input.execution, input.admission, input.observedAt)) {
      return false;
    }
    const receiptHead = input.execution.session.receipts.at(-1);
    const checkpointHead = input.execution.checkpoints.at(-1);
    const finalReceipt = input.execution.evidence.at(-1);
    if (!receiptHead || !checkpointHead || !finalReceipt) return false;
    if (
      input.execution.status !== "bounded_protocol_complete" ||
      input.execution.session.state !== "completed" ||
      input.execution.evidence.length !== 6 ||
      input.execution.checkpoints.length !== 7 ||
      input.execution.lifecycle.promotionRecorded !== false ||
      input.execution.completion !== false ||
      input.readinessPacket.readinessDigest !== input.admission.source.readinessDigest ||
      input.readinessPacket.buildOrderId !== input.admission.source.buildOrderId ||
      input.readinessPacket.buildOrderDigest !== input.admission.source.buildOrderDigest ||
      input.readinessPacket.buildOrderId !== input.execution.buildOrderId
    ) return false;
    const actualStepIds = input.execution.evidence.map((receipt) => receipt.stepId);
    if (canonicalJson(actualStepIds) !== canonicalJson(PANTAVION_RECOVERY_REVIEW_STEP_ORDER)) {
      return false;
    }
    const origins = new Set(input.execution.evidence.map((receipt) => receipt.origin));
    if (origins.size !== 1) return false;
    const finalEvidence = parseFinalEvidence(input);
    if (finalEvidence.origin !== finalReceipt.origin) return false;
    const packet = input.packet;
    if (
      packet.marker !== "pantavion_recovery_implementation_review_v1" ||
      packet.repository !== "pandaconnect1/pantavion-planet" ||
      packet.observedAt !== new Date(input.observedAt).toISOString() ||
      packet.source.readinessOrdinal !== input.readinessPacket.buildOrderOrdinal ||
      packet.source.readinessDigest !== input.readinessPacket.readinessDigest ||
      packet.source.admissionId !== input.admission.admissionId ||
      packet.source.admissionDigest !== input.admission.admissionDigest ||
      packet.source.executionId !== input.execution.executionId ||
      packet.source.executionDigest !== input.execution.executionDigest ||
      packet.source.buildOrderId !== input.execution.buildOrderId ||
      packet.source.workspaceId !== input.execution.workspaceId ||
      packet.source.baseRevision !== input.execution.baseRevision ||
      canonicalJson(packet.corpus) !== canonicalJson(input.readinessPacket.membership) ||
      canonicalJson(packet.protocol.requiredStepIds) !==
        canonicalJson(PANTAVION_RECOVERY_REVIEW_STEP_ORDER) ||
      packet.protocol.receiptCount !== 6 ||
      packet.protocol.checkpointCount !== 7 ||
      packet.protocol.receiptChainHead !== receiptHead.receiptDigest ||
      packet.protocol.checkpointChainHead !== checkpointHead.checkpointDigest ||
      packet.protocol.evidenceChainDigest !== sha256(canonicalJson(input.execution.evidence)) ||
      packet.revision.evidenceDigest !== finalReceipt.evidenceDigest ||
      packet.revision.artifactDigest !== finalReceipt.artifactDigest ||
      packet.revision.rollbackDigest !== finalReceipt.rollbackDigest ||
      packet.revision.isolatedCommit !== finalEvidence.revision.isolatedCommit ||
      packet.revision.isolatedTreeDigest !== finalEvidence.revision.isolatedTreeDigest ||
      packet.evidence.origin !== finalReceipt.origin ||
      packet.evidence.syntheticOnly !== (finalReceipt.origin === "synthetic_test_only") ||
      packet.evidence.realWorkspaceEvidence !== (finalReceipt.origin === "isolated_workspace") ||
      packet.evidence.externalRevisionAttestationRequired !== true ||
      packet.review.currentLifecycleState !== "IDEA" ||
      packet.review.requestedLifecycleState !== "CODED" ||
      packet.review.founderAal2Required !== true ||
      packet.review.founderDecisionRequired !== true ||
      packet.review.founderDecisionRecorded !== false ||
      packet.review.readyForLifecyclePromotion !== false ||
      canonicalJson(packet.review.blockers) !== canonicalJson(reviewBlockers(finalReceipt.origin)) ||
      packet.completion !== false
    ) return false;
    assertGitCommitSha("recovery_review_packet_isolated_commit", packet.revision.isolatedCommit);
    assertSha256("recovery_review_packet_isolated_tree", packet.revision.isolatedTreeDigest);
    if (
      packet.packetId !== packetId({
        readinessDigest: packet.source.readinessDigest,
        admissionDigest: packet.source.admissionDigest,
        executionDigest: packet.source.executionDigest,
        finalEvidenceDigest: packet.revision.evidenceDigest,
        observedAt: packet.observedAt,
      })
    ) return false;
    let expectedStatus: PantavionRecoveryImplementationReviewStatus =
      "external_attestation_required";
    if (finalReceipt.origin === "synthetic_test_only") expectedStatus = "synthetic_rehearsal";
    if (packet.status !== expectedStatus) return false;
    for (const value of Object.values(packet.authority)) {
      if (value !== false) return false;
    }
    if (packet.source.readinessOrdinal === 1) {
      if (packet.previousReviewPacketDigest !== null) return false;
    } else {
      if (packet.previousReviewPacketDigest === null) return false;
      assertSha256("recovery_review_packet_previous_digest", packet.previousReviewPacketDigest);
    }
    return true;
  } catch {
    return false;
  }
}
