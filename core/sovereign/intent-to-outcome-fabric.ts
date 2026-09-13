export type OutcomeRisk = "low" | "medium" | "high" | "critical";
export type OutcomeStepKind = "deterministic" | "model" | "agent" | "workflow" | "human_approval";
export type OutcomeState = "planned" | "ready" | "blocked" | "executing" | "verifying" | "completed" | "failed";

export interface UserIntent {
  id: string;
  userId: string;
  text: string;
  desiredOutcome: string;
  jurisdiction?: string;
  maxCost?: number;
  deadlineAt?: string;
}

export interface OutcomeStep {
  id: string;
  title: string;
  kind: OutcomeStepKind;
  capability: string;
  risk: OutcomeRisk;
  reversible: boolean;
  requiresOwnerApproval: boolean;
  dependsOn: string[];
}

export interface OutcomePlan {
  intentId: string;
  state: OutcomeState;
  steps: OutcomeStep[];
  blockers: string[];
  estimatedCost: number;
  requiresOwnerApproval: boolean;
}

export interface OutcomePolicy {
  ownerApprovalRisks: OutcomeRisk[];
  requireApprovalForIrreversible: boolean;
  maximumAutomaticCost: number;
}

export interface OutcomeExecutionEvidence {
  stepId: string;
  artifactIds: string[];
  evidenceIds: string[];
  verified: boolean;
  recordedAt: string;
}

export interface OutcomeLifecycleAudit {
  state: OutcomeState;
  executableStepIds: string[];
  missingArtifactStepIds: string[];
  missingEvidenceStepIds: string[];
  unverifiedStepIds: string[];
  blockers: string[];
  canClaimComplete: boolean;
}

function hasDependencyCycle(steps: OutcomeStep[]): boolean {
  const graph = new Map<string, string[]>();
  for (const step of steps) {
    if (!graph.has(step.id)) graph.set(step.id, step.dependsOn.filter((dependency) => dependency !== step.id));
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const dependency of graph.get(id) ?? []) {
      if (graph.has(dependency) && visit(dependency)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };

  return [...graph.keys()].some(visit);
}

export function compileOutcomePlan(
  intent: UserIntent,
  candidateSteps: OutcomeStep[],
  estimatedCost: number,
  policy: OutcomePolicy,
): OutcomePlan {
  if (!intent.id.trim() || !intent.userId.trim()) throw new Error("intent and user identities are required");
  if (!intent.text.trim()) throw new Error("original intent text is required");
  if (!intent.desiredOutcome.trim()) throw new Error("desiredOutcome is required");
  if (!Number.isFinite(estimatedCost) || estimatedCost < 0) throw new Error("estimatedCost must be finite and non-negative");
  if (!Number.isFinite(policy.maximumAutomaticCost) || policy.maximumAutomaticCost < 0) throw new Error("maximumAutomaticCost must be finite and non-negative");
  if (intent.maxCost != null && (!Number.isFinite(intent.maxCost) || intent.maxCost < 0)) throw new Error("intent maxCost must be finite and non-negative");
  if (intent.deadlineAt != null && !Number.isFinite(Date.parse(intent.deadlineAt))) throw new Error("intent deadlineAt is invalid");

  const blockers: string[] = [];
  const seen = new Set<string>();
  if (!candidateSteps.length) blockers.push("outcome_steps_missing");

  for (const [index, step] of candidateSteps.entries()) {
    const identity = step.id.trim() || String(index);
    if (!step.id.trim() || !step.title.trim() || !step.capability.trim()) blockers.push("invalid_step_identity:" + identity);
    if (seen.has(step.id)) blockers.push("duplicate_step:" + step.id);
    seen.add(step.id);
    if (step.dependsOn.includes(step.id)) blockers.push("self_dependency:" + step.id);
    for (const dependency of step.dependsOn) {
      if (!candidateSteps.some((candidate) => candidate.id === dependency)) blockers.push("missing_dependency:" + step.id + ":" + dependency);
    }
  }
  if (hasDependencyCycle(candidateSteps)) blockers.push("dependency_cycle_detected");

  const approvalByRisk = candidateSteps.some((step) => policy.ownerApprovalRisks.includes(step.risk));
  const approvalByIrreversibility = policy.requireApprovalForIrreversible && candidateSteps.some((step) => !step.reversible);
  const approvalByCost = estimatedCost > policy.maximumAutomaticCost;
  const requiresOwnerApproval = approvalByRisk || approvalByIrreversibility || approvalByCost || candidateSteps.some((step) => step.requiresOwnerApproval);
  if (intent.maxCost != null && estimatedCost > intent.maxCost) blockers.push("intent_cost_limit_exceeded");

  return { intentId: intent.id, state: blockers.length ? "blocked" : "ready", steps: candidateSteps, blockers: [...new Set(blockers)], estimatedCost, requiresOwnerApproval };
}

export function getExecutableSteps(plan: OutcomePlan, completedStepIds: string[]): OutcomeStep[] {
  const executableStates: OutcomeState[] = ["ready", "executing", "verifying"];
  if (!executableStates.includes(plan.state)) return [];
  const completed = new Set(completedStepIds);
  return plan.steps.filter((step) => !completed.has(step.id) && step.dependsOn.every((dependency) => completed.has(dependency)));
}

export function auditOutcomeLifecycle(
  plan: OutcomePlan,
  completedStepIds: string[],
  evidence: OutcomeExecutionEvidence[],
): OutcomeLifecycleAudit {
  const completed = new Set(completedStepIds);
  const evidenceByStep = new Map(evidence.map((item) => [item.stepId, item]));
  const blockers = [...plan.blockers];
  const missingArtifactStepIds: string[] = [];
  const missingEvidenceStepIds: string[] = [];
  const unverifiedStepIds: string[] = [];

  for (const step of plan.steps) {
    if (!completed.has(step.id)) continue;
    const record = evidenceByStep.get(step.id);
    if (!record?.artifactIds?.length) missingArtifactStepIds.push(step.id);
    if (!record?.evidenceIds?.length) missingEvidenceStepIds.push(step.id);
    if (!record?.verified) unverifiedStepIds.push(step.id);
  }

  for (const id of missingArtifactStepIds) blockers.push(`completed_without_artifact:${id}`);
  for (const id of missingEvidenceStepIds) blockers.push(`completed_without_evidence:${id}`);
  for (const id of unverifiedStepIds) blockers.push(`completed_without_verification:${id}`);

  const executableStepIds = getExecutableSteps(plan, completedStepIds).map((step) => step.id);
  const allStepsCompleted = plan.steps.length > 0 && plan.steps.every((step) => completed.has(step.id));
  const canClaimComplete = allStepsCompleted && blockers.length === 0;

  if (!canClaimComplete && executableStepIds.length === 0 && blockers.length === 0) {
    blockers.push("anti_stall:no_executable_edge_and_no_documented_blocker");
  }

  return {
    state: canClaimComplete ? "completed" : blockers.length ? "blocked" : plan.state,
    executableStepIds,
    missingArtifactStepIds,
    missingEvidenceStepIds,
    unverifiedStepIds,
    blockers: [...new Set(blockers)],
    canClaimComplete,
  };
}

export function isOutcomeComplete(
  plan: OutcomePlan,
  completedStepIds: string[],
  evidence: OutcomeExecutionEvidence[] = [],
): boolean {
  return auditOutcomeLifecycle(plan, completedStepIds, evidence).canClaimComplete;
}
