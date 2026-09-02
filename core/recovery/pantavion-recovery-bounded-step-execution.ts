import { createHash } from "node:crypto";

import {
  createBoundedExecutionCheckpoint,
  recordBoundedStepCompletion,
  restoreBoundedExecutionSession,
  verifyBoundedExecutionCheckpoint,
  verifyBoundedExecutionSession,
  type BoundedExecutionCheckpoint,
  type BoundedExecutionSession,
} from "../sovereign/bounded-execution-runtime.ts";
import type { CapabilityAccess } from "../sovereign/agent-capability-budget-control.ts";
import {
  verifyDisconnectedExecutionPacket,
  type DisconnectedExecutionPacket,
  type EdgeExecutionPolicy,
} from "../sovereign/edge-execution.ts";
import {
  verifyPantavionRecoveryBuildAdmission,
  type PantavionRecoveryBuildAdmission,
} from "./pantavion-recovery-build-admission.ts";

const MAX_WORKER_ID_BYTES = 256;
const MAX_EDGE_PAYLOAD_BYTES = 4096;

export type PantavionRecoveryBoundedStepId =
  | "source_binding"
  | "isolated_code_preparation"
  | "unit_verification"
  | "security_verification"
  | "rollback_evidence"
  | "exact_revision_evidence";

export type PantavionRecoveryStepEvidenceOrigin =
  | "synthetic_test_only"
  | "isolated_workspace";

export interface PantavionRecoveryStepEvidence {
  marker: "pantavion_recovery_step_evidence_v1";
  origin: PantavionRecoveryStepEvidenceOrigin;
  admissionDigest: string;
  admissionId: string;
  sessionId: string;
  intentId: string;
  buildOrderId: string;
  workspaceId: string;
  baseRevision: string;
  stepId: PantavionRecoveryBoundedStepId;
  claim:
    | "source_chain_verified"
    | "isolated_diff_recorded"
    | "unit_tests_passed"
    | "security_checks_passed"
    | "rollback_verified"
    | "exact_revision_bound";
  capability: string;
  scope: string;
  access: CapabilityAccess;
  observedAt: string;
  artifactDigest: string;
  rollbackDigest: string;
  source: {
    readinessDigest: string;
    capsuleDigest: string;
    ownerReceiptDigest: string;
  };
  revision: {
    isolatedCommit: string | null;
    isolatedTreeDigest: string | null;
  };
  isolation: {
    sourceReadOnly: true;
    outputIsolated: true;
    networkAccess: false;
    secretsAvailable: false;
    productionCredentialsAvailable: false;
    productionDataAvailable: false;
  };
  authority: {
    isolatedWorkspaceMutation: boolean;
    canonicalRepositoryWrite: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
    lifecyclePromotion: false;
  };
}

export interface PantavionRecoveryStepEvidenceReceipt {
  stepId: PantavionRecoveryBoundedStepId;
  origin: PantavionRecoveryStepEvidenceOrigin;
  observedAt: string;
  evidenceDigest: string;
  artifactDigest: string;
  rollbackDigest: string;
  boundedReceiptDigest: string;
  checkpointDigest: string;
  lifecyclePromotionAuthority: false;
}

export interface PantavionRecoveryBoundedExecution {
  marker: "pantavion_recovery_bounded_execution_v1";
  executionId: string;
  status: "ready" | "executing" | "bounded_protocol_complete";
  repository: "pandaconnect1/pantavion-planet";
  admissionId: string;
  admissionDigest: string;
  buildOrderId: string;
  workspaceId: string;
  baseRevision: string;
  startedAt: string;
  updatedAt: string;
  validUntil: string;
  worker: {
    id: string;
    fencingToken: number;
  };
  edge: {
    taskId: string;
    packetDigest: string;
    replayConsumed: true;
    consumedAt: string;
    disconnected: true;
    networkAccess: false;
    productionWrite: false;
  };
  session: BoundedExecutionSession;
  checkpoints: BoundedExecutionCheckpoint[];
  evidence: PantavionRecoveryStepEvidenceReceipt[];
  lifecycle: {
    sourceImplementationState: "IDEA";
    nextPermittedEvidenceState: "CODED";
    promotionRecorded: false;
    externalReviewRequired: true;
  };
  authority: {
    isolatedStepExecution: true;
    canonicalRepositoryWrite: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
    lifecyclePromotion: false;
  };
  completion: false;
  executionDigest: string;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_execution_non_finite_number");
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
  throw new Error("recovery_execution_unsupported_digest_value");
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

function expectedClaim(stepId: PantavionRecoveryBoundedStepId): PantavionRecoveryStepEvidence["claim"] {
  if (stepId === "source_binding") return "source_chain_verified";
  if (stepId === "isolated_code_preparation") return "isolated_diff_recorded";
  if (stepId === "unit_verification") return "unit_tests_passed";
  if (stepId === "security_verification") return "security_checks_passed";
  if (stepId === "rollback_evidence") return "rollback_verified";
  return "exact_revision_bound";
}

function expectedAccess(stepId: PantavionRecoveryBoundedStepId): CapabilityAccess {
  if (stepId === "isolated_code_preparation") return "write";
  return "read";
}

function executionId(input: {
  admissionDigest: string;
  edgePacketDigest: string;
  workerId: string;
  fencingToken: number;
  startedAt: string;
}): string {
  return `recovery_execution_${sha256(canonicalJson(input))}`;
}

function withExecutionDigest(
  unsigned: Omit<PantavionRecoveryBoundedExecution, "executionDigest">,
): PantavionRecoveryBoundedExecution {
  return { ...unsigned, executionDigest: sha256(canonicalJson(unsigned)) };
}

function validateWorker(workerId: string, fencingToken: number): void {
  if (!workerId.trim() || new TextEncoder().encode(workerId).byteLength > MAX_WORKER_ID_BYTES) {
    throw new Error("recovery_execution_worker_invalid");
  }
  if (!Number.isInteger(fencingToken) || fencingToken < 1) {
    throw new Error("recovery_execution_fencing_token_invalid");
  }
}

function validateEdgeBinding(input: {
  admission: PantavionRecoveryBuildAdmission;
  packet: DisconnectedExecutionPacket;
  policy: EdgeExecutionPolicy;
  consumedDigests: ReadonlySet<string>;
  observedAt: string;
}): void {
  const verification = verifyDisconnectedExecutionPacket(
    input.packet,
    input.observedAt,
    input.policy,
    input.consumedDigests,
  );
  if (!verification.valid) {
    throw new Error(`recovery_execution_edge_denied:${verification.reasons.join(",")}`);
  }
  const payload = input.packet.task.payload;
  if (
    input.policy.allowedCapabilities.length !== 1 ||
    input.policy.allowedCapabilities[0] !== input.admission.binding.capability ||
    !Number.isInteger(input.policy.maximumPayloadBytes) ||
    input.policy.maximumPayloadBytes < 1 ||
    input.policy.maximumPayloadBytes > MAX_EDGE_PAYLOAD_BYTES ||
    input.packet.payloadDigest !== input.admission.edge.packetDigest ||
    input.packet.task.id !== input.admission.binding.edgeTaskId ||
    input.packet.task.intentId !== input.admission.binding.intentId ||
    input.packet.task.capability !== input.admission.binding.capability ||
    input.packet.executionMode !== "disconnected" ||
    input.packet.task.deterministic !== true ||
    input.packet.task.reversible !== true ||
    input.packet.task.requiresNetwork !== false ||
    input.packet.task.writesProduction !== false ||
    payload.capsuleDigest !== input.admission.source.capsuleDigest ||
    payload.ownerReceiptDigest !== input.admission.source.ownerReceiptDigest ||
    payload.workspaceId !== input.admission.isolation.workspaceId ||
    payload.baseRevision !== input.admission.baseRevision ||
    payload.sessionId !== input.admission.binding.sessionId ||
    payload.scope !== input.admission.binding.scope
  ) {
    throw new Error("recovery_execution_edge_binding_invalid");
  }
}

export function beginPantavionRecoveryBoundedExecution(input: {
  admission: PantavionRecoveryBuildAdmission;
  edgePacket: DisconnectedExecutionPacket;
  edgePolicy: EdgeExecutionPolicy;
  consumedEdgeDigests: ReadonlySet<string>;
  workerId: string;
  fencingToken: number;
  observedAt: string;
}): PantavionRecoveryBoundedExecution {
  validateWorker(input.workerId, input.fencingToken);
  if (!verifyPantavionRecoveryBuildAdmission(input.admission, input.observedAt)) {
    throw new Error("recovery_execution_admission_invalid_or_expired");
  }
  validateEdgeBinding({
    admission: input.admission,
    packet: input.edgePacket,
    policy: input.edgePolicy,
    consumedDigests: input.consumedEdgeDigests,
    observedAt: input.observedAt,
  });
  const observedAt = new Date(input.observedAt).toISOString();
  const rootCheckpoint = createBoundedExecutionCheckpoint({
    session: input.admission.boundedSession,
    sequence: 1,
    fencingToken: input.fencingToken,
    workerId: input.workerId,
    observedAt,
  });
  const unsigned: Omit<PantavionRecoveryBoundedExecution, "executionDigest"> = {
    marker: "pantavion_recovery_bounded_execution_v1",
    executionId: executionId({
      admissionDigest: input.admission.admissionDigest,
      edgePacketDigest: input.edgePacket.payloadDigest,
      workerId: input.workerId,
      fencingToken: input.fencingToken,
      startedAt: observedAt,
    }),
    status: "ready",
    repository: "pandaconnect1/pantavion-planet",
    admissionId: input.admission.admissionId,
    admissionDigest: input.admission.admissionDigest,
    buildOrderId: input.admission.source.buildOrderId,
    workspaceId: input.admission.isolation.workspaceId,
    baseRevision: input.admission.baseRevision,
    startedAt: observedAt,
    updatedAt: observedAt,
    validUntil: input.admission.validUntil,
    worker: { id: input.workerId, fencingToken: input.fencingToken },
    edge: {
      taskId: input.admission.binding.edgeTaskId,
      packetDigest: input.edgePacket.payloadDigest,
      replayConsumed: true,
      consumedAt: observedAt,
      disconnected: true,
      networkAccess: false,
      productionWrite: false,
    },
    session: rootCheckpoint.session,
    checkpoints: [rootCheckpoint],
    evidence: [],
    lifecycle: {
      sourceImplementationState: "IDEA",
      nextPermittedEvidenceState: "CODED",
      promotionRecorded: false,
      externalReviewRequired: true,
    },
    authority: {
      isolatedStepExecution: true,
      canonicalRepositoryWrite: false,
      productionWrite: false,
      merge: false,
      deployment: false,
      publicExposure: false,
      release: false,
      lifecyclePromotion: false,
    },
    completion: false,
  };
  const execution = withExecutionDigest(unsigned);
  if (!verifyPantavionRecoveryBoundedExecution(execution, input.admission, observedAt)) {
    throw new Error("recovery_execution_self_verification_failed");
  }
  return execution;
}

export function createPantavionRecoveryStepEvidenceBytes(input: {
  admission: PantavionRecoveryBuildAdmission;
  stepId: PantavionRecoveryBoundedStepId;
  origin: PantavionRecoveryStepEvidenceOrigin;
  observedAt: string;
  artifactBytes: Uint8Array;
  rollbackBytes: Uint8Array;
  isolatedCommit: string | null;
  isolatedTreeDigest: string | null;
}): Uint8Array {
  if (!verifyPantavionRecoveryBuildAdmission(input.admission, input.observedAt)) {
    throw new Error("recovery_step_evidence_admission_invalid_or_expired");
  }
  if (!(input.artifactBytes instanceof Uint8Array) || input.artifactBytes.byteLength < 1) {
    throw new Error("recovery_step_evidence_artifact_bytes_required");
  }
  if (!(input.rollbackBytes instanceof Uint8Array) || input.rollbackBytes.byteLength < 1) {
    throw new Error("recovery_step_evidence_rollback_bytes_required");
  }
  const step = input.admission.boundedSession.plan.steps.find((candidate) => candidate.id === input.stepId);
  if (!step) throw new Error("recovery_step_evidence_step_unknown");
  const finalStep = input.stepId === "exact_revision_evidence";
  let isolatedCommit: string | null | undefined = input.isolatedCommit;
  let isolatedTreeDigest: string | null | undefined = input.isolatedTreeDigest;
  if (isolatedCommit === undefined) isolatedCommit = null;
  if (isolatedTreeDigest === undefined) isolatedTreeDigest = null;
  if (finalStep) {
    if (isolatedCommit === null || isolatedTreeDigest === null) {
      throw new Error("recovery_step_evidence_exact_revision_required");
    }
    assertGitCommitSha("recovery_step_evidence_isolated_commit", isolatedCommit);
    assertSha256("recovery_step_evidence_isolated_tree", isolatedTreeDigest);
  } else if (isolatedCommit !== null || isolatedTreeDigest !== null) {
    throw new Error("recovery_step_evidence_revision_outside_final_step");
  }
  const evidence: PantavionRecoveryStepEvidence = {
    marker: "pantavion_recovery_step_evidence_v1",
    origin: input.origin,
    admissionDigest: input.admission.admissionDigest,
    admissionId: input.admission.admissionId,
    sessionId: input.admission.binding.sessionId,
    intentId: input.admission.binding.intentId,
    buildOrderId: input.admission.source.buildOrderId,
    workspaceId: input.admission.isolation.workspaceId,
    baseRevision: input.admission.baseRevision,
    stepId: input.stepId,
    claim: expectedClaim(input.stepId),
    capability: step.capability,
    scope: input.admission.binding.scope,
    access: expectedAccess(input.stepId),
    observedAt: new Date(input.observedAt).toISOString(),
    artifactDigest: sha256(input.artifactBytes),
    rollbackDigest: sha256(input.rollbackBytes),
    source: {
      readinessDigest: input.admission.source.readinessDigest,
      capsuleDigest: input.admission.source.capsuleDigest,
      ownerReceiptDigest: input.admission.source.ownerReceiptDigest,
    },
    revision: { isolatedCommit, isolatedTreeDigest },
    isolation: {
      sourceReadOnly: true,
      outputIsolated: true,
      networkAccess: false,
      secretsAvailable: false,
      productionCredentialsAvailable: false,
      productionDataAvailable: false,
    },
    authority: {
      isolatedWorkspaceMutation: input.stepId === "isolated_code_preparation",
      canonicalRepositoryWrite: false,
      productionWrite: false,
      merge: false,
      deployment: false,
      publicExposure: false,
      release: false,
      lifecyclePromotion: false,
    },
  };
  return new TextEncoder().encode(canonicalJson(evidence));
}

function parseStepEvidence(input: {
  execution: PantavionRecoveryBoundedExecution;
  admission: PantavionRecoveryBuildAdmission;
  evidenceBytes: Uint8Array;
  artifactBytes: Uint8Array;
  rollbackBytes: Uint8Array;
  observedAt: string;
}): PantavionRecoveryStepEvidence {
  if (
    !(input.evidenceBytes instanceof Uint8Array) ||
    !(input.artifactBytes instanceof Uint8Array) ||
    !(input.rollbackBytes instanceof Uint8Array)
  ) {
    throw new Error("recovery_execution_step_bytes_required");
  }
  if (input.artifactBytes.byteLength < 1 || input.rollbackBytes.byteLength < 1) {
    throw new Error("recovery_execution_step_artifact_or_rollback_empty");
  }
  if (
    input.evidenceBytes.byteLength + input.artifactBytes.byteLength + input.rollbackBytes.byteLength >
    input.execution.session.maximumEvidenceBytes
  ) {
    throw new Error("recovery_execution_step_evidence_budget_exceeded");
  }
  let evidence: PantavionRecoveryStepEvidence;
  try {
    evidence = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(input.evidenceBytes));
  } catch {
    throw new Error("recovery_execution_step_evidence_invalid_json");
  }
  const canonicalBytes = new TextEncoder().encode(canonicalJson(evidence));
  if (!bytesEqual(canonicalBytes, input.evidenceBytes)) {
    throw new Error("recovery_execution_step_evidence_not_canonical");
  }
  if (
    !exactKeys(evidence, [
      "marker", "origin", "admissionDigest", "admissionId", "sessionId", "intentId",
      "buildOrderId", "workspaceId", "baseRevision", "stepId", "claim", "capability",
      "scope", "access", "observedAt", "artifactDigest", "rollbackDigest", "source",
      "revision", "isolation", "authority",
    ]) ||
    !exactKeys(evidence.source, ["readinessDigest", "capsuleDigest", "ownerReceiptDigest"]) ||
    !exactKeys(evidence.revision, ["isolatedCommit", "isolatedTreeDigest"]) ||
    !exactKeys(evidence.isolation, [
      "sourceReadOnly", "outputIsolated", "networkAccess", "secretsAvailable",
      "productionCredentialsAvailable", "productionDataAvailable",
    ]) ||
    !exactKeys(evidence.authority, [
      "isolatedWorkspaceMutation", "canonicalRepositoryWrite", "productionWrite", "merge",
      "deployment", "publicExposure", "release", "lifecyclePromotion",
    ])
  ) {
    throw new Error("recovery_execution_step_evidence_schema_invalid");
  }
  const step = input.execution.session.plan.steps.find((candidate) => candidate.id === evidence.stepId);
  if (
    evidence.marker !== "pantavion_recovery_step_evidence_v1" ||
    !["synthetic_test_only", "isolated_workspace"].includes(evidence.origin) ||
    evidence.admissionDigest !== input.admission.admissionDigest ||
    evidence.admissionId !== input.admission.admissionId ||
    evidence.sessionId !== input.execution.session.id ||
    evidence.intentId !== input.execution.session.intentId ||
    evidence.buildOrderId !== input.execution.buildOrderId ||
    evidence.workspaceId !== input.execution.workspaceId ||
    evidence.baseRevision !== input.execution.baseRevision ||
    !step ||
    evidence.claim !== expectedClaim(evidence.stepId) ||
    evidence.capability !== step.capability ||
    evidence.scope !== input.admission.binding.scope ||
    evidence.access !== expectedAccess(evidence.stepId) ||
    evidence.observedAt !== new Date(input.observedAt).toISOString() ||
    evidence.artifactDigest !== sha256(input.artifactBytes) ||
    evidence.rollbackDigest !== sha256(input.rollbackBytes) ||
    evidence.source.readinessDigest !== input.admission.source.readinessDigest ||
    evidence.source.capsuleDigest !== input.admission.source.capsuleDigest ||
    evidence.source.ownerReceiptDigest !== input.admission.source.ownerReceiptDigest
  ) {
    throw new Error("recovery_execution_step_evidence_binding_invalid");
  }
  assertSha256("recovery_execution_step_artifact", evidence.artifactDigest);
  assertSha256("recovery_execution_step_rollback", evidence.rollbackDigest);
  if (
    evidence.isolation.sourceReadOnly !== true ||
    evidence.isolation.outputIsolated !== true ||
    evidence.isolation.networkAccess !== false ||
    evidence.isolation.secretsAvailable !== false ||
    evidence.isolation.productionCredentialsAvailable !== false ||
    evidence.isolation.productionDataAvailable !== false ||
    evidence.authority.isolatedWorkspaceMutation !== (evidence.stepId === "isolated_code_preparation")
  ) {
    throw new Error("recovery_execution_step_isolation_invalid");
  }
  for (const [key, value] of Object.entries(evidence.authority)) {
    if (key === "isolatedWorkspaceMutation") continue;
    if (value !== false) throw new Error(`recovery_execution_step_authority_escalation:${key}`);
  }
  if (evidence.stepId === "exact_revision_evidence") {
    if (evidence.revision.isolatedCommit === null || evidence.revision.isolatedTreeDigest === null) {
      throw new Error("recovery_execution_step_revision_missing");
    }
    assertGitCommitSha("recovery_execution_step_isolated_commit", evidence.revision.isolatedCommit);
    assertSha256("recovery_execution_step_isolated_tree", evidence.revision.isolatedTreeDigest);
  } else if (evidence.revision.isolatedCommit !== null || evidence.revision.isolatedTreeDigest !== null) {
    throw new Error("recovery_execution_step_revision_early");
  }
  const observedAt = parseTimestamp("recovery_execution_step_observed_at", evidence.observedAt);
  if (
    observedAt < parseTimestamp("recovery_execution_updated_at", input.execution.updatedAt) ||
    observedAt >= parseTimestamp("recovery_execution_valid_until", input.execution.validUntil)
  ) {
    throw new Error("recovery_execution_step_time_invalid");
  }
  return evidence;
}

export function advancePantavionRecoveryBoundedExecution(input: {
  execution: PantavionRecoveryBoundedExecution;
  admission: PantavionRecoveryBuildAdmission;
  evidenceBytes: Uint8Array;
  artifactBytes: Uint8Array;
  rollbackBytes: Uint8Array;
  cost: number;
  observedAt: string;
}): PantavionRecoveryBoundedExecution {
  if (!verifyPantavionRecoveryBoundedExecution(input.execution, input.admission, input.observedAt)) {
    throw new Error("recovery_execution_state_invalid_or_expired");
  }
  if (input.execution.status === "bounded_protocol_complete") {
    throw new Error("recovery_execution_already_complete");
  }
  if (!Number.isFinite(input.cost) || input.cost <= 0) {
    throw new Error("recovery_execution_step_cost_invalid");
  }
  const evidence = parseStepEvidence(input);
  const checkpoint = input.execution.checkpoints.at(-1);
  if (!checkpoint) throw new Error("recovery_execution_checkpoint_missing");
  const session = restoreBoundedExecutionSession(checkpoint, {
    sessionId: input.execution.session.id,
    intentId: input.execution.session.intentId,
    agentId: input.execution.session.agent.id,
    planFingerprint: input.execution.session.planFingerprint,
    trustedCheckpointDigest: checkpoint.checkpointDigest,
    minimumSequence: checkpoint.sequence,
    minimumFencingToken: input.execution.worker.fencingToken,
  });
  const nextSession = recordBoundedStepCompletion(session, {
    sessionId: session.id,
    intentId: session.intentId,
    agentId: session.agent.id,
    stepId: evidence.stepId,
    scope: evidence.scope,
    access: evidence.access,
    cost: input.cost,
    observedAt: evidence.observedAt,
    outputBytes: input.evidenceBytes,
    auditReference: `audit://pantavion/recovery/${evidence.artifactDigest}`,
    rollbackReference: `rollback://pantavion/recovery/${evidence.rollbackDigest}`,
  });
  const nextCheckpoint = createBoundedExecutionCheckpoint({
    session: nextSession,
    sequence: checkpoint.sequence + 1,
    fencingToken: input.execution.worker.fencingToken,
    workerId: input.execution.worker.id,
    observedAt: evidence.observedAt,
    previous: checkpoint,
  });
  const boundedReceipt = nextSession.receipts.at(-1);
  if (!boundedReceipt || boundedReceipt.outputDigest !== sha256(input.evidenceBytes)) {
    throw new Error("recovery_execution_step_receipt_missing");
  }
  const evidenceReceipt: PantavionRecoveryStepEvidenceReceipt = {
    stepId: evidence.stepId,
    origin: evidence.origin,
    observedAt: evidence.observedAt,
    evidenceDigest: boundedReceipt.outputDigest,
    artifactDigest: evidence.artifactDigest,
    rollbackDigest: evidence.rollbackDigest,
    boundedReceiptDigest: boundedReceipt.receiptDigest,
    checkpointDigest: nextCheckpoint.checkpointDigest,
    lifecyclePromotionAuthority: false,
  };
  const { executionDigest: previousExecutionDigest, ...currentUnsigned } = input.execution;
  assertSha256("recovery_execution_previous_digest", previousExecutionDigest);
  let status: PantavionRecoveryBoundedExecution["status"] = "executing";
  if (nextSession.state === "completed") status = "bounded_protocol_complete";
  const unsigned: Omit<PantavionRecoveryBoundedExecution, "executionDigest"> = {
    ...currentUnsigned,
    status,
    updatedAt: evidence.observedAt,
    session: nextSession,
    checkpoints: [...input.execution.checkpoints, nextCheckpoint],
    evidence: [...input.execution.evidence, evidenceReceipt],
  };
  const nextExecution = withExecutionDigest(unsigned);
  if (!verifyPantavionRecoveryBoundedExecution(nextExecution, input.admission, evidence.observedAt)) {
    throw new Error("recovery_execution_transition_self_verification_failed");
  }
  return nextExecution;
}

export function verifyPantavionRecoveryBoundedExecution(
  execution: PantavionRecoveryBoundedExecution,
  admission: PantavionRecoveryBuildAdmission,
  now: string,
): boolean {
  try {
    const { executionDigest, ...unsigned } = execution;
    assertSha256("recovery_execution_digest", executionDigest);
    if (sha256(canonicalJson(unsigned)) !== executionDigest) return false;
    if (!verifyPantavionRecoveryBuildAdmission(admission, now)) return false;
    validateWorker(execution.worker.id, execution.worker.fencingToken);
    let expectedSessionUpdatedAt = execution.updatedAt;
    if (execution.evidence.length === 0) {
      expectedSessionUpdatedAt = admission.boundedSession.updatedAt;
    }
    if (
      execution.marker !== "pantavion_recovery_bounded_execution_v1" ||
      execution.repository !== "pandaconnect1/pantavion-planet" ||
      execution.admissionId !== admission.admissionId ||
      execution.admissionDigest !== admission.admissionDigest ||
      execution.buildOrderId !== admission.source.buildOrderId ||
      execution.workspaceId !== admission.isolation.workspaceId ||
      execution.baseRevision !== admission.baseRevision ||
      execution.validUntil !== admission.validUntil ||
      execution.edge.taskId !== admission.binding.edgeTaskId ||
      execution.edge.packetDigest !== admission.edge.packetDigest ||
      execution.edge.replayConsumed !== true ||
      execution.edge.disconnected !== true ||
      execution.edge.networkAccess !== false ||
      execution.edge.productionWrite !== false ||
      execution.lifecycle.sourceImplementationState !== "IDEA" ||
      execution.lifecycle.nextPermittedEvidenceState !== "CODED" ||
      execution.lifecycle.promotionRecorded !== false ||
      execution.lifecycle.externalReviewRequired !== true ||
      execution.authority.isolatedStepExecution !== true ||
      execution.completion !== false
    ) return false;
    for (const [key, value] of Object.entries(execution.authority)) {
      if (key === "isolatedStepExecution") continue;
      if (value !== false) return false;
    }
    const startedAt = parseTimestamp("recovery_execution_started_at", execution.startedAt);
    const updatedAt = parseTimestamp("recovery_execution_updated_at", execution.updatedAt);
    const validUntil = parseTimestamp("recovery_execution_valid_until", execution.validUntil);
    const verifiedAt = parseTimestamp("recovery_execution_verified_at", now);
    if (
      startedAt < parseTimestamp("recovery_execution_admission_observed_at", admission.observedAt) ||
      execution.edge.consumedAt !== execution.startedAt ||
      updatedAt < startedAt ||
      verifiedAt < updatedAt ||
      verifiedAt >= validUntil
    ) return false;
    if (
      execution.executionId !== executionId({
        admissionDigest: execution.admissionDigest,
        edgePacketDigest: execution.edge.packetDigest,
        workerId: execution.worker.id,
        fencingToken: execution.worker.fencingToken,
        startedAt: execution.startedAt,
      }) ||
      execution.session.id !== admission.binding.sessionId ||
      execution.session.intentId !== admission.binding.intentId ||
      execution.session.updatedAt !== expectedSessionUpdatedAt ||
      execution.checkpoints.length !== execution.evidence.length + 1 ||
      execution.session.receipts.length !== execution.evidence.length ||
      execution.session.completedStepIds.length !== execution.evidence.length
    ) return false;
    const sessionVerification = verifyBoundedExecutionSession(execution.session);
    if (!sessionVerification.valid) return false;
    const rootCheckpoint = execution.checkpoints[0];
    if (
      !rootCheckpoint ||
      rootCheckpoint.sequence !== 1 ||
      rootCheckpoint.previousCheckpointDigest !== null ||
      canonicalJson(rootCheckpoint.session) !== canonicalJson(admission.boundedSession)
    ) return false;
    for (const [index, checkpoint] of execution.checkpoints.entries()) {
      let previous: BoundedExecutionCheckpoint | undefined;
      if (index > 0) previous = execution.checkpoints[index - 1];
      const checkpointVerification = verifyBoundedExecutionCheckpoint(checkpoint, previous);
      if (!checkpointVerification.valid) return false;
      if (
        checkpoint.sequence !== index + 1 ||
        checkpoint.fencingToken !== execution.worker.fencingToken ||
        checkpoint.workerId !== execution.worker.id
      ) return false;
    }
    const checkpointHead = execution.checkpoints.at(-1);
    if (!checkpointHead || canonicalJson(checkpointHead.session) !== canonicalJson(execution.session)) return false;
    for (const [index, evidence] of execution.evidence.entries()) {
      const receipt = execution.session.receipts[index];
      const checkpointForStep = execution.checkpoints[index + 1];
      if (
        !receipt ||
        !checkpointForStep ||
        evidence.stepId !== receipt.stepId ||
        evidence.observedAt !== receipt.observedAt ||
        evidence.evidenceDigest !== receipt.outputDigest ||
        evidence.boundedReceiptDigest !== receipt.receiptDigest ||
        evidence.checkpointDigest !== checkpointForStep.checkpointDigest ||
        evidence.lifecyclePromotionAuthority !== false ||
        !["synthetic_test_only", "isolated_workspace"].includes(evidence.origin)
      ) return false;
      assertSha256("recovery_execution_evidence_digest", evidence.evidenceDigest);
      assertSha256("recovery_execution_artifact_digest", evidence.artifactDigest);
      assertSha256("recovery_execution_rollback_digest", evidence.rollbackDigest);
    }
    const complete = execution.session.state === "completed";
    if (execution.evidence.length === 0 && execution.status !== "ready") return false;
    if (execution.evidence.length > 0 && !complete && execution.status !== "executing") return false;
    if (complete && execution.status !== "bounded_protocol_complete") return false;
    return true;
  } catch {
    return false;
  }
}
