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

export function compileOutcomePlan(
  intent: UserIntent,
  candidateSteps: OutcomeStep[],
  estimatedCost: number,
  policy: OutcomePolicy,
): OutcomePlan {
  if (!intent.userId.trim()) throw new Error("userId is required");
  if (!intent.desiredOutcome.trim()) throw new Error("desiredOutcome is required");

  const blockers: string[] = [];
  const seen = new Set<string>();

  for (const step of candidateSteps) {
    if (seen.has(step.id)) blockers.push(`duplicate_step:${step.id}`);
    seen.add(step.id);
    for (const dependency of step.dependsOn) {
      if (!candidateSteps.some((candidate) => candidate.id === dependency)) {
        blockers.push(`missing_dependency:${step.id}:${dependency}`);
      }
    }
  }

  const approvalByRisk = candidateSteps.some((step) => policy.ownerApprovalRisks.includes(step.risk));
  const approvalByIrreversibility = policy.requireApprovalForIrreversible && candidateSteps.some((step) => !step.reversible);
  const approvalByCost = estimatedCost > policy.maximumAutomaticCost;
  const requiresOwnerApproval = approvalByRisk || approvalByIrreversibility || approvalByCost || candidateSteps.some((step) => step.requiresOwnerApproval);

  if (intent.maxCost != null && estimatedCost > intent.maxCost) blockers.push("intent_cost_limit_exceeded");

  return {
    intentId: intent.id,
    state: blockers.length ? "blocked" : "ready",
    steps: candidateSteps,
    blockers,
    estimatedCost,
    requiresOwnerApproval,
  };
}

export function getExecutableSteps(plan: OutcomePlan, completedStepIds: string[]): OutcomeStep[] {
  const completed = new Set(completedStepIds);
  if (plan.state === "blocked" || plan.state === "failed") return [];
  return plan.steps.filter((step) => !completed.has(step.id) && step.dependsOn.every((dependency) => completed.has(dependency)));
}

export function isOutcomeComplete(plan: OutcomePlan, completedStepIds: string[]): boolean {
  const completed = new Set(completedStepIds);
  return plan.steps.length > 0 && plan.steps.every((step) => completed.has(step.id));
}
