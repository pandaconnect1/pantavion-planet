export const PANTAVION_SOVEREIGNTY_LOOP_V1 = {
  id: "pantavion_sovereignty_loop_v1",
  purpose:
    "Make Pantavion progressively more self-maintaining, self-healing, self-upgrading and self-evolving while preserving truth, safety, reversibility and founder sovereignty.",
  doctrine: {
    internalFirstWhenPractical: true,
    externalDependencyIsExplicitNotHidden: true,
    noFakeIndependenceClaims: true,
    preserveWorkingFallbacksDuringMigration: true,
    securityCannotBeRelaxedForSovereignty: true,
    userDataIsolationCannotBeRelaxed: true,
    productionMutationRequiresControlledPromotion: true,
    irreversibleChangeRequiresFounderApproval: true,
    rollbackRequiredForProviderReplacement: true,
    verifiedEvidenceRequiredBeforePromotion: true,
  },
  loop: [
    "OBSERVE",
    "MEASURE_DEPENDENCY",
    "DETECT_GAP_OR_FAILURE",
    "RESEARCH_OPTIONS",
    "DESIGN_PANTAVION_NATIVE_OR_SELF_HOSTABLE_PATH",
    "SANDBOX",
    "TEST",
    "COMPARE",
    "CANARY",
    "PROMOTE_OR_ROLLBACK",
    "VERIFY_LIVE",
    "LEARN",
  ],
} as const;

export type PantavionSovereigntyLevel =
  | "PANTAVION_OWNED"
  | "SELF_HOSTABLE"
  | "THIRD_PARTY_WITH_FALLBACK"
  | "EXTERNAL_REQUIRED"
  | "UNKNOWN";

export type PantavionDependencyCriticality =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type PantavionReplacementState =
  | "NO_ACTION"
  | "MONITOR"
  | "RESEARCH"
  | "ADAPTER_READY"
  | "SANDBOX_READY"
  | "CANARY_READY"
  | "MIGRATION_READY"
  | "VERIFIED_REPLACEMENT";

export interface PantavionCapabilityDependencyInput {
  capabilityId: string;
  capabilityName: string;
  currentLevel: PantavionSovereigntyLevel;
  criticality: PantavionDependencyCriticality;
  provider?: string | null;
  selfHostableCandidate?: boolean;
  pantavionNativeCandidate?: boolean;
  fallbackAvailable?: boolean;
  currentHealth?: "ok" | "degraded" | "down" | "unknown";
  switchingCost?: number;
  operationalCost?: number;
  privacyExposure?: number;
  lockInRisk?: number;
  outageImpact?: number;
}

export interface PantavionSovereigntyDecision {
  capabilityId: string;
  currentLevel: PantavionSovereigntyLevel;
  targetLevel: PantavionSovereigntyLevel;
  replacementState: PantavionReplacementState;
  sovereigntyPriority: number;
  productionMutationAllowed: false;
  requiresFounderApproval: boolean;
  requiresRollbackPlan: boolean;
  externalDependencyStillRequired: boolean;
  rationale: string[];
  safeguards: string[];
}

const clamp = (value: number | undefined): number => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value ?? 0)));
};

const criticalityWeight: Record<PantavionDependencyCriticality, number> = {
  LOW: 10,
  MEDIUM: 30,
  HIGH: 60,
  CRITICAL: 85,
};

function chooseTargetLevel(
  input: PantavionCapabilityDependencyInput,
): PantavionSovereigntyLevel {
  if (input.currentLevel === "PANTAVION_OWNED") return "PANTAVION_OWNED";
  if (input.pantavionNativeCandidate) return "PANTAVION_OWNED";
  if (input.selfHostableCandidate) return "SELF_HOSTABLE";
  if (input.fallbackAvailable) return "THIRD_PARTY_WITH_FALLBACK";
  return input.currentLevel === "UNKNOWN" ? "EXTERNAL_REQUIRED" : input.currentLevel;
}

function replacementState(
  input: PantavionCapabilityDependencyInput,
  priority: number,
  targetLevel: PantavionSovereigntyLevel,
): PantavionReplacementState {
  if (input.currentLevel === "PANTAVION_OWNED") return "NO_ACTION";
  if (targetLevel === input.currentLevel && !input.fallbackAvailable) return "MONITOR";
  if (priority >= 75 && (input.pantavionNativeCandidate || input.selfHostableCandidate)) {
    return "RESEARCH";
  }
  if (priority >= 45 && input.fallbackAvailable) return "ADAPTER_READY";
  return "MONITOR";
}

export function evaluatePantavionCapabilitySovereignty(
  input: PantavionCapabilityDependencyInput,
): PantavionSovereigntyDecision {
  const targetLevel = chooseTargetLevel(input);
  const healthPenalty = input.currentHealth === "down" ? 30 : input.currentHealth === "degraded" ? 15 : 0;
  const priority = clamp(
    criticalityWeight[input.criticality] * 0.35 +
      clamp(input.lockInRisk) * 0.2 +
      clamp(input.privacyExposure) * 0.15 +
      clamp(input.outageImpact) * 0.2 +
      clamp(input.operationalCost) * 0.05 +
      clamp(input.switchingCost) * 0.05 +
      healthPenalty,
  );

  const state = replacementState(input, priority, targetLevel);
  const requiresFounderApproval =
    state === "CANARY_READY" ||
    state === "MIGRATION_READY" ||
    state === "VERIFIED_REPLACEMENT" ||
    input.criticality === "CRITICAL";

  const externalDependencyStillRequired = targetLevel !== "PANTAVION_OWNED";

  return {
    capabilityId: input.capabilityId,
    currentLevel: input.currentLevel,
    targetLevel,
    replacementState: state,
    sovereigntyPriority: priority,
    productionMutationAllowed: false,
    requiresFounderApproval,
    requiresRollbackPlan: targetLevel !== input.currentLevel,
    externalDependencyStillRequired,
    rationale: [
      `Current sovereignty level: ${input.currentLevel}.`,
      `Target sovereignty level: ${targetLevel}.`,
      `Priority ${priority}/100 based on criticality, lock-in, privacy, outage impact, cost and health.`,
      externalDependencyStillRequired
        ? "External dependency remains explicit until a verified Pantavion-owned replacement exists."
        : "Capability can target Pantavion-owned execution after controlled validation.",
    ],
    safeguards: [
      "no-direct-production-self-modification",
      "sandbox-before-provider-replacement",
      "rollback-required-for-capability-migration",
      "security-and-user-isolation-cannot-be-relaxed",
      "verified-live-evidence-required-before-retiring-old-provider",
      "external-dependency-remains-visible-until-replacement-is-proven",
    ],
  };
}

export function createPantavionSovereigntySnapshot(
  capabilities: PantavionCapabilityDependencyInput[],
) {
  const decisions = capabilities.map(evaluatePantavionCapabilitySovereignty);
  const counts = decisions.reduce<Record<PantavionSovereigntyLevel, number>>(
    (acc, item) => {
      acc[item.currentLevel] += 1;
      return acc;
    },
    {
      PANTAVION_OWNED: 0,
      SELF_HOSTABLE: 0,
      THIRD_PARTY_WITH_FALLBACK: 0,
      EXTERNAL_REQUIRED: 0,
      UNKNOWN: 0,
    },
  );

  const total = decisions.length;
  const independent = counts.PANTAVION_OWNED + counts.SELF_HOSTABLE;
  const sovereigntyCoverage = total === 0 ? 0 : Math.round((independent / total) * 100);

  return {
    ok: true,
    generatedAt: new Date().toISOString(),
    engine: PANTAVION_SOVEREIGNTY_LOOP_V1.id,
    totalCapabilities: total,
    currentLevelCounts: counts,
    sovereigntyCoverage,
    decisions,
    truth:
      "Sovereignty coverage measures Pantavion-owned or self-hostable capability paths; it does not claim independence from infrastructure that is still externally required.",
  };
}
