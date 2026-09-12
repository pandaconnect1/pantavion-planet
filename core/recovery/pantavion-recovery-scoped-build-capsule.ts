import { createHash } from "node:crypto";

import {
  verifyRecoveryBuildOwnerDecisionReceipt,
  type RecoveryBuildOwnerDecisionReceipt,
} from "./pantavion-recovery-owner-decision.ts";
import type { PantavionRecoveryBuildReadinessPacket } from "./pantavion-recovery-build-readiness.ts";
import { derivePantavionRecoveryBuildOrderId } from "./pantavion-recovery-sovereign-build-dispatch.ts";

const PANTAVION_REPOSITORY = "pandaconnect1/pantavion-planet";
const MAX_DECISION_AGE_MS = 24 * 60 * 60 * 1000;

export type RecoveryScopedBuildStepKind =
  | "source_binding"
  | "isolated_code_preparation"
  | "unit_verification"
  | "security_verification"
  | "rollback_evidence"
  | "exact_revision_evidence";

export interface RecoveryScopedBuildStep {
  id: string;
  kind: RecoveryScopedBuildStepKind;
  dependsOn: string[];
  capability: string;
  scope: string;
  access: "read" | "write";
  reversible: true;
  executionAuthorized: false;
  state: "not_started";
  evidenceRequired: string[];
}

export interface PantavionRecoveryScopedBuildCapsule {
  marker: "pantavion_recovery_scoped_build_capsule_v1";
  repository: "pandaconnect1/pantavion-planet";
  baseRevision: string;
  compiledAt: string;
  readinessIndexDigest: string;
  buildOrderOrdinal: number;
  buildOrderId: string;
  buildOrderDigest: string;
  readinessDigest: string;
  route: PantavionRecoveryBuildReadinessPacket["route"];
  membership: PantavionRecoveryBuildReadinessPacket["membership"];
  risk: PantavionRecoveryBuildReadinessPacket["risk"];
  data: PantavionRecoveryBuildReadinessPacket["data"];
  founderDecision: {
    receiptDigest: string;
    ownerUserId: string;
    assuranceLevel: "aal2";
    decision: "approve_scoped_implementation";
    decisionScope: "isolated_code_preparation_only";
    decidedAt: string;
  };
  isolation: {
    workspaceId: string;
    workspaceUri: string;
    canonicalTarget: string;
    sourceMount: "read_only";
    outputMount: "isolated_write_only";
    networkPolicy: "deny_by_default";
    secretsAvailable: false;
    productionCredentialsAvailable: false;
    productionDataAvailable: false;
  };
  technology: {
    entryId: string;
    readiness: "hold";
    blockers: string[];
    separateClearanceRequired: true;
    deploymentAuthorized: false;
  };
  agent: {
    state: "not_issued";
    primaryRole: PantavionRecoveryBuildReadinessPacket["agent"]["primaryRole"];
    requestedCapabilities: PantavionRecoveryBuildReadinessPacket["agent"]["requestedCapabilities"];
    requestedBudgetLimit: 0;
    separateCapabilityGrantRequired: true;
    separateBudgetGrantRequired: true;
  };
  lifecycle: {
    currentImplementationState: "IDEA";
    nextPermittedLifecycleState: "CODED";
    testedPromotionRequiresExternalEvidence: true;
    executionDisposition: "blocked_pending_separate_grants_and_technology_clearance";
  };
  steps: RecoveryScopedBuildStep[];
  verification: {
    requiredGates: string[];
    rollbackReceiptRequired: true;
    exactRevisionEvidenceRequired: true;
  };
  previousCapsuleDigest: string | null;
  authority: {
    analysis: true;
    planning: true;
    codeMutation: false;
    agentGrant: false;
    budgetGrant: false;
    execution: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  completion: false;
  capsuleDigest: string;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_capsule_non_finite_number");
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
  throw new Error("recovery_capsule_unsupported_digest_value");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function assertGitCommitSha(label: string, value: string): void {
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error(`${label}_must_be_git_commit_sha`);
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateCanonicalRoute(packet: PantavionRecoveryBuildReadinessPacket): void {
  const { route } = packet;
  for (const [label, value] of Object.entries({
    module: route.module,
    subsystem: route.subsystem,
    capability: route.capability,
    canonicalTarget: route.canonicalTarget,
  })) {
    if (!value.trim() || /[\u0000-\u001f\\]/.test(value)) {
      throw new Error(`recovery_capsule_route_${label}_invalid`);
    }
  }
  for (const [label, value] of Object.entries({
    feature: route.feature,
    artifactType: route.artifactType,
  })) {
    if (value !== null && (!value.trim() || /[\u0000-\u001f\\]/.test(value))) {
      throw new Error(`recovery_capsule_route_${label}_invalid`);
    }
  }
  const expectedTarget = `canonical/${route.module}/${route.subsystem}/${route.capability}`;
  if (route.canonicalTarget !== expectedTarget || /(^|\/)\.\.?(\/|$)/.test(route.canonicalTarget)) {
    throw new Error("recovery_capsule_route_target_invalid");
  }
  if (derivePantavionRecoveryBuildOrderId(route) !== packet.buildOrderId) {
    throw new Error("recovery_capsule_build_order_identity_mismatch");
  }
}

function validateReadinessPacket(packet: PantavionRecoveryBuildReadinessPacket): void {
  if (packet.marker !== "pantavion_recovery_build_readiness_packet_v1") {
    throw new Error("recovery_capsule_readiness_marker_invalid");
  }
  if (!Number.isInteger(packet.buildOrderOrdinal) || packet.buildOrderOrdinal < 1) {
    throw new Error("recovery_capsule_build_order_ordinal_invalid");
  }
  if (!/^recovery_build_order_[0-9a-f]{64}$/.test(packet.buildOrderId)) {
    throw new Error("recovery_capsule_build_order_id_invalid");
  }
  assertSha256("recovery_capsule_build_order_digest", packet.buildOrderDigest);
  assertSha256("recovery_capsule_readiness_digest", packet.readinessDigest);
  assertSha256(
    "recovery_capsule_membership_fingerprint",
    packet.membership.orderedMemberWorkUnitIdFingerprint,
  );
  if (packet.previousReadinessDigest !== null) {
    assertSha256("recovery_capsule_previous_readiness_digest", packet.previousReadinessDigest);
  }
  if (
    !Number.isInteger(packet.membership.memberCount) ||
    packet.membership.memberCount < 1 ||
    !Number.isInteger(packet.membership.firstGlobalOrdinal) ||
    !Number.isInteger(packet.membership.lastGlobalOrdinal) ||
    packet.membership.firstGlobalOrdinal < 1 ||
    packet.membership.lastGlobalOrdinal < packet.membership.firstGlobalOrdinal
  ) {
    throw new Error("recovery_capsule_membership_invalid");
  }
  validateCanonicalRoute(packet);

  const { readinessDigest, ...unsigned } = packet;
  if (sha256(canonicalJson(unsigned)) !== readinessDigest) {
    throw new Error("recovery_capsule_readiness_digest_mismatch");
  }
  if (
    packet.currentImplementationState !== "IDEA" ||
    packet.ownerControl.audience !== "founder_only" ||
    packet.ownerControl.state !== "awaiting_owner" ||
    packet.ownerControl.founderDecisionRequired !== true ||
    packet.ownerControl.approvalRecorded !== false ||
    packet.ownerControl.approvalIdentity !== null ||
    packet.ownerControl.approvedAt !== null ||
    packet.ownerControl.releaseAuthorized !== false ||
    packet.completion !== false
  ) {
    throw new Error("recovery_capsule_readiness_boundary_invalid");
  }
  if (
    packet.technology.assessment.readiness !== "hold" ||
    packet.technology.assessment.deploymentAuthorized !== false ||
    packet.technology.assessment.entryId !== packet.technology.candidate.id ||
    packet.technology.assessment.blockers.length < 1 ||
    packet.agent.state !== "not_issued" ||
    packet.agent.requestedBudgetLimit !== 0 ||
    packet.agent.ownerApprovalRequired !== true ||
    packet.disconnectedEdge.disposition !== "blocked" ||
    packet.disconnectedEdge.executionMode !== "ephemeral_sandbox_only" ||
    packet.disconnectedEdge.networkPolicy !== "deny_by_default" ||
    packet.disconnectedEdge.maximumDurationSeconds !== 0 ||
    packet.disconnectedEdge.signedPayloadRequired !== true ||
    packet.disconnectedEdge.replayProtectionRequired !== true ||
    packet.disconnectedEdge.rollbackReceiptRequired !== true ||
    packet.disconnectedEdge.eligible !== false ||
    packet.disconnectedEdge.blockers.length < 1 ||
    packet.disconnectedEdge.productionWriteAuthorized !== false ||
    packet.verification.nextPermittedLifecycleStateAfterScopedImplementation !== "CODED" ||
    packet.verification.testedPromotionRequiresExternalEvidence !== true
  ) {
    throw new Error("recovery_capsule_readiness_gate_invalid");
  }
  if (
    packet.agent.requestedCapabilities.length !== 1 ||
    packet.agent.requestedCapabilities[0]?.capability !== packet.route.capability ||
    packet.agent.requestedCapabilities[0]?.scope !== packet.route.canonicalTarget ||
    packet.agent.requestedCapabilities[0]?.access !== "write"
  ) {
    throw new Error("recovery_capsule_requested_scope_invalid");
  }
  const requiredGates = new Set(packet.verification.requiredGates);
  for (const gate of [
    "source_binding",
    "unit_tests",
    "typecheck",
    "security_review",
    "production_build",
    "rollback_receipt",
    "exact_revision_evidence",
  ]) {
    if (!requiredGates.has(gate)) throw new Error(`recovery_capsule_verification_gate_missing:${gate}`);
  }
  if (packet.authority.analysis !== true || packet.authority.planning !== true) {
    throw new Error("recovery_capsule_planning_authority_missing");
  }
  for (const [key, value] of Object.entries(packet.authority)) {
    if (key === "analysis" || key === "planning") continue;
    if (value !== false) throw new Error(`recovery_capsule_readiness_authority_escalation:${key}`);
  }
}

function validateApproval(input: {
  packet: PantavionRecoveryBuildReadinessPacket;
  receipt: RecoveryBuildOwnerDecisionReceipt;
  readinessIndexDigest: string;
  compiledAt: string;
}): void {
  let receiptValid = false;
  try {
    receiptValid = verifyRecoveryBuildOwnerDecisionReceipt(input.receipt);
  } catch {
    receiptValid = false;
  }
  if (!receiptValid) throw new Error("recovery_capsule_owner_receipt_invalid");
  if (
    input.receipt.decision !== "approve_scoped_implementation" ||
    input.receipt.decisionScope !== "isolated_code_preparation_only" ||
    input.receipt.scopeApprovalRecorded !== true ||
    input.receipt.nextPermittedLifecycleState !== "CODED"
  ) {
    throw new Error("recovery_capsule_owner_approval_required");
  }
  if (
    input.receipt.readinessIndexDigest !== input.readinessIndexDigest ||
    input.receipt.buildOrderId !== input.packet.buildOrderId ||
    input.receipt.buildOrderDigest !== input.packet.buildOrderDigest ||
    input.receipt.readinessDigest !== input.packet.readinessDigest ||
    input.receipt.riskLevel !== input.packet.risk.level ||
    !arraysEqual(input.receipt.dataClasses, input.packet.data.classes)
  ) {
    throw new Error("recovery_capsule_owner_receipt_source_mismatch");
  }

  const compiledAt = Date.parse(input.compiledAt);
  const decidedAt = Date.parse(input.receipt.decidedAt);
  if (!Number.isFinite(compiledAt) || !Number.isFinite(decidedAt)) {
    throw new Error("recovery_capsule_timestamp_invalid");
  }
  const decisionAge = compiledAt - decidedAt;
  if (decisionAge < 0) throw new Error("recovery_capsule_owner_receipt_from_future");
  if (decisionAge > MAX_DECISION_AGE_MS) {
    throw new Error("recovery_capsule_owner_receipt_expired");
  }
}

function buildSteps(packet: PantavionRecoveryBuildReadinessPacket): RecoveryScopedBuildStep[] {
  const scope = packet.route.canonicalTarget;
  const capability = packet.route.capability;
  const step = (
    id: string,
    kind: RecoveryScopedBuildStepKind,
    dependsOn: string[],
    access: "read" | "write",
    evidenceRequired: string[],
  ): RecoveryScopedBuildStep => ({
    id,
    kind,
    dependsOn,
    capability,
    scope,
    access,
    reversible: true,
    executionAuthorized: false,
    state: "not_started",
    evidenceRequired,
  });
  return [
    step("source_binding", "source_binding", [], "read", ["readiness_digest", "owner_receipt_digest"]),
    step("isolated_code_preparation", "isolated_code_preparation", ["source_binding"], "write", ["scoped_diff"]),
    step("unit_verification", "unit_verification", ["isolated_code_preparation"], "read", ["unit_test_report"]),
    step("security_verification", "security_verification", ["isolated_code_preparation"], "read", ["security_review_report"]),
    step("rollback_evidence", "rollback_evidence", ["isolated_code_preparation"], "read", ["rollback_receipt"]),
    step(
      "exact_revision_evidence",
      "exact_revision_evidence",
      ["unit_verification", "security_verification", "rollback_evidence"],
      "read",
      ["git_commit_sha", "tree_digest"],
    ),
  ];
}

export function createPantavionRecoveryScopedBuildCapsule(input: {
  packet: PantavionRecoveryBuildReadinessPacket;
  receipt: RecoveryBuildOwnerDecisionReceipt;
  readinessIndexDigest: string;
  repository: string;
  baseRevision: string;
  compiledAt: string;
  previousCapsuleDigest: string | null;
}): PantavionRecoveryScopedBuildCapsule {
  validateReadinessPacket(input.packet);
  assertSha256("recovery_capsule_readiness_index_digest", input.readinessIndexDigest);
  assertGitCommitSha("recovery_capsule_base_revision", input.baseRevision);
  if (input.repository !== PANTAVION_REPOSITORY) {
    throw new Error("recovery_capsule_repository_mismatch");
  }
  if (input.previousCapsuleDigest !== null) {
    assertSha256("recovery_capsule_previous_digest", input.previousCapsuleDigest);
  }
  validateApproval(input);

  const workspaceSeed = {
    repository: input.repository,
    baseRevision: input.baseRevision,
    buildOrderId: input.packet.buildOrderId,
    readinessDigest: input.packet.readinessDigest,
    receiptDigest: input.receipt.receiptDigest,
  };
  const workspaceId = `recovery_workspace_${sha256(canonicalJson(workspaceSeed))}`;
  const unsigned = {
    marker: "pantavion_recovery_scoped_build_capsule_v1" as const,
    repository: "pandaconnect1/pantavion-planet" as const,
    baseRevision: input.baseRevision,
    compiledAt: new Date(input.compiledAt).toISOString(),
    readinessIndexDigest: input.readinessIndexDigest,
    buildOrderOrdinal: input.packet.buildOrderOrdinal,
    buildOrderId: input.packet.buildOrderId,
    buildOrderDigest: input.packet.buildOrderDigest,
    readinessDigest: input.packet.readinessDigest,
    route: { ...input.packet.route },
    membership: { ...input.packet.membership },
    risk: { ...input.packet.risk, reasonCodes: [...input.packet.risk.reasonCodes] },
    data: { ...input.packet.data, classes: [...input.packet.data.classes], reasonCodes: [...input.packet.data.reasonCodes] },
    founderDecision: {
      receiptDigest: input.receipt.receiptDigest,
      ownerUserId: input.receipt.ownerUserId,
      assuranceLevel: "aal2" as const,
      decision: "approve_scoped_implementation" as const,
      decisionScope: "isolated_code_preparation_only" as const,
      decidedAt: input.receipt.decidedAt,
    },
    isolation: {
      workspaceId,
      workspaceUri: `sandbox://pantavion/recovery/${workspaceId}`,
      canonicalTarget: input.packet.route.canonicalTarget,
      sourceMount: "read_only" as const,
      outputMount: "isolated_write_only" as const,
      networkPolicy: "deny_by_default" as const,
      secretsAvailable: false as const,
      productionCredentialsAvailable: false as const,
      productionDataAvailable: false as const,
    },
    technology: {
      entryId: input.packet.technology.assessment.entryId,
      readiness: "hold" as const,
      blockers: [...input.packet.technology.assessment.blockers],
      separateClearanceRequired: true as const,
      deploymentAuthorized: false as const,
    },
    agent: {
      state: "not_issued" as const,
      primaryRole: input.packet.agent.primaryRole,
      requestedCapabilities: input.packet.agent.requestedCapabilities.map((scope) => ({ ...scope })),
      requestedBudgetLimit: 0 as const,
      separateCapabilityGrantRequired: true as const,
      separateBudgetGrantRequired: true as const,
    },
    lifecycle: {
      currentImplementationState: "IDEA" as const,
      nextPermittedLifecycleState: "CODED" as const,
      testedPromotionRequiresExternalEvidence: true as const,
      executionDisposition: "blocked_pending_separate_grants_and_technology_clearance" as const,
    },
    steps: buildSteps(input.packet),
    verification: {
      requiredGates: [...input.packet.verification.requiredGates],
      rollbackReceiptRequired: true as const,
      exactRevisionEvidenceRequired: true as const,
    },
    previousCapsuleDigest: input.previousCapsuleDigest,
    authority: {
      analysis: true as const,
      planning: true as const,
      codeMutation: false as const,
      agentGrant: false as const,
      budgetGrant: false as const,
      execution: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    completion: false as const,
  };
  return { ...unsigned, capsuleDigest: sha256(canonicalJson(unsigned)) };
}

export function verifyPantavionRecoveryScopedBuildCapsule(
  capsule: PantavionRecoveryScopedBuildCapsule,
): boolean {
  try {
    const { capsuleDigest, ...unsigned } = capsule;
    assertSha256("recovery_capsule_digest", capsuleDigest);
    if (sha256(canonicalJson(unsigned)) !== capsuleDigest) return false;
    if (
      capsule.marker !== "pantavion_recovery_scoped_build_capsule_v1" ||
      capsule.repository !== PANTAVION_REPOSITORY ||
      capsule.lifecycle.currentImplementationState !== "IDEA" ||
      capsule.lifecycle.nextPermittedLifecycleState !== "CODED" ||
      capsule.lifecycle.executionDisposition !== "blocked_pending_separate_grants_and_technology_clearance" ||
      capsule.founderDecision.assuranceLevel !== "aal2" ||
      capsule.founderDecision.decision !== "approve_scoped_implementation" ||
      capsule.founderDecision.decisionScope !== "isolated_code_preparation_only" ||
      capsule.technology.readiness !== "hold" ||
      capsule.technology.blockers.length < 1 ||
      capsule.technology.separateClearanceRequired !== true ||
      capsule.technology.deploymentAuthorized !== false ||
      capsule.agent.state !== "not_issued" ||
      capsule.agent.requestedBudgetLimit !== 0 ||
      capsule.agent.separateCapabilityGrantRequired !== true ||
      capsule.agent.separateBudgetGrantRequired !== true ||
      capsule.agent.requestedCapabilities.length !== 1 ||
      capsule.agent.requestedCapabilities[0]?.capability !== capsule.route.capability ||
      capsule.agent.requestedCapabilities[0]?.scope !== capsule.route.canonicalTarget ||
      capsule.agent.requestedCapabilities[0]?.access !== "write" ||
      capsule.isolation.canonicalTarget !== capsule.route.canonicalTarget ||
      capsule.isolation.sourceMount !== "read_only" ||
      capsule.isolation.outputMount !== "isolated_write_only" ||
      capsule.isolation.networkPolicy !== "deny_by_default" ||
      capsule.isolation.secretsAvailable !== false ||
      capsule.isolation.productionCredentialsAvailable !== false ||
      capsule.isolation.productionDataAvailable !== false ||
      capsule.verification.rollbackReceiptRequired !== true ||
      capsule.verification.exactRevisionEvidenceRequired !== true ||
      capsule.completion !== false
    ) return false;
    assertGitCommitSha("recovery_capsule_base_revision", capsule.baseRevision);
    assertSha256("recovery_capsule_readiness_index_digest", capsule.readinessIndexDigest);
    assertSha256("recovery_capsule_build_order_digest", capsule.buildOrderDigest);
    assertSha256("recovery_capsule_readiness_digest", capsule.readinessDigest);
    assertSha256("recovery_capsule_founder_receipt_digest", capsule.founderDecision.receiptDigest);
    if (capsule.previousCapsuleDigest !== null) {
      assertSha256("recovery_capsule_previous_digest", capsule.previousCapsuleDigest);
    }
    if (
      !Number.isFinite(Date.parse(capsule.compiledAt)) ||
      !Number.isFinite(Date.parse(capsule.founderDecision.decidedAt)) ||
      !/^recovery_workspace_[0-9a-f]{64}$/.test(capsule.isolation.workspaceId) ||
      capsule.isolation.workspaceUri !== `sandbox://pantavion/recovery/${capsule.isolation.workspaceId}`
    ) return false;
    if (capsule.authority.analysis !== true || capsule.authority.planning !== true) return false;
    for (const [key, value] of Object.entries(capsule.authority)) {
      if (key === "analysis" || key === "planning") continue;
      if (value !== false) return false;
    }
    const expectedSteps: Array<{
      id: string;
      kind: RecoveryScopedBuildStepKind;
      dependsOn: string[];
      access: "read" | "write";
    }> = [
      { id: "source_binding", kind: "source_binding", dependsOn: [], access: "read" },
      { id: "isolated_code_preparation", kind: "isolated_code_preparation", dependsOn: ["source_binding"], access: "write" },
      { id: "unit_verification", kind: "unit_verification", dependsOn: ["isolated_code_preparation"], access: "read" },
      { id: "security_verification", kind: "security_verification", dependsOn: ["isolated_code_preparation"], access: "read" },
      { id: "rollback_evidence", kind: "rollback_evidence", dependsOn: ["isolated_code_preparation"], access: "read" },
      { id: "exact_revision_evidence", kind: "exact_revision_evidence", dependsOn: ["unit_verification", "security_verification", "rollback_evidence"], access: "read" },
    ];
    const ids = new Set<string>();
    for (const [index, step] of capsule.steps.entries()) {
      const expected = expectedSteps[index];
      if (
        !expected ||
        !step.id ||
        ids.has(step.id) ||
        step.id !== expected.id ||
        step.kind !== expected.kind ||
        step.access !== expected.access ||
        !arraysEqual(step.dependsOn, expected.dependsOn) ||
        step.scope !== capsule.route.canonicalTarget ||
        step.capability !== capsule.route.capability ||
        step.reversible !== true ||
        step.executionAuthorized !== false ||
        step.state !== "not_started" ||
        step.dependsOn.some((dependency) => !ids.has(dependency))
      ) return false;
      ids.add(step.id);
    }
    return capsule.steps.length === expectedSteps.length;
  } catch {
    return false;
  }
}
