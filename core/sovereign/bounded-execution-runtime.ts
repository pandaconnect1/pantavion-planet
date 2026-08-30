import { createHash } from "node:crypto";

import type { AgentBudgetGrant, CapabilityAccess } from "./agent-capability-budget-control";
import type { EphemeralAgent } from "./ephemeral-agent-swarm";
import type { OutcomePlan, OutcomeStep } from "./intent-to-outcome-fabric";
import type { SovereignKernelDecision } from "./sovereign-capability-kernel";

export type BoundedExecutionSessionState = "ready" | "executing" | "completed" | "failed";

export interface BoundedExecutionReceipt {
  version: "pantavion_bounded_execution_receipt_v1";
  receiptId: string;
  sessionId: string;
  intentId: string;
  stepId: string;
  agentId: string;
  capability: string;
  scope: string;
  access: CapabilityAccess;
  cost: number;
  observedAt: string;
  outputDigest: string;
  outputDigestVerifiedFromBytes: true;
  auditReference: string;
  rollbackReference: string;
  planFingerprint: string;
  previousReceiptDigest: string | null;
  grantSpentBefore: number;
  grantSpentAfter: number;
  releaseAuthority: false;
  receiptDigest: string;
}

export interface BoundedExecutionSession {
  id: string;
  intentId: string;
  state: BoundedExecutionSessionState;
  plan: OutcomePlan;
  planFingerprint: string;
  agent: EphemeralAgent;
  grant: AgentBudgetGrant;
  initialGrantSpent: number;
  maximumEvidenceBytes: number;
  completedStepIds: string[];
  receipts: BoundedExecutionReceipt[];
  createdAt: string;
  updatedAt: string;
  failureReason?: string;
  mayMerge: false;
  mayDeployProduction: false;
  mayPublishToUsers: false;
}

export interface BoundedStepCompletionInput {
  sessionId: string;
  intentId: string;
  agentId: string;
  stepId: string;
  scope: string;
  access: CapabilityAccess;
  cost: number;
  observedAt: string;
  outputBytes: Uint8Array;
  auditReference: string;
  rollbackReference: string;
}

function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprintPlan(plan: OutcomePlan): string {
  return sha256(JSON.stringify(plan));
}

function digestReceipt(receipt: Omit<BoundedExecutionReceipt, "receiptDigest">): string {
  return sha256(JSON.stringify(receipt));
}

function parseTimestamp(value: string, label: string): number {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(label + " is invalid");
  return parsed;
}

interface BoundedCapabilityRequest {
  agentId: string;
  intentId: string;
  capability: string;
  scope: string;
  access: CapabilityAccess;
  cost: number;
  now: string;
}

function getExecutableBoundedSteps(plan: OutcomePlan, completedStepIds: string[]): OutcomeStep[] {
  if (!["ready", "executing", "verifying"].includes(plan.state)) return [];
  const completed = new Set(completedStepIds);
  return plan.steps.filter(
    (step) => !completed.has(step.id) && step.dependsOn.every((dependency) => completed.has(dependency)),
  );
}

function isBoundedOutcomeComplete(plan: OutcomePlan, completedStepIds: string[]): boolean {
  const completed = new Set(completedStepIds);
  return plan.steps.length > 0 && plan.steps.every((step) => completed.has(step.id));
}

function agentHasBoundedCapability(
  agent: EphemeralAgent,
  capability: string,
  scope: string,
  access: CapabilityAccess,
  observedAt: number,
): boolean {
  const agentExpiresAt = Date.parse(agent.expiresAt);
  if (
    agent.state !== "active" ||
    !capability.trim() ||
    !scope.trim() ||
    (access !== "read" && access !== "write") ||
    !Number.isFinite(observedAt) ||
    !Number.isFinite(agentExpiresAt) ||
    agentExpiresAt <= observedAt
  ) {
    return false;
  }
  return agent.capabilities.some((candidate) => {
    const capabilityExpiresAt = Date.parse(candidate.expiresAt);
    return (
      candidate.capability === capability &&
      candidate.scope === scope &&
      !(access === "write" && candidate.readOnly === true) &&
      Number.isFinite(capabilityExpiresAt) &&
      capabilityExpiresAt > observedAt &&
      capabilityExpiresAt <= agentExpiresAt
    );
  });
}

function authorizeBoundedCapability(
  grant: AgentBudgetGrant,
  request: BoundedCapabilityRequest,
): { allowed: boolean; reasons: string[]; remainingBudget: number } {
  const reasons: string[] = [];
  const now = Date.parse(request.now);
  const issuedAt = Date.parse(grant.issuedAt);
  const expiresAt = Date.parse(grant.expiresAt);
  const validBudget = Number.isFinite(grant.budgetLimit) && grant.budgetLimit >= 0;
  const validSpend =
    Number.isFinite(grant.spent) &&
    grant.spent >= 0 &&
    validBudget &&
    grant.spent <= grant.budgetLimit;
  const remainingBudget = validBudget && validSpend
    ? Math.max(0, grant.budgetLimit - grant.spent)
    : 0;

  if (!grant.id.trim() || !grant.agentId.trim() || !grant.intentId.trim()) reasons.push("grant_identity_invalid");
  if (grant.state !== "active") reasons.push("grant_" + grant.state);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(expiresAt) || expiresAt <= issuedAt) {
    reasons.push("grant_time_invalid");
  }
  if (!Number.isFinite(now)) reasons.push("invalid_request_time");
  else {
    if (Number.isFinite(issuedAt) && now < issuedAt) reasons.push("grant_not_yet_active");
    if (Number.isFinite(expiresAt) && expiresAt <= now) reasons.push("grant_expired");
  }
  if (!validBudget) reasons.push("grant_budget_invalid");
  if (!validSpend) reasons.push("grant_spend_invalid");
  if (!request.agentId.trim() || request.agentId !== grant.agentId) reasons.push("agent_scope_mismatch");
  if (!request.intentId.trim() || request.intentId !== grant.intentId) reasons.push("intent_scope_mismatch");
  if (!request.capability.trim() || !request.scope.trim()) reasons.push("capability_request_invalid");
  if (request.access !== "read" && request.access !== "write") reasons.push("access_invalid");
  if (!Number.isFinite(request.cost) || request.cost < 0) reasons.push("invalid_cost");

  const scoped = grant.capabilities.find(
    (candidate) =>
      candidate.capability === request.capability &&
      candidate.scope === request.scope,
  );
  if (!scoped) reasons.push("capability_or_scope_not_granted");
  else if (request.access === "write" && scoped.access !== "write") reasons.push("write_not_granted");

  if (Number.isFinite(request.cost) && request.cost >= 0 && request.cost > remainingBudget) {
    reasons.push("budget_exceeded");
  }
  return { allowed: reasons.length === 0, reasons: [...new Set(reasons)], remainingBudget };
}

function consumeBoundedBudget(
  grant: AgentBudgetGrant,
  request: BoundedCapabilityRequest,
): AgentBudgetGrant {
  const decision = authorizeBoundedCapability(grant, request);
  if (!decision.allowed) throw new Error("agent authorization denied:" + decision.reasons.join(","));
  return { ...grant, spent: grant.spent + request.cost };
}

function assertDecisionIsBounded(decision: SovereignKernelDecision) {
  if (decision.disposition !== "ready_for_bounded_execution") {
    throw new Error("kernel decision is not ready for bounded execution");
  }
  if (decision.firewall.disposition !== "allow") {
    throw new Error("firewall has not authorized bounded execution");
  }
  if (decision.plan.state !== "ready" || decision.plan.blockers.length) {
    throw new Error("outcome plan is not ready");
  }
  if (decision.plan.requiresOwnerApproval) {
    throw new Error("owner approval remains required");
  }
  if (decision.mayMerge || decision.mayDeployProduction || decision.mayPublishToUsers) {
    throw new Error("kernel decision contains protected release authority");
  }
  for (const step of decision.plan.steps) {
    if (!step.reversible) throw new Error("bounded execution requires reversible steps");
    if (step.requiresOwnerApproval || step.kind === "human_approval") {
      throw new Error("owner-controlled steps cannot enter bounded execution");
    }
  }
}

export function createBoundedExecutionSession(input: {
  id: string;
  decision: SovereignKernelDecision;
  agent: EphemeralAgent;
  grant: AgentBudgetGrant;
  maximumEvidenceBytes: number;
  now: string;
}): BoundedExecutionSession {
  if (!input.id.trim()) throw new Error("session identity is required");
  if (!Number.isInteger(input.maximumEvidenceBytes) || input.maximumEvidenceBytes < 0) {
    throw new Error("maximumEvidenceBytes must be a non-negative integer");
  }
  assertDecisionIsBounded(input.decision);

  const now = parseTimestamp(input.now, "session time");
  const agentCreatedAt = parseTimestamp(input.agent.createdAt, "agent createdAt");
  const agentExpiresAt = parseTimestamp(input.agent.expiresAt, "agent expiresAt");
  const grantIssuedAt = parseTimestamp(input.grant.issuedAt, "grant issuedAt");
  const grantExpiresAt = parseTimestamp(input.grant.expiresAt, "grant expiresAt");

  if (
    input.decision.intentId !== input.decision.plan.intentId ||
    input.agent.parentIntentId !== input.decision.intentId ||
    input.grant.intentId !== input.decision.intentId
  ) {
    throw new Error("session intent identity mismatch");
  }
  if (input.grant.agentId !== input.agent.id) throw new Error("session agent identity mismatch");
  if (input.agent.state !== "active" || now < agentCreatedAt || now >= agentExpiresAt) {
    throw new Error("agent is not active within its authorized lifetime");
  }
  if (
    input.grant.state !== "active" ||
    now < grantIssuedAt ||
    now >= grantExpiresAt ||
    !Number.isFinite(input.grant.budgetLimit) ||
    !Number.isFinite(input.grant.spent) ||
    input.grant.spent < 0 ||
    input.grant.spent > input.grant.budgetLimit
  ) {
    throw new Error("grant is not active within its authorized budget and lifetime");
  }

  return {
    id: input.id,
    intentId: input.decision.intentId,
    state: "ready",
    plan: input.decision.plan,
    planFingerprint: fingerprintPlan(input.decision.plan),
    agent: input.agent,
    grant: input.grant,
    initialGrantSpent: input.grant.spent,
    maximumEvidenceBytes: input.maximumEvidenceBytes,
    completedStepIds: [],
    receipts: [],
    createdAt: input.now,
    updatedAt: input.now,
    mayMerge: false,
    mayDeployProduction: false,
    mayPublishToUsers: false,
  };
}

function findExecutableStep(session: BoundedExecutionSession, stepId: string): OutcomeStep {
  const executable = getExecutableBoundedSteps(session.plan, session.completedStepIds);
  const step = executable.find((candidate) => candidate.id === stepId);
  if (!step) throw new Error("step is not dependency-ready:" + stepId);
  return step;
}

export function recordBoundedStepCompletion(
  session: BoundedExecutionSession,
  input: BoundedStepCompletionInput,
): BoundedExecutionSession {
  if (session.state === "completed" || session.state === "failed") {
    throw new Error("session cannot accept additional completions");
  }
  if (
    input.sessionId !== session.id ||
    input.intentId !== session.intentId ||
    input.agentId !== session.agent.id
  ) {
    throw new Error("completion identity mismatch");
  }
  if (!input.scope.trim()) throw new Error("completion scope is required");
  if (!input.auditReference.trim()) throw new Error("audit reference is required");
  if (!input.rollbackReference.trim()) throw new Error("rollback reference is required");
  if (!(input.outputBytes instanceof Uint8Array)) throw new Error("output bytes are required");
  if (input.outputBytes.byteLength > session.maximumEvidenceBytes) {
    throw new Error("execution evidence exceeds session policy");
  }

  const observedAt = parseTimestamp(input.observedAt, "completion observedAt");
  const createdAt = parseTimestamp(session.createdAt, "session createdAt");
  const updatedAt = parseTimestamp(session.updatedAt, "session updatedAt");
  if (observedAt < createdAt || observedAt < updatedAt) {
    throw new Error("completion time must be monotonic");
  }

  const step = findExecutableStep(session, input.stepId);
  if (!step.reversible || step.requiresOwnerApproval || step.kind === "human_approval") {
    throw new Error("step is outside bounded execution authority");
  }
  if (
    !agentHasBoundedCapability(
      session.agent,
      step.capability,
      input.scope,
      input.access,
      observedAt,
    )
  ) {
    throw new Error("ephemeral agent capability denied");
  }

  const authorizationRequest = {
    agentId: session.agent.id,
    intentId: session.intentId,
    capability: step.capability,
    scope: input.scope,
    access: input.access,
    cost: input.cost,
    now: input.observedAt,
  };
  const authorization = authorizeBoundedCapability(session.grant, authorizationRequest);
  if (!authorization.allowed) {
    throw new Error("budget authorization denied:" + authorization.reasons.join(","));
  }
  const updatedGrant = consumeBoundedBudget(session.grant, authorizationRequest);
  const outputDigest = sha256(input.outputBytes);
  const previousReceiptDigest = session.receipts.at(-1)?.receiptDigest ?? null;
  const receiptId = sha256(
    [
      session.id,
      step.id,
      input.observedAt,
      outputDigest,
      previousReceiptDigest ?? "root",
    ].join("|"),
  ).slice(0, 32);

  const receiptWithoutDigest: Omit<BoundedExecutionReceipt, "receiptDigest"> = {
    version: "pantavion_bounded_execution_receipt_v1",
    receiptId,
    sessionId: session.id,
    intentId: session.intentId,
    stepId: step.id,
    agentId: session.agent.id,
    capability: step.capability,
    scope: input.scope,
    access: input.access,
    cost: input.cost,
    observedAt: input.observedAt,
    outputDigest,
    outputDigestVerifiedFromBytes: true,
    auditReference: input.auditReference,
    rollbackReference: input.rollbackReference,
    planFingerprint: session.planFingerprint,
    previousReceiptDigest,
    grantSpentBefore: session.grant.spent,
    grantSpentAfter: updatedGrant.spent,
    releaseAuthority: false,
  };
  const receipt: BoundedExecutionReceipt = {
    ...receiptWithoutDigest,
    receiptDigest: digestReceipt(receiptWithoutDigest),
  };
  const completedStepIds = [...session.completedStepIds, step.id];
  const nextSession: BoundedExecutionSession = {
    ...session,
    state: isBoundedOutcomeComplete(session.plan, completedStepIds) ? "completed" : "executing",
    grant: updatedGrant,
    completedStepIds,
    receipts: [...session.receipts, receipt],
    updatedAt: input.observedAt,
  };
  const verification = verifyBoundedExecutionSession(nextSession);
  if (!verification.valid) {
    throw new Error("bounded execution receipt verification failed:" + verification.reasons.join(","));
  }
  return nextSession;
}

export function failBoundedExecutionSession(
  session: BoundedExecutionSession,
  failureReason: string,
  observedAt: string,
): BoundedExecutionSession {
  if (!failureReason.trim()) throw new Error("failure reason is required");
  const failureTime = parseTimestamp(observedAt, "failure observedAt");
  if (failureTime < parseTimestamp(session.updatedAt, "session updatedAt")) {
    throw new Error("failure time must be monotonic");
  }
  if (session.state === "completed") throw new Error("completed sessions cannot be failed");
  return {
    ...session,
    state: "failed",
    failureReason,
    updatedAt: observedAt,
    mayMerge: false,
    mayDeployProduction: false,
    mayPublishToUsers: false,
  };
}

export function verifyBoundedExecutionSession(
  session: BoundedExecutionSession,
): { valid: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const completed = new Set<string>();
  let previousReceiptDigest: string | null = null;
  let expectedSpend = session.initialGrantSpent;
  let previousObservedAt = Date.parse(session.createdAt);

  if (!session.id.trim() || !session.intentId.trim()) reasons.push("session_identity_invalid");
  if (session.plan.intentId !== session.intentId) reasons.push("plan_intent_mismatch");
  if (session.agent.parentIntentId !== session.intentId) reasons.push("agent_intent_mismatch");
  if (session.grant.agentId !== session.agent.id || session.grant.intentId !== session.intentId) {
    reasons.push("grant_identity_mismatch");
  }
  if (session.planFingerprint !== fingerprintPlan(session.plan)) reasons.push("plan_fingerprint_mismatch");
  if (
    session.mayMerge !== false ||
    session.mayDeployProduction !== false ||
    session.mayPublishToUsers !== false
  ) {
    reasons.push("protected_release_authority_present");
  }

  for (const receipt of session.receipts) {
    const { receiptDigest, ...receiptWithoutDigest } = receipt;
    const step = session.plan.steps.find((candidate) => candidate.id === receipt.stepId);
    const observedAt = Date.parse(receipt.observedAt);

    if (receipt.version !== "pantavion_bounded_execution_receipt_v1") reasons.push("receipt_version_invalid");
    if (
      receipt.sessionId !== session.id ||
      receipt.intentId !== session.intentId ||
      receipt.agentId !== session.agent.id
    ) {
      reasons.push("receipt_identity_mismatch");
    }
    if (!step || receipt.capability !== step.capability) reasons.push("receipt_step_mismatch");
    else if (!step.dependsOn.every((dependency) => completed.has(dependency))) {
      reasons.push("receipt_dependency_order_invalid");
    }
    if (completed.has(receipt.stepId)) reasons.push("duplicate_step_receipt");
    if (receipt.planFingerprint !== session.planFingerprint) reasons.push("receipt_plan_mismatch");
    if (receipt.previousReceiptDigest !== previousReceiptDigest) reasons.push("receipt_chain_broken");
    if (receiptDigest !== digestReceipt(receiptWithoutDigest)) reasons.push("receipt_digest_mismatch");
    if (!receipt.outputDigestVerifiedFromBytes || !/^[a-f0-9]{64}$/i.test(receipt.outputDigest)) {
      reasons.push("output_digest_invalid");
    }
    if (!receipt.auditReference.trim() || !receipt.rollbackReference.trim()) {
      reasons.push("receipt_evidence_missing");
    }
    if (!Number.isFinite(receipt.cost) || receipt.cost < 0) reasons.push("receipt_cost_invalid");
    if (
      !Number.isFinite(receipt.grantSpentBefore) ||
      !Number.isFinite(receipt.grantSpentAfter) ||
      receipt.grantSpentBefore !== expectedSpend ||
      receipt.grantSpentAfter !== receipt.grantSpentBefore + receipt.cost
    ) {
      reasons.push("receipt_budget_chain_invalid");
    }
    if (!Number.isFinite(observedAt) || observedAt < previousObservedAt) {
      reasons.push("receipt_time_invalid");
    }
    if (receipt.releaseAuthority !== false) reasons.push("receipt_release_authority_present");

    completed.add(receipt.stepId);
    expectedSpend = receipt.grantSpentAfter;
    previousObservedAt = observedAt;
    previousReceiptDigest = receipt.receiptDigest;
  }

  if (
    session.completedStepIds.length !== completed.size ||
    session.completedStepIds.some((stepId) => !completed.has(stepId))
  ) {
    reasons.push("completed_steps_mismatch");
  }
  if (session.grant.spent !== expectedSpend) reasons.push("session_budget_mismatch");
  const outcomeComplete = isBoundedOutcomeComplete(session.plan, session.completedStepIds);
  if (session.state === "completed" && !outcomeComplete) reasons.push("false_completed_state");
  if (outcomeComplete && session.state !== "completed") reasons.push("completed_outcome_state_mismatch");
  if (session.state === "failed" && !session.failureReason?.trim()) reasons.push("failed_state_without_reason");

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}

export interface BoundedExecutionCheckpoint {
  version: "pantavion_bounded_execution_checkpoint_v1";
  checkpointId: string;
  sessionId: string;
  intentId: string;
  agentId: string;
  planFingerprint: string;
  sequence: number;
  fencingToken: number;
  workerId: string;
  observedAt: string;
  previousCheckpointDigest: string | null;
  lastReceiptDigest: string | null;
  sessionDigest: string;
  session: BoundedExecutionSession;
  releaseAuthority: false;
  checkpointDigest: string;
}

export interface BoundedExecutionRestoreExpectation {
  sessionId: string;
  intentId: string;
  agentId: string;
  planFingerprint: string;
  trustedCheckpointDigest: string;
  minimumSequence: number;
  minimumFencingToken: number;
}

function cloneBoundedExecutionSession(
  session: BoundedExecutionSession,
): BoundedExecutionSession {
  return {
    ...session,
    plan: {
      ...session.plan,
      steps: session.plan.steps.map((step) => ({
        ...step,
        dependsOn: [...step.dependsOn],
      })),
      blockers: [...session.plan.blockers],
    },
    agent: {
      ...session.agent,
      capabilities: session.agent.capabilities.map((capability) => ({
        ...capability,
      })),
    },
    grant: {
      ...session.grant,
      capabilities: session.grant.capabilities.map((capability) => ({
        ...capability,
      })),
    },
    completedStepIds: [...session.completedStepIds],
    receipts: session.receipts.map((receipt) => ({ ...receipt })),
  };
}

function digestBoundedSession(session: BoundedExecutionSession): string {
  return sha256(JSON.stringify(session));
}

function digestCheckpoint(
  checkpoint: Omit<BoundedExecutionCheckpoint, "checkpointDigest">,
): string {
  return sha256(JSON.stringify(checkpoint));
}

function expectedCheckpointId(
  input: Pick<
    BoundedExecutionCheckpoint,
    | "sessionId"
    | "sequence"
    | "fencingToken"
    | "workerId"
    | "observedAt"
    | "previousCheckpointDigest"
    | "sessionDigest"
  >,
): string {
  return sha256(
    [
      input.sessionId,
      String(input.sequence),
      String(input.fencingToken),
      input.workerId,
      input.observedAt,
      input.previousCheckpointDigest ?? "root",
      input.sessionDigest,
    ].join("|"),
  ).slice(0, 32);
}


function validateCheckpointIntegrity(
  checkpoint: BoundedExecutionCheckpoint,
): string[] {
  const reasons: string[] = [];
  const observedAt = Date.parse(checkpoint.observedAt);
  const sessionUpdatedAt = Date.parse(checkpoint.session.updatedAt);
  const sessionVerification = verifyBoundedExecutionSession(checkpoint.session);
  const { checkpointDigest, ...withoutDigest } = checkpoint;
  const expectedLastReceiptDigest =
    checkpoint.session.receipts.at(-1)?.receiptDigest ?? null;

  if (checkpoint.version !== "pantavion_bounded_execution_checkpoint_v1") {
    reasons.push("checkpoint_version_invalid");
  }
  if (
    !checkpoint.checkpointId.trim() ||
    !checkpoint.sessionId.trim() ||
    !checkpoint.intentId.trim() ||
    !checkpoint.agentId.trim() ||
    !checkpoint.workerId.trim()
  ) {
    reasons.push("checkpoint_identity_invalid");
  }
  if (!Number.isInteger(checkpoint.sequence) || checkpoint.sequence < 1) {
    reasons.push("checkpoint_sequence_invalid");
  }
  if (!Number.isInteger(checkpoint.fencingToken) || checkpoint.fencingToken < 1) {
    reasons.push("checkpoint_fence_invalid");
  }
  if (
    checkpoint.sessionId !== checkpoint.session.id ||
    checkpoint.intentId !== checkpoint.session.intentId ||
    checkpoint.agentId !== checkpoint.session.agent.id
  ) {
    reasons.push("checkpoint_session_identity_mismatch");
  }
  if (
    checkpoint.planFingerprint !== checkpoint.session.planFingerprint ||
    checkpoint.planFingerprint !== fingerprintPlan(checkpoint.session.plan)
  ) {
    reasons.push("checkpoint_plan_mismatch");
  }
  if (
    !Number.isFinite(observedAt) ||
    !Number.isFinite(sessionUpdatedAt) ||
    observedAt < sessionUpdatedAt
  ) {
    reasons.push("checkpoint_time_invalid");
  }
  if (checkpoint.sequence === 1 && checkpoint.previousCheckpointDigest !== null) {
    reasons.push("checkpoint_root_predecessor_present");
  }
  if (checkpoint.sequence > 1 && !checkpoint.previousCheckpointDigest?.trim()) {
    reasons.push("checkpoint_predecessor_missing");
  }
  if (checkpoint.lastReceiptDigest !== expectedLastReceiptDigest) {
    reasons.push("checkpoint_receipt_head_mismatch");
  }
  if (checkpoint.sessionDigest !== digestBoundedSession(checkpoint.session)) {
    reasons.push("checkpoint_session_digest_mismatch");
  }
  if (
    checkpoint.checkpointId !==
    expectedCheckpointId({
      sessionId: checkpoint.sessionId,
      sequence: checkpoint.sequence,
      fencingToken: checkpoint.fencingToken,
      workerId: checkpoint.workerId,
      observedAt: checkpoint.observedAt,
      previousCheckpointDigest: checkpoint.previousCheckpointDigest,
      sessionDigest: checkpoint.sessionDigest,
    })
  ) {
    reasons.push("checkpoint_id_mismatch");
  }
  if (checkpoint.releaseAuthority !== false) {
    reasons.push("checkpoint_release_authority_present");
  }
  if (checkpointDigest !== digestCheckpoint(withoutDigest)) {
    reasons.push("checkpoint_digest_mismatch");
  }
  reasons.push(
    ...sessionVerification.reasons.map(
      (reason) => "checkpoint_session_invalid:" + reason,
    ),
  );
  return [...new Set(reasons)];
}

export function verifyBoundedExecutionCheckpoint(
  checkpoint: BoundedExecutionCheckpoint,
  previous?: BoundedExecutionCheckpoint,
): { valid: boolean; reasons: string[] } {
  const reasons = validateCheckpointIntegrity(checkpoint);
  if (previous) {
    reasons.push(
      ...validateCheckpointIntegrity(previous).map(
        (reason) => "checkpoint_predecessor_invalid:" + reason,
      ),
    );
    if (
      checkpoint.sessionId !== previous.sessionId ||
      checkpoint.intentId !== previous.intentId ||
      checkpoint.agentId !== previous.agentId ||
      checkpoint.planFingerprint !== previous.planFingerprint
    ) {
      reasons.push("checkpoint_chain_identity_mismatch");
    }
    if (checkpoint.sequence !== previous.sequence + 1) {
      reasons.push("checkpoint_chain_sequence_invalid");
    }
    if (checkpoint.previousCheckpointDigest !== previous.checkpointDigest) {
      reasons.push("checkpoint_chain_digest_mismatch");
    }
    if (checkpoint.fencingToken < previous.fencingToken) {
      reasons.push("checkpoint_chain_fence_regressed");
    }
    if (
      checkpoint.workerId !== previous.workerId &&
      checkpoint.fencingToken <= previous.fencingToken
    ) {
      reasons.push("checkpoint_failover_fence_not_advanced");
    }
    if (Date.parse(checkpoint.observedAt) < Date.parse(previous.observedAt)) {
      reasons.push("checkpoint_chain_time_regressed");
    }
  }
  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}


export function createBoundedExecutionCheckpoint(input: {
  session: BoundedExecutionSession;
  sequence: number;
  fencingToken: number;
  workerId: string;
  observedAt: string;
  previous?: BoundedExecutionCheckpoint;
}): BoundedExecutionCheckpoint {
  if (!input.workerId.trim()) throw new Error("checkpoint worker identity is required");
  if (!Number.isInteger(input.sequence) || input.sequence < 1) {
    throw new Error("checkpoint sequence must be a positive integer");
  }
  if (!Number.isInteger(input.fencingToken) || input.fencingToken < 1) {
    throw new Error("checkpoint fencing token must be a positive integer");
  }

  const session = cloneBoundedExecutionSession(input.session);
  const sessionVerification = verifyBoundedExecutionSession(session);
  if (!sessionVerification.valid) {
    throw new Error(
      "checkpoint session verification failed:" + sessionVerification.reasons.join(","),
    );
  }
  const observedAt = parseTimestamp(input.observedAt, "checkpoint observedAt");
  if (observedAt < parseTimestamp(session.updatedAt, "session updatedAt")) {
    throw new Error("checkpoint time must not precede session state");
  }
  if (!input.previous && input.sequence !== 1) {
    throw new Error("root checkpoint sequence must be one");
  }
  if (input.previous && input.sequence !== input.previous.sequence + 1) {
    throw new Error("checkpoint sequence must advance exactly once");
  }

  const sessionDigest = digestBoundedSession(session);
  const previousCheckpointDigest = input.previous?.checkpointDigest ?? null;
  const checkpointId = expectedCheckpointId({
    sessionId: session.id,
    sequence: input.sequence,
    fencingToken: input.fencingToken,
    workerId: input.workerId,
    observedAt: input.observedAt,
    previousCheckpointDigest,
    sessionDigest,
  });
  const checkpointWithoutDigest: Omit<
    BoundedExecutionCheckpoint,
    "checkpointDigest"
  > = {
    version: "pantavion_bounded_execution_checkpoint_v1",
    checkpointId,
    sessionId: session.id,
    intentId: session.intentId,
    agentId: session.agent.id,
    planFingerprint: session.planFingerprint,
    sequence: input.sequence,
    fencingToken: input.fencingToken,
    workerId: input.workerId,
    observedAt: input.observedAt,
    previousCheckpointDigest,
    lastReceiptDigest: session.receipts.at(-1)?.receiptDigest ?? null,
    sessionDigest,
    session,
    releaseAuthority: false,
  };
  const checkpoint: BoundedExecutionCheckpoint = {
    ...checkpointWithoutDigest,
    checkpointDigest: digestCheckpoint(checkpointWithoutDigest),
  };
  const verification = verifyBoundedExecutionCheckpoint(
    checkpoint,
    input.previous,
  );
  if (!verification.valid) {
    throw new Error(
      "bounded execution checkpoint verification failed:" +
        verification.reasons.join(","),
    );
  }
  return checkpoint;
}

export function restoreBoundedExecutionSession(
  checkpoint: BoundedExecutionCheckpoint,
  expectation: BoundedExecutionRestoreExpectation,
): BoundedExecutionSession {
  const verification = verifyBoundedExecutionCheckpoint(checkpoint);
  if (!verification.valid) {
    throw new Error(
      "checkpoint restore verification failed:" + verification.reasons.join(","),
    );
  }
  if (
    !expectation.sessionId.trim() ||
    !expectation.intentId.trim() ||
    !expectation.agentId.trim() ||
    !expectation.planFingerprint.trim() ||
    !expectation.trustedCheckpointDigest.trim()
  ) {
    throw new Error("checkpoint restore expectation is incomplete");
  }
  if (
    !Number.isInteger(expectation.minimumSequence) ||
    expectation.minimumSequence < 1 ||
    !Number.isInteger(expectation.minimumFencingToken) ||
    expectation.minimumFencingToken < 1
  ) {
    throw new Error("checkpoint restore floor is invalid");
  }
  if (
    checkpoint.sessionId !== expectation.sessionId ||
    checkpoint.intentId !== expectation.intentId ||
    checkpoint.agentId !== expectation.agentId ||
    checkpoint.planFingerprint !== expectation.planFingerprint
  ) {
    throw new Error("checkpoint restore identity mismatch");
  }
  if (checkpoint.checkpointDigest !== expectation.trustedCheckpointDigest) {
    throw new Error("checkpoint is not the trusted recovery head");
  }
  if (
    checkpoint.sequence < expectation.minimumSequence ||
    checkpoint.fencingToken < expectation.minimumFencingToken
  ) {
    throw new Error("checkpoint is stale or fenced");
  }

  const session = cloneBoundedExecutionSession(checkpoint.session);
  const sessionVerification = verifyBoundedExecutionSession(session);
  if (!sessionVerification.valid) {
    throw new Error(
      "restored session verification failed:" + sessionVerification.reasons.join(","),
    );
  }
  return session;
}
