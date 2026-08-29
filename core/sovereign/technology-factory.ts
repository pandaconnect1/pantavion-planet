export type CapabilitySource = "pantavion_native" | "self_hosted" | "open_standard" | "external_provider";
export type FactoryStage = "discover" | "research" | "prototype" | "simulate" | "benchmark" | "secure" | "approve" | "deploy" | "observe" | "improve";
export type Decision = "automatic" | "owner_approval" | "deny";

export interface CapabilityCandidate {
  id: string;
  capability: string;
  source: CapabilitySource;
  provider?: string;
  quality: number;
  latencyMs: number;
  unitCost: number;
  privacyScore: number;
  resilienceScore: number;
  sovereigntyScore: number;
  reversible: boolean;
}

export interface SovereigntyPolicy {
  minimumQuality: number;
  minimumPrivacy: number;
  minimumResilience: number;
  maximumUnitCost: number;
  ownerApprovalForExternalReplacement: boolean;
}

export interface FactoryRecommendation {
  capability: string;
  incumbent: CapabilityCandidate;
  candidate: CapabilityCandidate;
  stage: FactoryStage;
  decision: Decision;
  reasons: string[];
  rollbackRequired: boolean;
}

const validSources = new Set<CapabilitySource>([
  "pantavion_native",
  "self_hosted",
  "open_standard",
  "external_provider",
]);

function candidateValidationReasons(label: string, value: CapabilityCandidate): string[] {
  const reasons: string[] = [];
  if (!value.id.trim() || !value.capability.trim()) reasons.push(label + "_identity_invalid");
  if (!validSources.has(value.source)) reasons.push(label + "_source_invalid");
  if (value.source === "external_provider" && !value.provider?.trim()) {
    reasons.push(label + "_provider_missing");
  }
  for (const [metric, score] of [
    ["quality", value.quality],
    ["privacy", value.privacyScore],
    ["resilience", value.resilienceScore],
    ["sovereignty", value.sovereigntyScore],
  ] as const) {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      reasons.push(label + "_" + metric + "_invalid");
    }
  }
  if (!Number.isFinite(value.latencyMs) || value.latencyMs < 0) {
    reasons.push(label + "_latency_invalid");
  }
  if (!Number.isFinite(value.unitCost) || value.unitCost < 0) {
    reasons.push(label + "_cost_invalid");
  }
  return reasons;
}

function policyValidationReasons(policy: SovereigntyPolicy): string[] {
  const reasons: string[] = [];
  for (const [metric, score] of [
    ["minimum_quality", policy.minimumQuality],
    ["minimum_privacy", policy.minimumPrivacy],
    ["minimum_resilience", policy.minimumResilience],
  ] as const) {
    if (!Number.isFinite(score) || score < 0 || score > 100) reasons.push("policy_" + metric + "_invalid");
  }
  if (!Number.isFinite(policy.maximumUnitCost) || policy.maximumUnitCost < 0) {
    reasons.push("policy_maximum_cost_invalid");
  }
  return reasons;
}

export function evaluateReplacement(
  incumbent: CapabilityCandidate,
  candidate: CapabilityCandidate,
  policy: SovereigntyPolicy,
): FactoryRecommendation {
  if (incumbent.capability !== candidate.capability) throw new Error("Capability mismatch");

  const validationReasons = [
    ...candidateValidationReasons("incumbent", incumbent),
    ...candidateValidationReasons("candidate", candidate),
    ...policyValidationReasons(policy),
  ];
  if (validationReasons.length) {
    return {
      capability: incumbent.capability,
      incumbent,
      candidate,
      stage: "benchmark",
      decision: "deny",
      reasons: [...new Set(validationReasons)],
      rollbackRequired: true,
    };
  }

  const reasons: string[] = [];
  if (candidate.quality < policy.minimumQuality) reasons.push("quality_below_policy");
  if (candidate.privacyScore < policy.minimumPrivacy) reasons.push("privacy_below_policy");
  if (candidate.resilienceScore < policy.minimumResilience) reasons.push("resilience_below_policy");
  if (candidate.unitCost > policy.maximumUnitCost) reasons.push("cost_above_policy");
  if (!candidate.reversible) reasons.push("rollback_unavailable");

  if (reasons.length) {
    return {
      capability: incumbent.capability,
      incumbent,
      candidate,
      stage: "benchmark",
      decision: "deny",
      reasons,
      rollbackRequired: true,
    };
  }

  if (candidate.sovereigntyScore > incumbent.sovereigntyScore) reasons.push("sovereignty_improved");
  if (candidate.unitCost < incumbent.unitCost) reasons.push("cost_improved");
  if (candidate.latencyMs < incumbent.latencyMs) reasons.push("latency_improved");
  if (candidate.privacyScore > incumbent.privacyScore) reasons.push("privacy_improved");
  if (candidate.resilienceScore > incumbent.resilienceScore) reasons.push("resilience_improved");

  const meaningfulImprovement = reasons.length > 0 && candidate.quality >= incumbent.quality;
  if (!meaningfulImprovement) {
    return {
      capability: incumbent.capability,
      incumbent,
      candidate,
      stage: "benchmark",
      decision: "deny",
      reasons: ["no_proven_improvement"],
      rollbackRequired: true,
    };
  }

  const replacesExternal = incumbent.source === "external_provider" && candidate.source !== "external_provider";
  return {
    capability: incumbent.capability,
    incumbent,
    candidate,
    stage: "approve",
    decision: replacesExternal && policy.ownerApprovalForExternalReplacement ? "owner_approval" : "automatic",
    reasons,
    rollbackRequired: true,
  };
}

export function nextFactoryStage(stage: FactoryStage): FactoryStage {
  const stages: FactoryStage[] = [
    "discover",
    "research",
    "prototype",
    "simulate",
    "benchmark",
    "secure",
    "approve",
    "deploy",
    "observe",
    "improve",
  ];
  const currentIndex = stages.indexOf(stage);
  if (currentIndex < 0) throw new Error("Unknown factory stage");
  return stages[Math.min(currentIndex + 1, stages.length - 1)];
}
