export type PantavionAIRiskZone = "green" | "amber" | "red";

export type PantavionProviderCandidate = {
  adapterKey: string;
  availability: "ready" | "degraded" | "offline" | "maintenance" | "retired";
  capabilities: readonly string[];
  dataRegions: readonly string[];
  supportsSensitiveData: boolean;
  qualityScore: number;
  estimatedCostPerMillion: number;
  estimatedLatencyMs: number;
};

export type PantavionAIRoutingRequest = {
  requiredCapabilities: readonly string[];
  riskZone: PantavionAIRiskZone;
  containsSensitiveData: boolean;
  preferredRegion?: string | null;
  maxCostPerMillion?: number | null;
};

export type PantavionAIRoutingDecision = {
  selectedAdapterKey: string | null;
  requiresHumanControl: boolean;
  reason: string;
  consideredAdapters: string[];
};

export function selectPantavionAIProvider(
  request: PantavionAIRoutingRequest,
  candidates: readonly PantavionProviderCandidate[],
): PantavionAIRoutingDecision {
  if (request.riskZone === "red") {
    return {
      selectedAdapterKey: null,
      requiresHumanControl: true,
      reason: "red-zone tasks cannot be autonomously delegated to an AI provider",
      consideredAdapters: candidates.map((candidate) => candidate.adapterKey).sort(),
    };
  }

  const eligible = candidates.filter((candidate) => {
    if (candidate.availability !== "ready") return false;
    if (!request.requiredCapabilities.every((capability) => candidate.capabilities.includes(capability))) return false;
    if (request.containsSensitiveData && !candidate.supportsSensitiveData) return false;
    if (request.preferredRegion && !candidate.dataRegions.includes(request.preferredRegion)) return false;
    if (typeof request.maxCostPerMillion === "number" && candidate.estimatedCostPerMillion > request.maxCostPerMillion) return false;
    return true;
  });

  if (eligible.length === 0) {
    return {
      selectedAdapterKey: null,
      requiresHumanControl: request.riskZone === "amber",
      reason: "no eligible provider satisfies capability, privacy, region, availability and cost gates",
      consideredAdapters: candidates.map((candidate) => candidate.adapterKey).sort(),
    };
  }

  const ranked = eligible
    .map((candidate) => ({
      candidate,
      score:
        Math.max(0, Math.min(1, candidate.qualityScore)) * 1000 -
        candidate.estimatedCostPerMillion * 2 -
        candidate.estimatedLatencyMs / 10,
    }))
    .sort((left, right) => right.score - left.score || left.candidate.adapterKey.localeCompare(right.candidate.adapterKey));

  return {
    selectedAdapterKey: ranked[0].candidate.adapterKey,
    requiresHumanControl: request.riskZone === "amber",
    reason: request.riskZone === "amber"
      ? "provider selected deterministically; execution still requires bounded control"
      : "provider selected deterministically from eligible candidates",
    consideredAdapters: eligible.map((candidate) => candidate.adapterKey).sort(),
  };
}
