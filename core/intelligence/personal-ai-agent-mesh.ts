import {
  createEphemeralAgent,
  type EphemeralAgent,
  type SwarmRole,
} from "../sovereign/ephemeral-agent-swarm.ts";

export const PANTAVION_PERSONAL_AI_AGENT_MESH_V1 = {
  id: "pantavion_personal_ai_agent_mesh_v1",
  doctrine:
    "Each user owns one persistent Personal AI identity and consent-aware memory core. Specialist agents are created on demand as bounded, scoped, expiring workers; logical specialization has no fixed ceiling, but active concurrency and authority are always bounded.",
  persistentCorePerUser: 1,
  logicalSpecialistCapacity: "unbounded",
  activeConcurrency: "bounded",
  defaultSpecialistLifetimeMinutes: 15,
  noPermanentWorkerExplosion: true,
  noCrossUserAuthority: true,
  consentAwareMemoryRequired: true,
} as const;

export type PantavionPersonalSpecialistClass =
  | "planner"
  | "research"
  | "builder"
  | "verification"
  | "security"
  | "language"
  | "domain";

export interface PantavionPersonalAICoreIdentity {
  userId: string;
  personalAiId: string;
  memoryEnabled: boolean;
  crossThreadEnabled: boolean;
  voiceEnabled: boolean;
  preferredLocale: string | null;
  assistanceLevel: "minimal" | "balanced" | "proactive" | "guided";
}

export interface PantavionPersonalAgentNeed {
  intentId: string;
  specialistClass: PantavionPersonalSpecialistClass;
  capability: string;
  risk: "low" | "medium" | "high" | "restricted";
  readOnly?: boolean;
  budget?: number;
}

export interface PantavionPersonalAgentMeshPlan {
  marker: "pantavion_personal_ai_agent_mesh_plan_v1";
  core: PantavionPersonalAICoreIdentity;
  logicalCapacity: "unbounded";
  activeAgents: EphemeralAgent[];
  maxActiveAgentsForPlan: number;
  memoryBoundary: {
    persistentCoreMemoryAllowed: boolean;
    specialistMemoryPersistenceAllowed: false;
    crossUserMemoryAllowed: false;
    rawSpecialistScratchMustExpire: true;
  };
  authority: {
    productionMutationAllowed: false;
    irreversibleActionAllowed: false;
    crossUserAuthorityAllowed: false;
  };
}

const ROLE_MAP: Record<PantavionPersonalSpecialistClass, SwarmRole> = {
  planner: "planner",
  research: "researcher",
  builder: "builder",
  verification: "verifier",
  security: "security",
  language: "translator",
  domain: "domain_specialist",
};

function concurrencyLimit(
  core: PantavionPersonalAICoreIdentity,
  needs: PantavionPersonalAgentNeed[],
): number {
  const base =
    core.assistanceLevel === "minimal"
      ? 2
      : core.assistanceLevel === "balanced"
        ? 4
        : core.assistanceLevel === "guided"
          ? 5
          : 6;
  const highRisk = needs.some((need) => need.risk === "high" || need.risk === "restricted");
  return Math.min(8, Math.max(1, base + (highRisk ? 1 : 0)));
}

export function createPersonalAgentMeshPlan(input: {
  core: PantavionPersonalAICoreIdentity;
  needs: PantavionPersonalAgentNeed[];
  nowIso?: string;
}): PantavionPersonalAgentMeshPlan {
  const { core } = input;
  if (!core.userId.trim() || !core.personalAiId.trim()) {
    throw new Error("personal_ai_core_identity_required");
  }

  const nowIso = input.nowIso || new Date().toISOString();
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(nowMs)) throw new Error("personal_ai_mesh_time_invalid");

  const unique = new Map<string, PantavionPersonalAgentNeed>();
  for (const need of input.needs) {
    if (!need.intentId.trim() || !need.capability.trim()) {
      throw new Error("personal_ai_agent_need_invalid");
    }
    const key = [need.intentId, need.specialistClass, need.capability].join("|");
    if (!unique.has(key)) unique.set(key, need);
  }

  const limit = concurrencyLimit(core, [...unique.values()]);
  const selected = [...unique.values()].slice(0, limit);
  const expiresAt = new Date(
    nowMs + PANTAVION_PERSONAL_AI_AGENT_MESH_V1.defaultSpecialistLifetimeMinutes * 60_000,
  ).toISOString();

  const activeAgents = selected.map((need, index) =>
    createEphemeralAgent({
      id: `personal-ai:${core.personalAiId}:${need.intentId}:${need.specialistClass}:${index + 1}`,
      parentIntentId: need.intentId,
      role: ROLE_MAP[need.specialistClass],
      capabilities: [
        {
          capability: need.capability,
          scope: `user:${core.userId}:personal-ai:${core.personalAiId}:intent:${need.intentId}`,
          readOnly:
            need.readOnly ??
            ["research", "verification", "security"].includes(need.specialistClass),
          expiresAt,
        },
      ],
      budget: Math.max(0, Math.min(10, need.budget ?? 1)),
      createdAt: nowIso,
      expiresAt,
    }),
  );

  return {
    marker: "pantavion_personal_ai_agent_mesh_plan_v1",
    core,
    logicalCapacity: "unbounded",
    activeAgents,
    maxActiveAgentsForPlan: limit,
    memoryBoundary: {
      persistentCoreMemoryAllowed: core.memoryEnabled,
      specialistMemoryPersistenceAllowed: false,
      crossUserMemoryAllowed: false,
      rawSpecialistScratchMustExpire: true,
    },
    authority: {
      productionMutationAllowed: false,
      irreversibleActionAllowed: false,
      crossUserAuthorityAllowed: false,
    },
  };
}
