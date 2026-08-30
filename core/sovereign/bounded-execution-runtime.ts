import { createHash } from "node:crypto";

import {
  authorizeAgentCapability,
  consumeAuthorizedBudget,
  type AgentBudgetGrant,
  type CapabilityAccess,
} from "./agent-capability-budget-control.ts";
import {
  canAgentUseCapability,
  type EphemeralAgent,
} from "./ephemeral-agent-swarm.ts";
import {
  getExecutableSteps,
  isOutcomeComplete,
  type OutcomePlan,
  type OutcomeStep,
} from "./intent-to-outcome-fabric.ts";
import type { SovereignKernelDecision } from "./sovereign-capability-kernel.ts";

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
  const executable = getExecutableSteps(session.plan, session.completedStepIds);
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
    !canAgentUseCapability(
      session.agent,
      step.capability,
      input.scope,
      new Date(observedAt),
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
  const authorization = authorizeAgentCapability(session.grant, authorizationRequest);
  if (!authorization.allowed) {
    throw new Error("budget authorization denied:" + authorization.reasons.join(","));
  }
  const updatedGrant = consumeAuthorizedBudget(session.grant, authorizationRequest);
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
    state: isOutcomeComplete(session.plan, completedStepIds) ? "completed" : "executing",
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
  const outcomeComplete = isOutcomeComplete(session.plan, session.completedStepIds);
  if (session.state === "completed" && !outcomeComplete) reasons.push("false_completed_state");
  if (outcomeComplete && session.state !== "completed") reasons.push("completed_outcome_state_mismatch");
  if (session.state === "failed" && !session.failureReason?.trim()) reasons.push("failed_state_without_reason");

  return { valid: reasons.length === 0, reasons: [...new Set(reasons)] };
}
