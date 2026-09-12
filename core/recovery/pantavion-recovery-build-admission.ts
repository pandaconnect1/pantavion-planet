import { createHash } from "node:crypto";

import {
  authorizeAgentCapability,
  type AgentBudgetGrant,
} from "../sovereign/agent-capability-budget-control.ts";
import {
  createBoundedExecutionSession,
  verifyBoundedExecutionSession,
  type BoundedExecutionSession,
} from "../sovereign/bounded-execution-runtime.ts";
import {
  verifyDisconnectedExecutionPacket,
  type DisconnectedExecutionPacket,
  type EdgeExecutionPolicy,
} from "../sovereign/edge-execution.ts";
import {
  canAgentUseCapability,
  type EphemeralAgent,
} from "../sovereign/ephemeral-agent-swarm.ts";
import {
  compileOutcomePlan,
  type OutcomeStep,
} from "../sovereign/intent-to-outcome-fabric.ts";
import { evaluateIntentFirewall } from "../sovereign/intent-firewall.ts";
import type { SovereignKernelDecision } from "../sovereign/sovereign-capability-kernel.ts";
import {
  assessTechnologyLibraryEntry,
  type TechnologyLibraryAssessment,
  type TechnologyLibraryEntry,
} from "../sovereign/technology-library.ts";
import {
  verifyRecoveryBuildOwnerDecisionReceipt,
  type RecoveryBuildOwnerDecisionReceipt,
} from "./pantavion-recovery-owner-decision.ts";
import type { PantavionRecoveryBuildReadinessPacket } from "./pantavion-recovery-build-readiness.ts";
import {
  createPantavionRecoveryScopedBuildCapsule,
  verifyPantavionRecoveryScopedBuildCapsule,
  type PantavionRecoveryScopedBuildCapsule,
} from "./pantavion-recovery-scoped-build-capsule.ts";

const MAX_OWNER_RECEIPT_AGE_MS = 24 * 60 * 60 * 1000;
const MAX_ADMISSION_LIFETIME_MS = 30 * 60 * 1000;
const MAX_EVIDENCE_BYTES = 16 * 1024 * 1024;

export interface PantavionRecoveryBuildAdmissionBinding {
  intentId: string;
  sessionId: string;
  edgeTaskId: string;
  capability: string;
  scope: string;
}

export interface PantavionRecoveryBuildAdmission {
  marker: "pantavion_recovery_build_admission_v1";
  disposition: "ready_for_isolated_bounded_execution";
  admissionId: string;
  repository: "pandaconnect1/pantavion-planet";
  baseRevision: string;
  observedAt: string;
  validUntil: string;
  source: {
    readinessIndexDigest: string;
    buildOrderId: string;
    buildOrderDigest: string;
    readinessDigest: string;
    capsuleDigest: string;
    ownerReceiptDigest: string;
  };
  binding: PantavionRecoveryBuildAdmissionBinding;
  technology: {
    assessment: TechnologyLibraryAssessment;
    evidenceDigest: string;
  };
  privacy: {
    dataClasses: PantavionRecoveryBuildReadinessPacket["data"]["classes"];
    legalConsentRecorded: true;
    consentEvidenceDigest: string | null;
  };
  isolation: {
    workspaceId: string;
    sourceReadOnly: true;
    outputIsolated: true;
    networkAccess: false;
    secretsAvailable: false;
    productionCredentialsAvailable: false;
    productionDataAvailable: false;
  };
  edge: {
    packetDigest: string;
    executionMode: "disconnected";
    replayConsumed: false;
    networkRequired: false;
    productionWrite: false;
  };
  kernel: SovereignKernelDecision;
  boundedSession: BoundedExecutionSession;
  lifecycle: {
    sourceImplementationState: "IDEA";
    nextPermittedEvidenceState: "CODED";
    testedPromotionRequiresExternalEvidence: true;
    mergedPromotionRequiresExternalEvidence: true;
    deployedPromotionRequiresExternalEvidence: true;
    verifiedLivePromotionRequiresExternalEvidence: true;
  };
  authority: {
    isolatedCodePreparation: true;
    boundedSessionCreation: true;
    canonicalRepositoryWrite: false;
    productionWrite: false;
    merge: false;
    deployment: false;
    publicExposure: false;
    release: false;
  };
  previousAdmissionDigest: string | null;
  completion: false;
  admissionDigest: string;
}

function canonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error("recovery_admission_non_finite_number");
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
  throw new Error("recovery_admission_unsupported_digest_value");
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(label: string, value: string): void {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error(`${label}_must_be_sha256`);
}

function assertTimestamp(label: string, value: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(`${label}_invalid`);
  return parsed;
}

function arraysEqual(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function derivePantavionRecoveryBuildAdmissionBinding(
  capsule: PantavionRecoveryScopedBuildCapsule,
): PantavionRecoveryBuildAdmissionBinding {
  if (!verifyPantavionRecoveryScopedBuildCapsule(capsule)) {
    throw new Error("recovery_admission_capsule_invalid");
  }
  const seed = sha256(canonicalJson({
    repository: capsule.repository,
    baseRevision: capsule.baseRevision,
    buildOrderId: capsule.buildOrderId,
    readinessDigest: capsule.readinessDigest,
    capsuleDigest: capsule.capsuleDigest,
    ownerReceiptDigest: capsule.founderDecision.receiptDigest,
  }));
  return {
    intentId: `recovery_intent_${seed}`,
    sessionId: `recovery_session_${sha256(`session|${seed}`)}`,
    edgeTaskId: `recovery_edge_task_${sha256(`edge|${seed}`)}`,
    capability: capsule.route.capability,
    scope: capsule.route.canonicalTarget,
  };
}

function validateSourceChain(input: {
  capsule: PantavionRecoveryScopedBuildCapsule;
  readinessPacket: PantavionRecoveryBuildReadinessPacket;
  ownerReceipt: RecoveryBuildOwnerDecisionReceipt;
  observedAt: string;
}): void {
  if (!verifyPantavionRecoveryScopedBuildCapsule(input.capsule)) {
    throw new Error("recovery_admission_capsule_invalid");
  }
  let ownerReceiptValid = false;
  try {
    ownerReceiptValid = verifyRecoveryBuildOwnerDecisionReceipt(input.ownerReceipt);
  } catch {
    ownerReceiptValid = false;
  }
  if (!ownerReceiptValid) throw new Error("recovery_admission_owner_receipt_invalid");
  if (
    input.ownerReceipt.receiptDigest !== input.capsule.founderDecision.receiptDigest ||
    input.ownerReceipt.ownerUserId !== input.capsule.founderDecision.ownerUserId ||
    input.ownerReceipt.decidedAt !== input.capsule.founderDecision.decidedAt ||
    input.ownerReceipt.decision !== "approve_scoped_implementation" ||
    input.ownerReceipt.decisionScope !== "isolated_code_preparation_only" ||
    input.ownerReceipt.scopeApprovalRecorded !== true ||
    input.ownerReceipt.nextPermittedLifecycleState !== "CODED"
  ) {
    throw new Error("recovery_admission_owner_receipt_mismatch");
  }

  const expectedCapsule = createPantavionRecoveryScopedBuildCapsule({
    packet: input.readinessPacket,
    receipt: input.ownerReceipt,
    readinessIndexDigest: input.capsule.readinessIndexDigest,
    repository: input.capsule.repository,
    baseRevision: input.capsule.baseRevision,
    compiledAt: input.capsule.compiledAt,
    previousCapsuleDigest: input.capsule.previousCapsuleDigest,
  });
  if (expectedCapsule.capsuleDigest !== input.capsule.capsuleDigest) {
    throw new Error("recovery_admission_source_chain_mismatch");
  }

  const observedAt = assertTimestamp("recovery_admission_observed_at", input.observedAt);
  const compiledAt = assertTimestamp("recovery_admission_capsule_compiled_at", input.capsule.compiledAt);
  const decidedAt = assertTimestamp("recovery_admission_owner_decided_at", input.ownerReceipt.decidedAt);
  if (observedAt < compiledAt || compiledAt < decidedAt) {
    throw new Error("recovery_admission_source_time_regressed");
  }
  if (observedAt - decidedAt > MAX_OWNER_RECEIPT_AGE_MS) {
    throw new Error("recovery_admission_owner_receipt_expired");
  }
}

function validateTechnology(input: {
  capsule: PantavionRecoveryScopedBuildCapsule;
  entry: TechnologyLibraryEntry;
  observedAt: string;
}): { assessment: TechnologyLibraryAssessment; evidenceDigest: string } {
  if (
    input.entry.id !== input.capsule.technology.entryId ||
    input.entry.capability !== input.capsule.route.capability
  ) {
    throw new Error("recovery_admission_technology_identity_mismatch");
  }
  const observedAt = assertTimestamp("recovery_admission_observed_at", input.observedAt);
  const requiredEvidenceKinds = ["source", "benchmark", "security", "privacy", "license"];
  if (
    input.entry.evidence.length !== requiredEvidenceKinds.length ||
    requiredEvidenceKinds.some(
      (kind) => input.entry.evidence.filter((evidence) => evidence.kind === kind).length !== 1,
    )
  ) {
    throw new Error("recovery_admission_technology_evidence_set_invalid");
  }
  for (const evidence of input.entry.evidence) {
    const evidenceTime = assertTimestamp("recovery_admission_technology_evidence_time", evidence.observedAt);
    if (!evidence.digest) throw new Error("recovery_admission_technology_evidence_digest_missing");
    assertSha256("recovery_admission_technology_evidence_digest", evidence.digest);
    if (evidenceTime > observedAt) {
      throw new Error("recovery_admission_technology_evidence_from_future");
    }
  }
  const assessment = assessTechnologyLibraryEntry(input.entry);
  if (assessment.readiness !== "prototype_ready" || assessment.blockers.length) {
    throw new Error(
      `recovery_admission_technology_not_ready:${assessment.readiness}:${assessment.blockers.join(",")}`,
    );
  }
  return {
    assessment,
    evidenceDigest: sha256(canonicalJson({ entry: input.entry, assessment })),
  };
}

function validateAgentAndBudget(input: {
  capsule: PantavionRecoveryScopedBuildCapsule;
  binding: PantavionRecoveryBuildAdmissionBinding;
  agent: EphemeralAgent;
  grant: AgentBudgetGrant;
  estimatedCost: number;
  observedAt: string;
}): void {
  if (!Number.isFinite(input.estimatedCost) || input.estimatedCost <= 0) {
    throw new Error("recovery_admission_estimated_cost_invalid");
  }
  const observedAt = assertTimestamp("recovery_admission_observed_at", input.observedAt);
  const compiledAt = assertTimestamp("recovery_admission_capsule_compiled_at", input.capsule.compiledAt);
  const agentCreatedAt = assertTimestamp("recovery_admission_agent_created_at", input.agent.createdAt);
  const agentExpiresAt = assertTimestamp("recovery_admission_agent_expires_at", input.agent.expiresAt);
  const grantIssuedAt = assertTimestamp("recovery_admission_grant_issued_at", input.grant.issuedAt);
  const grantExpiresAt = assertTimestamp("recovery_admission_grant_expires_at", input.grant.expiresAt);
  if (
    input.agent.parentIntentId !== input.binding.intentId ||
    input.agent.role !== "builder" ||
    input.agent.state !== "active" ||
    input.grant.agentId !== input.agent.id ||
    input.grant.intentId !== input.binding.intentId ||
    input.grant.state !== "active"
  ) {
    throw new Error("recovery_admission_agent_or_grant_identity_invalid");
  }
  if (
    agentCreatedAt < compiledAt ||
    grantIssuedAt < compiledAt ||
    observedAt < agentCreatedAt ||
    observedAt < grantIssuedAt ||
    observedAt >= agentExpiresAt ||
    observedAt >= grantExpiresAt ||
    agentExpiresAt - agentCreatedAt > MAX_ADMISSION_LIFETIME_MS ||
    grantExpiresAt - grantIssuedAt > MAX_ADMISSION_LIFETIME_MS
  ) {
    throw new Error("recovery_admission_agent_or_grant_time_invalid");
  }
  const agentCapability = input.agent.capabilities[0];
  const grantCapability = input.grant.capabilities[0];
  if (
    input.agent.capabilities.length !== 1 ||
    !agentCapability ||
    agentCapability.capability !== input.binding.capability ||
    agentCapability.scope !== input.binding.scope ||
    agentCapability.readOnly === true ||
    input.grant.capabilities.length !== 1 ||
    !grantCapability ||
    grantCapability.capability !== input.binding.capability ||
    grantCapability.scope !== input.binding.scope ||
    grantCapability.access !== "write"
  ) {
    throw new Error("recovery_admission_capability_scope_invalid");
  }
  if (
    !canAgentUseCapability(
      input.agent,
      input.binding.capability,
      input.binding.scope,
      new Date(input.observedAt),
    )
  ) {
    throw new Error("recovery_admission_ephemeral_capability_denied");
  }
  if (
    input.agent.budget !== input.grant.budgetLimit ||
    input.grant.budgetLimit !== input.estimatedCost ||
    input.grant.spent !== 0
  ) {
    throw new Error("recovery_admission_budget_binding_invalid");
  }
  const authorization = authorizeAgentCapability(input.grant, {
    agentId: input.agent.id,
    intentId: input.binding.intentId,
    capability: input.binding.capability,
    scope: input.binding.scope,
    access: "write",
    cost: input.estimatedCost,
    now: input.observedAt,
  });
  if (!authorization.allowed) {
    throw new Error(`recovery_admission_budget_denied:${authorization.reasons.join(",")}`);
  }
}

function validateEdge(input: {
  capsule: PantavionRecoveryScopedBuildCapsule;
  ownerReceipt: RecoveryBuildOwnerDecisionReceipt;
  binding: PantavionRecoveryBuildAdmissionBinding;
  agent: EphemeralAgent;
  grant: AgentBudgetGrant;
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
    throw new Error(`recovery_admission_edge_denied:${verification.reasons.join(",")}`);
  }
  if (
    input.policy.allowedCapabilities.length !== 1 ||
    input.policy.allowedCapabilities[0] !== input.binding.capability ||
    !Number.isInteger(input.policy.maximumPayloadBytes) ||
    input.policy.maximumPayloadBytes <= 0
  ) {
    throw new Error("recovery_admission_edge_policy_scope_invalid");
  }
  if (
    input.packet.task.id !== input.binding.edgeTaskId ||
    input.packet.task.intentId !== input.binding.intentId ||
    input.packet.task.capability !== input.binding.capability ||
    input.packet.executionMode !== "disconnected" ||
    input.packet.task.deterministic !== true ||
    input.packet.task.reversible !== true ||
    input.packet.task.requiresNetwork !== false ||
    input.packet.task.writesProduction !== false
  ) {
    throw new Error("recovery_admission_edge_binding_invalid");
  }
  const payload = input.packet.task.payload;
  if (
    payload.capsuleDigest !== input.capsule.capsuleDigest ||
    payload.ownerReceiptDigest !== input.ownerReceipt.receiptDigest ||
    payload.workspaceId !== input.capsule.isolation.workspaceId ||
    payload.baseRevision !== input.capsule.baseRevision ||
    payload.sessionId !== input.binding.sessionId ||
    payload.scope !== input.binding.scope
  ) {
    throw new Error("recovery_admission_edge_payload_binding_invalid");
  }
  const compiledAt = assertTimestamp("recovery_admission_capsule_compiled_at", input.capsule.compiledAt);
  const issuedAt = assertTimestamp("recovery_admission_edge_issued_at", input.packet.task.issuedAt);
  const expiresAt = assertTimestamp("recovery_admission_edge_expires_at", input.packet.task.expiresAt);
  if (
    issuedAt < compiledAt ||
    expiresAt - issuedAt > MAX_ADMISSION_LIFETIME_MS ||
    expiresAt > Date.parse(input.agent.expiresAt) ||
    expiresAt > Date.parse(input.grant.expiresAt)
  ) {
    throw new Error("recovery_admission_edge_time_invalid");
  }
}

function outcomeSteps(capsule: PantavionRecoveryScopedBuildCapsule): OutcomeStep[] {
  return capsule.steps.map((step) => ({
    id: step.id,
    title: step.kind.replaceAll("_", " "),
    kind: outcomeStepKind(step.kind),
    capability: step.capability,
    risk: capsule.risk.level,
    reversible: true,
    requiresOwnerApproval: false,
    dependsOn: [...step.dependsOn],
  }));
}

function outcomeStepKind(kind: string): OutcomeStep["kind"] {
  if (kind === "isolated_code_preparation") return "agent";
  if (kind.endsWith("verification") || kind.endsWith("evidence")) return "workflow";
  return "deterministic";
}

export function admitPantavionRecoveryBuildCapsule(input: {
  capsule: PantavionRecoveryScopedBuildCapsule;
  readinessPacket: PantavionRecoveryBuildReadinessPacket;
  ownerReceipt: RecoveryBuildOwnerDecisionReceipt;
  technologyEntry: TechnologyLibraryEntry;
  agent: EphemeralAgent;
  grant: AgentBudgetGrant;
  edgePacket: DisconnectedExecutionPacket;
  edgePolicy: EdgeExecutionPolicy;
  consumedEdgeDigests: ReadonlySet<string>;
  estimatedCost: number;
  maximumEvidenceBytes: number;
  jurisdiction: string;
  legalConsentRecorded: boolean;
  legalConsentEvidenceDigest: string | null;
  observedAt: string;
  previousAdmissionDigest: string | null;
}): PantavionRecoveryBuildAdmission {
  validateSourceChain(input);
  if (!input.jurisdiction.trim()) throw new Error("recovery_admission_jurisdiction_required");
  if (
    !Number.isInteger(input.maximumEvidenceBytes) ||
    input.maximumEvidenceBytes < 1 ||
    input.maximumEvidenceBytes > MAX_EVIDENCE_BYTES
  ) {
    throw new Error("recovery_admission_evidence_budget_invalid");
  }
  if (input.previousAdmissionDigest !== null) {
    assertSha256("recovery_admission_previous_digest", input.previousAdmissionDigest);
  }
  if (input.legalConsentEvidenceDigest !== null) {
    assertSha256("recovery_admission_legal_consent_evidence", input.legalConsentEvidenceDigest);
  }

  const binding = derivePantavionRecoveryBuildAdmissionBinding(input.capsule);
  const technology = validateTechnology({
    capsule: input.capsule,
    entry: input.technologyEntry,
    observedAt: input.observedAt,
  });
  validateAgentAndBudget({
    capsule: input.capsule,
    binding,
    agent: input.agent,
    grant: input.grant,
    estimatedCost: input.estimatedCost,
    observedAt: input.observedAt,
  });
  validateEdge({
    capsule: input.capsule,
    ownerReceipt: input.ownerReceipt,
    binding,
    agent: input.agent,
    grant: input.grant,
    packet: input.edgePacket,
    policy: input.edgePolicy,
    consumedDigests: input.consumedEdgeDigests,
    observedAt: input.observedAt,
  });

  const steps = outcomeSteps(input.capsule);
  const intent = {
      id: binding.intentId,
      userId: input.ownerReceipt.ownerUserId,
      text: `Prepare ${input.capsule.buildOrderId} in an isolated Pantavion workspace`,
      desiredOutcome: `Produce reversible CODED evidence for ${binding.scope}`,
      jurisdiction: input.jurisdiction,
      maxCost: input.estimatedCost,
      deadlineAt: input.edgePacket.task.expiresAt,
  };
  const plan = compileOutcomePlan(intent, steps, input.estimatedCost, {
      ownerApprovalRisks: [],
      requireApprovalForIrreversible: true,
      maximumAutomaticCost: input.estimatedCost,
  });
  const firewall = evaluateIntentFirewall({
      intentId: binding.intentId,
      actorId: input.agent.id,
      actorKind: "system_agent",
      jurisdiction: input.jurisdiction,
      capabilities: [binding.capability],
      dataClasses: [...input.capsule.data.classes],
      estimatedCost: input.estimatedCost,
      risk: input.capsule.risk.level,
      reversible: true,
      legalConsentRecorded: input.legalConsentRecorded,
      writesProduction: false,
      publishesToUsers: false,
      sendsExternalMessage: false,
      changesIdentityOrAccess: false,
  }, {
      allowedJurisdictions: [input.jurisdiction],
      automaticCapabilities: [binding.capability],
      maximumAutomaticCost: input.estimatedCost,
      ownerApprovalRisks: [],
      requireConsentForSensitiveData: true,
      productionMutationMode: "deny",
      publicExposureMode: "deny",
  });
  const kernelBlockers = [...new Set([
    ...plan.blockers,
    ...firewall.reasons.filter((reason) => reason !== "policy_satisfied"),
  ])];
  let kernelDisposition: SovereignKernelDecision["disposition"] = "ready_for_bounded_execution";
  if (firewall.disposition === "deny" || plan.state === "blocked") {
    kernelDisposition = "denied";
  } else if (firewall.disposition === "owner_approval" || plan.requiresOwnerApproval) {
    kernelDisposition = "awaiting_owner";
  }
  const kernel: SovereignKernelDecision = {
    intentId: binding.intentId,
    disposition: kernelDisposition,
    firewall,
    plan,
    blockers: kernelBlockers,
    mayMerge: false as const,
    mayDeployProduction: false as const,
    mayPublishToUsers: false as const,
  };
  if (
    kernel.disposition !== "ready_for_bounded_execution" ||
    kernel.firewall.disposition !== "allow" ||
    kernel.plan.state !== "ready" ||
    kernel.plan.requiresOwnerApproval ||
    kernel.blockers.length
  ) {
    throw new Error(`recovery_admission_kernel_denied:${kernel.blockers.join(",") || kernel.firewall.reasons.join(",")}`);
  }
  const carriesSensitiveData = input.capsule.data.classes.some(
    (dataClass) => dataClass === "sensitive" || dataClass === "regulated",
  );
  if (carriesSensitiveData && input.legalConsentEvidenceDigest === null) {
    throw new Error("recovery_admission_legal_consent_evidence_required");
  }

  const boundedSession = createBoundedExecutionSession({
    id: binding.sessionId,
    decision: kernel,
    agent: input.agent,
    grant: input.grant,
    maximumEvidenceBytes: input.maximumEvidenceBytes,
    now: input.observedAt,
  });
  const sessionVerification = verifyBoundedExecutionSession(boundedSession);
  if (!sessionVerification.valid) {
    throw new Error(`recovery_admission_session_invalid:${sessionVerification.reasons.join(",")}`);
  }

  const validUntil = new Date(Math.min(
    Date.parse(input.agent.expiresAt),
    Date.parse(input.grant.expiresAt),
    Date.parse(input.edgePacket.task.expiresAt),
  )).toISOString();
  const admissionId = `recovery_admission_${sha256(canonicalJson({
    capsuleDigest: input.capsule.capsuleDigest,
    ownerReceiptDigest: input.ownerReceipt.receiptDigest,
    technologyEvidenceDigest: technology.evidenceDigest,
    agentId: input.agent.id,
    grantId: input.grant.id,
    edgePacketDigest: input.edgePacket.payloadDigest,
    observedAt: input.observedAt,
  }))}`;
  const unsigned = {
    marker: "pantavion_recovery_build_admission_v1" as const,
    disposition: "ready_for_isolated_bounded_execution" as const,
    admissionId,
    repository: "pandaconnect1/pantavion-planet" as const,
    baseRevision: input.capsule.baseRevision,
    observedAt: new Date(input.observedAt).toISOString(),
    validUntil,
    source: {
      readinessIndexDigest: input.capsule.readinessIndexDigest,
      buildOrderId: input.capsule.buildOrderId,
      buildOrderDigest: input.capsule.buildOrderDigest,
      readinessDigest: input.capsule.readinessDigest,
      capsuleDigest: input.capsule.capsuleDigest,
      ownerReceiptDigest: input.ownerReceipt.receiptDigest,
    },
    binding,
    technology,
    privacy: {
      dataClasses: [...input.capsule.data.classes],
      legalConsentRecorded: true as const,
      consentEvidenceDigest: input.legalConsentEvidenceDigest,
    },
    isolation: {
      workspaceId: input.capsule.isolation.workspaceId,
      sourceReadOnly: true as const,
      outputIsolated: true as const,
      networkAccess: false as const,
      secretsAvailable: false as const,
      productionCredentialsAvailable: false as const,
      productionDataAvailable: false as const,
    },
    edge: {
      packetDigest: input.edgePacket.payloadDigest,
      executionMode: "disconnected" as const,
      replayConsumed: false as const,
      networkRequired: false as const,
      productionWrite: false as const,
    },
    kernel,
    boundedSession,
    lifecycle: {
      sourceImplementationState: "IDEA" as const,
      nextPermittedEvidenceState: "CODED" as const,
      testedPromotionRequiresExternalEvidence: true as const,
      mergedPromotionRequiresExternalEvidence: true as const,
      deployedPromotionRequiresExternalEvidence: true as const,
      verifiedLivePromotionRequiresExternalEvidence: true as const,
    },
    authority: {
      isolatedCodePreparation: true as const,
      boundedSessionCreation: true as const,
      canonicalRepositoryWrite: false as const,
      productionWrite: false as const,
      merge: false as const,
      deployment: false as const,
      publicExposure: false as const,
      release: false as const,
    },
    previousAdmissionDigest: input.previousAdmissionDigest,
    completion: false as const,
  };
  const admission: PantavionRecoveryBuildAdmission = {
    ...unsigned,
    admissionDigest: sha256(canonicalJson(unsigned)),
  };
  if (!verifyPantavionRecoveryBuildAdmission(admission, input.observedAt)) {
    throw new Error("recovery_admission_self_verification_failed");
  }
  return admission;
}

export function verifyPantavionRecoveryBuildAdmission(
  admission: PantavionRecoveryBuildAdmission,
  now: string,
): boolean {
  try {
    const { admissionDigest, ...unsigned } = admission;
    assertSha256("recovery_admission_digest", admissionDigest);
    if (sha256(canonicalJson(unsigned)) !== admissionDigest) return false;
    if (
      admission.marker !== "pantavion_recovery_build_admission_v1" ||
      admission.disposition !== "ready_for_isolated_bounded_execution" ||
      admission.repository !== "pandaconnect1/pantavion-planet" ||
      !/^recovery_admission_[0-9a-f]{64}$/.test(admission.admissionId) ||
      !/^recovery_intent_[0-9a-f]{64}$/.test(admission.binding.intentId) ||
      !/^recovery_session_[0-9a-f]{64}$/.test(admission.binding.sessionId) ||
      !/^recovery_edge_task_[0-9a-f]{64}$/.test(admission.binding.edgeTaskId) ||
      !admission.binding.capability.trim() ||
      !admission.binding.scope.trim() ||
      admission.technology.assessment.readiness !== "prototype_ready" ||
      admission.technology.assessment.blockers.length !== 0 ||
      admission.technology.assessment.deploymentAuthorized !== false ||
      admission.privacy.legalConsentRecorded !== true ||
      admission.isolation.sourceReadOnly !== true ||
      admission.isolation.outputIsolated !== true ||
      admission.isolation.networkAccess !== false ||
      admission.isolation.secretsAvailable !== false ||
      admission.isolation.productionCredentialsAvailable !== false ||
      admission.isolation.productionDataAvailable !== false ||
      admission.edge.executionMode !== "disconnected" ||
      admission.edge.replayConsumed !== false ||
      admission.edge.networkRequired !== false ||
      admission.edge.productionWrite !== false ||
      admission.kernel.disposition !== "ready_for_bounded_execution" ||
      admission.kernel.firewall.disposition !== "allow" ||
      admission.kernel.firewall.auditRequired !== true ||
      !arraysEqual(admission.kernel.firewall.reasons, ["policy_satisfied"]) ||
      admission.kernel.blockers.length !== 0 ||
      admission.kernel.mayMerge !== false ||
      admission.kernel.mayDeployProduction !== false ||
      admission.kernel.mayPublishToUsers !== false ||
      admission.lifecycle.sourceImplementationState !== "IDEA" ||
      admission.lifecycle.nextPermittedEvidenceState !== "CODED" ||
      Object.values(admission.lifecycle).some((value) => value !== "IDEA" && value !== "CODED" && value !== true) ||
      admission.completion !== false
    ) return false;
    assertSha256("recovery_admission_capsule_digest", admission.source.capsuleDigest);
    assertSha256("recovery_admission_owner_receipt_digest", admission.source.ownerReceiptDigest);
    assertSha256("recovery_admission_technology_digest", admission.technology.evidenceDigest);
    assertSha256("recovery_admission_edge_digest", admission.edge.packetDigest);
    if (admission.privacy.consentEvidenceDigest !== null) {
      assertSha256("recovery_admission_legal_consent_evidence", admission.privacy.consentEvidenceDigest);
    }
    if (
      admission.privacy.dataClasses.some(
        (dataClass) => dataClass === "sensitive" || dataClass === "regulated",
      ) && admission.privacy.consentEvidenceDigest === null
    ) return false;
    if (admission.previousAdmissionDigest !== null) {
      assertSha256("recovery_admission_previous_digest", admission.previousAdmissionDigest);
    }
    const observedAt = assertTimestamp("recovery_admission_observed_at", admission.observedAt);
    const validUntil = assertTimestamp("recovery_admission_valid_until", admission.validUntil);
    const verifiedAt = assertTimestamp("recovery_admission_verified_at", now);
    if (
      validUntil <= observedAt ||
      validUntil - observedAt > MAX_ADMISSION_LIFETIME_MS ||
      verifiedAt < observedAt ||
      verifiedAt >= validUntil
    ) return false;
    if (
      admission.authority.isolatedCodePreparation !== true ||
      admission.authority.boundedSessionCreation !== true
    ) return false;
    for (const [key, value] of Object.entries(admission.authority)) {
      if (key === "isolatedCodePreparation" || key === "boundedSessionCreation") continue;
      if (value !== false) return false;
    }
    if (
      admission.boundedSession.id !== admission.binding.sessionId ||
      admission.boundedSession.intentId !== admission.binding.intentId ||
      admission.boundedSession.state !== "ready" ||
      admission.boundedSession.createdAt !== admission.observedAt ||
      admission.boundedSession.updatedAt !== admission.observedAt ||
      admission.boundedSession.completedStepIds.length !== 0 ||
      admission.boundedSession.receipts.length !== 0 ||
      admission.boundedSession.plan.steps.length !== 6 ||
      admission.boundedSession.plan.steps.some(
        (step) => step.capability !== admission.binding.capability || !step.reversible || step.requiresOwnerApproval,
      ) ||
      admission.kernel.intentId !== admission.binding.intentId ||
      canonicalJson(admission.kernel.plan) !== canonicalJson(admission.boundedSession.plan)
    ) return false;
    if (!/^recovery_workspace_[0-9a-f]{64}$/.test(admission.isolation.workspaceId)) return false;
    const bindingSeed = sha256(canonicalJson({
      repository: admission.repository,
      baseRevision: admission.baseRevision,
      buildOrderId: admission.source.buildOrderId,
      readinessDigest: admission.source.readinessDigest,
      capsuleDigest: admission.source.capsuleDigest,
      ownerReceiptDigest: admission.source.ownerReceiptDigest,
    }));
    if (
      admission.binding.intentId !== `recovery_intent_${bindingSeed}` ||
      admission.binding.sessionId !== `recovery_session_${sha256(`session|${bindingSeed}`)}` ||
      admission.binding.edgeTaskId !== `recovery_edge_task_${sha256(`edge|${bindingSeed}`)}`
    ) return false;
    const expectedAdmissionId = `recovery_admission_${sha256(canonicalJson({
      capsuleDigest: admission.source.capsuleDigest,
      ownerReceiptDigest: admission.source.ownerReceiptDigest,
      technologyEvidenceDigest: admission.technology.evidenceDigest,
      agentId: admission.boundedSession.agent.id,
      grantId: admission.boundedSession.grant.id,
      edgePacketDigest: admission.edge.packetDigest,
      observedAt: admission.observedAt,
    }))}`;
    if (admission.admissionId !== expectedAdmissionId) return false;
    const expectedSteps = [
      { id: "source_binding", dependsOn: [] },
      { id: "isolated_code_preparation", dependsOn: ["source_binding"] },
      { id: "unit_verification", dependsOn: ["isolated_code_preparation"] },
      { id: "security_verification", dependsOn: ["isolated_code_preparation"] },
      { id: "rollback_evidence", dependsOn: ["isolated_code_preparation"] },
      {
        id: "exact_revision_evidence",
        dependsOn: ["unit_verification", "security_verification", "rollback_evidence"],
      },
    ];
    if (admission.boundedSession.plan.steps.some((step, index) => {
      const expected = expectedSteps[index];
      return !expected || step.id !== expected.id || !arraysEqual(step.dependsOn, expected.dependsOn);
    })) return false;
    const sessionVerification = verifyBoundedExecutionSession(admission.boundedSession);
    return sessionVerification.valid;
  } catch {
    return false;
  }
}
