// core/pantavion/entitlements/pantavion-entitlement-resolver.ts

export type PantavionPlanKey =
  | "free"
  | "pro"
  | "elite"
  | "business_basic"
  | "business_advanced"
  | "institutional_verified"
  | "institutional_advanced"
  | "government_custom";

export type PantavionModuleKey =
  | "people"
  | "chat"
  | "voice"
  | "pulse"
  | "social"
  | "business"
  | "sos"
  | "travel"
  | "audio"
  | "compass"
  | "mind"
  | "learn"
  | "ads"
  | "maps"
  | "institutional"
  | "billing"
  | "discovery"
  | "simulation";

export type PantavionTrustLevel =
  | "low"
  | "standard"
  | "high";

export type PantavionAgeBand =
  | "minor"
  | "adult";

export type PantavionEntitlementInput = {
  actorId?: string;
  planKey: PantavionPlanKey;
  moduleKey: PantavionModuleKey;
  trustLevel?: PantavionTrustLevel;
  ageBand?: PantavionAgeBand;
  verified?: boolean;
  institutional?: boolean;
};

export type PantavionEntitlementResult = {
  allowed: boolean;
  planKey: PantavionPlanKey;
  moduleKey: PantavionModuleKey;
  depth: "blocked" | "limited" | "standard" | "advanced" | "institutional";
  reason: string;
  quotas: Record<string, number>;
  featureFlags: Record<string, boolean>;
};

const PLAN_MODULE_ACCESS: Record<PantavionPlanKey, PantavionModuleKey[]> = {
  free: ["people", "chat", "pulse", "mind", "billing"],
  pro: ["people", "chat", "voice", "pulse", "social", "mind", "compass", "billing", "discovery"],
  elite: ["people", "chat", "voice", "pulse", "social", "mind", "compass", "audio", "billing", "discovery", "simulation"],
  business_basic: ["people", "chat", "voice", "pulse", "business", "mind", "compass", "billing", "discovery"],
  business_advanced: ["people", "chat", "voice", "pulse", "social", "business", "mind", "compass", "audio", "billing", "discovery", "simulation", "ads"],
  institutional_verified: ["people", "chat", "voice", "pulse", "mind", "compass", "institutional", "billing", "discovery"],
  institutional_advanced: ["people", "chat", "voice", "pulse", "mind", "compass", "institutional", "billing", "discovery", "simulation", "maps", "sos"],
  government_custom: ["people", "chat", "voice", "pulse", "mind", "compass", "institutional", "billing", "discovery", "simulation", "maps", "sos", "travel", "audio"],
};

const PLAN_DEPTH: Record<PantavionPlanKey, PantavionEntitlementResult["depth"]> = {
  free: "limited",
  pro: "standard",
  elite: "advanced",
  business_basic: "advanced",
  business_advanced: "advanced",
  institutional_verified: "institutional",
  institutional_advanced: "institutional",
  government_custom: "institutional",
};

const PLAN_QUOTAS: Record<PantavionPlanKey, Record<string, number>> = {
  free: {
    workflow_actions: 20,
    discovery_runs: 5,
    simulation_runs: 2,
    voice_sessions: 3,
    billing_attempts: 10,
  },
  pro: {
    workflow_actions: 150,
    discovery_runs: 40,
    simulation_runs: 20,
    voice_sessions: 30,
    billing_attempts: 20,
  },
  elite: {
    workflow_actions: 500,
    discovery_runs: 120,
    simulation_runs: 60,
    voice_sessions: 100,
    billing_attempts: 40,
  },
  business_basic: {
    workflow_actions: 800,
    discovery_runs: 200,
    simulation_runs: 100,
    voice_sessions: 160,
    billing_attempts: 80,
  },
  business_advanced: {
    workflow_actions: 2000,
    discovery_runs: 500,
    simulation_runs: 250,
    voice_sessions: 400,
    billing_attempts: 120,
  },
  institutional_verified: {
    workflow_actions: 2500,
    discovery_runs: 700,
    simulation_runs: 400,
    voice_sessions: 500,
    billing_attempts: 150,
  },
  institutional_advanced: {
    workflow_actions: 5000,
    discovery_runs: 1200,
    simulation_runs: 700,
    voice_sessions: 900,
    billing_attempts: 200,
  },
  government_custom: {
    workflow_actions: 10000,
    discovery_runs: 2500,
    simulation_runs: 1500,
    voice_sessions: 2000,
    billing_attempts: 400,
  },
};

export function resolvePantavionEntitlements(
  input: PantavionEntitlementInput
): PantavionEntitlementResult {
  const trustLevel = input.trustLevel ?? "standard";
  const ageBand = input.ageBand ?? "adult";
  const allowedModules = PLAN_MODULE_ACCESS[input.planKey] ?? [];
  const baseAllowed = allowedModules.includes(input.moduleKey);

  if (!baseAllowed) {
    return {
      allowed: false,
      planKey: input.planKey,
      moduleKey: input.moduleKey,
      depth: "blocked",
      reason: `Plan ${input.planKey} does not include module ${input.moduleKey}.`,
      quotas: PLAN_QUOTAS[input.planKey] ?? {},
      featureFlags: buildFeatureFlags(input.planKey, false),
    };
  }

  if (ageBand === "minor" && ["ads", "business", "institutional", "billing"].includes(input.moduleKey)) {
    return {
      allowed: false,
      planKey: input.planKey,
      moduleKey: input.moduleKey,
      depth: "blocked",
      reason: `Module ${input.moduleKey} is blocked for minor age band.`,
      quotas: PLAN_QUOTAS[input.planKey] ?? {},
      featureFlags: buildFeatureFlags(input.planKey, false),
    };
  }

  if (trustLevel === "low" && ["voice", "social", "discovery", "simulation"].includes(input.moduleKey)) {
    return {
      allowed: false,
      planKey: input.planKey,
      moduleKey: input.moduleKey,
      depth: "blocked",
      reason: `Low trust state blocks module ${input.moduleKey}.`,
      quotas: PLAN_QUOTAS[input.planKey] ?? {},
      featureFlags: buildFeatureFlags(input.planKey, false),
    };
  }

  if (
    ["institutional_verified", "institutional_advanced", "government_custom"].includes(input.planKey) &&
    !input.verified &&
    input.moduleKey === "institutional"
  ) {
    return {
      allowed: false,
      planKey: input.planKey,
      moduleKey: input.moduleKey,
      depth: "blocked",
      reason: "Institutional module requires verified state.",
      quotas: PLAN_QUOTAS[input.planKey] ?? {},
      featureFlags: buildFeatureFlags(input.planKey, false),
    };
  }

  return {
    allowed: true,
    planKey: input.planKey,
    moduleKey: input.moduleKey,
    depth: PLAN_DEPTH[input.planKey] ?? "limited",
    reason: `Access granted for ${input.moduleKey} under ${input.planKey}.`,
    quotas: PLAN_QUOTAS[input.planKey] ?? {},
    featureFlags: buildFeatureFlags(input.planKey, true),
  };
}

export function getPantavionPlanQuotas(planKey: PantavionPlanKey) {
  return PLAN_QUOTAS[planKey] ?? {};
}

export function isPantavionPlanKey(value: string): value is PantavionPlanKey {
  return [
    "free",
    "pro",
    "elite",
    "business_basic",
    "business_advanced",
    "institutional_verified",
    "institutional_advanced",
    "government_custom",
  ].includes(value);
}

export function isPantavionModuleKey(value: string): value is PantavionModuleKey {
  return [
    "people",
    "chat",
    "voice",
    "pulse",
    "social",
    "business",
    "sos",
    "travel",
    "audio",
    "compass",
    "mind",
    "learn",
    "ads",
    "maps",
    "institutional",
    "billing",
    "discovery",
    "simulation",
  ].includes(value);
}

function buildFeatureFlags(
  planKey: PantavionPlanKey,
  allowed: boolean
): Record<string, boolean> {
  return {
    module_access: allowed,
    premium_history: !["free"].includes(planKey) && allowed,
    advanced_exports: ["elite", "business_basic", "business_advanced", "institutional_verified", "institutional_advanced", "government_custom"].includes(planKey) && allowed,
    institutional_controls: ["institutional_verified", "institutional_advanced", "government_custom"].includes(planKey) && allowed,
    business_controls: ["business_basic", "business_advanced"].includes(planKey) && allowed,
  };
}
