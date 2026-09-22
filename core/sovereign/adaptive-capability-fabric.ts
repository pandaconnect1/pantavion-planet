import { matchCapabilities } from "../registry/capability-registry.ts";
import {
  evaluateCapabilityFamilyCandidate,
  type PantavionCapabilityRiskClass,
} from "../registry/capability-family-registry.ts";
import {
  compileOutcomePlan,
  type OutcomePlan,
  type OutcomeRisk,
  type OutcomeStep,
} from "./intent-to-outcome-fabric.ts";
import {
  createEphemeralAgent,
  type EphemeralAgent,
  type SwarmRole,
} from "./ephemeral-agent-swarm.ts";
import { pantavionNaturalLanguageUniverse } from "../translation/pantavion-natural-language-universe.ts";
import { getPantavionLifelongHumanityEcosystemSnapshot } from "../pantavion/lifelong-humanity-ecosystem.ts";

export const PANTAVION_ADAPTIVE_CAPABILITY_FABRIC_V1 = {
  id: "pantavion_adaptive_capability_fabric_v1",
  doctrine:
    "Resolve any lawful user intent against existing Pantavion capabilities first; when a capability is missing, synthesize a provenance-bound capability blueprint and bounded execution plan instead of inventing a fake-live feature.",
  logicalCapacity: "unbounded_namespace_bounded_execution",
  hotPath: {
    intentClassificationTargetMs: 50,
    capabilityRoutingTargetMs: 100,
    existingCapabilityPlanTargetMs: 250,
    synthesisBlueprintTargetMs: 1000,
    actualBuildTimeGuarantee: false,
  },
  guarantees: {
    noFakeLive: true,
    noUnlimitedAuthority: true,
    noUnboundedAgentLifetime: true,
    deterministicCapabilityIdentity: true,
    translationKernelAlwaysAvailableAsRoutingLayer: true,
    durableExecutionRequiredForBuilds: true,
    verificationRequiredBeforeLiveClaim: true,
  },
} as const;

export type PantavionAdaptiveRisk = "low" | "medium" | "high" | "restricted";
export type PantavionAdaptiveDisposition =
  | "route_existing"
  | "synthesize_capability"
  | "review_required"
  | "blocked";

export interface PantavionAdaptiveIntentRequest {
  intentId: string;
  userId: string;
  text: string;
  desiredOutcome: string;
  locale?: string | null;
  targetLocale?: string | null;
  jurisdiction?: string | null;
  actorScopes?: string[];
  domainHint?: string | null;
  maxCost?: number;
  deadlineAt?: string;
  nowIso?: string;
}

export interface PantavionCapabilityBlueprint {
  capabilityKey: string;
  title: string;
  familyKey: string;
  risk: PantavionAdaptiveRisk;
  canonicalNamespace: string;
  requiredLayers: string[];
  verificationGates: string[];
  providerStrategy: "pantavion_owned_first" | "adapter_with_fallback" | "external_required_until_replaced";
  productionState: "proposal_only";
}

export interface PantavionPersonalSwarmBlueprint {
  persistentUserCore: {
    userId: string;
    memoryIdentity: string;
    lifetime: "persistent_until_user_or_policy_changes";
    activeWorkerCount: 0;
  };
  agents: EphemeralAgent[];
  rule: "persistent_identity_ephemeral_specialists";
}

export interface PantavionTranslationBridgePlan {
  sourceLocale: string | null;
  targetLocale: string | null;
  bidirectional: true;
  text: true;
  speech: true;
  captions: true;
  targetNaturalLanguageCount: number;
  currentlyRegisteredLanguageCount: number;
  providerCoverageMustBeVerified: true;
  truthBoundary: string;
}

export interface PantavionAdaptiveCapabilityPlan {
  marker: "pantavion_adaptive_capability_plan_v1";
  fabric: typeof PANTAVION_ADAPTIVE_CAPABILITY_FABRIC_V1.id;
  intentId: string;
  userId: string;
  disposition: PantavionAdaptiveDisposition;
  risk: PantavionAdaptiveRisk;
  inferredFamily: string;
  matchedCapabilityIds: string[];
  blueprint: PantavionCapabilityBlueprint | null;
  outcomePlan: OutcomePlan;
  personalSwarm: PantavionPersonalSwarmBlueprint;
  translation: PantavionTranslationBridgePlan;
  latencyBudget: typeof PANTAVION_ADAPTIVE_CAPABILITY_FABRIC_V1.hotPath;
  truth: {
    instantRoutingDoesNotMeanInstantProductionBuild: true;
    buildMustUseDurableExecution: true;
    verifiedLiveRequiredBeforeUserReadyClaim: true;
    humanAuthorityPreserved: true;
  };
}

const normalize = (value: unknown) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/\s+/g, " ")
    .trim();

function stableKey(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function slug(value: string): string {
  return normalize(value)
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "capability";
}

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term));
}

export function inferAdaptiveRisk(input: PantavionAdaptiveIntentRequest): PantavionAdaptiveRisk {
  const text = normalize([input.text, input.desiredOutcome, input.domainHint].filter(Boolean).join(" "));

  if (
    includesAny(text, [
      "weapon",
      "military",
      "combat",
      "explosive",
      "surveillance",
      "biological agent",
      "chemical weapon",
      "nuclear weapon",
      "offensive cyber",
      "malware",
    ])
  ) {
    return "restricted";
  }

  if (
    includesAny(text, [
      "health",
      "medical",
      "medicine",
      "brain",
      "neuro",
      "longevity",
      "life extension",
      "legal",
      "finance",
      "payment",
      "minor",
      "child",
      "sos",
      "emergency",
      "identity",
      "biometric",
      "security",
    ])
  ) {
    return "high";
  }

  if (
    includesAny(text, [
      "business",
      "marketplace",
      "travel",
      "location",
      "translation",
      "voice",
      "education",
      "work",
      "automation",
      "robot",
      "space",
      "astronomy",
      "marine",
      "aviation",
    ])
  ) {
    return "medium";
  }

  return "low";
}

export function inferCapabilityFamily(input: PantavionAdaptiveIntentRequest): string {
  const text = normalize([input.text, input.desiredOutcome, input.domainHint].filter(Boolean).join(" "));

  if (includesAny(text, ["translate", "translation", "interpreter", "language", "dialect", "voice"])) return "voice";
  if (includesAny(text, ["memory", "remember", "continuity", "history"])) return "memory";
  if (includesAny(text, ["sos", "emergency", "crisis", "rescue"])) return "crisis";
  if (includesAny(text, ["identity", "profile", "auth", "login", "trust"])) return "identity";
  if (includesAny(text, ["business", "billing", "marketplace", "payment", "commerce"])) return "business";
  if (includesAny(text, ["map", "water", "utility", "infrastructure", "travel", "location"])) return "utility";
  if (includesAny(text, ["learn", "education", "course", "knowledge", "research"])) return "learning";
  if (includesAny(text, ["offline", "resilience", "failover", "continuity", "repair"])) return "resilience";
  if (includesAny(text, ["agent", "workflow", "execute", "automation", "runtime"])) return "runtime";
  return "kernel";
}

function registryRisk(risk: PantavionAdaptiveRisk): PantavionCapabilityRiskClass {
  return risk === "restricted" ? "restricted" : risk;
}

function outcomeRisk(risk: PantavionAdaptiveRisk): OutcomeRisk {
  return risk === "restricted" ? "critical" : risk;
}

function buildCapabilityBlueprint(
  input: PantavionAdaptiveIntentRequest,
  familyKey: string,
  risk: PantavionAdaptiveRisk,
): PantavionCapabilityBlueprint {
  const semantic = slug(input.desiredOutcome || input.text);
  const capabilityKey = `dynamic:${familyKey}:${stableKey(
    [input.userId, input.desiredOutcome, input.text, familyKey].join("|"),
  )}`;

  const providerStrategy =
    risk === "restricted"
      ? "external_required_until_replaced"
      : risk === "high"
        ? "adapter_with_fallback"
        : "pantavion_owned_first";

  return {
    capabilityKey,
    title: input.desiredOutcome.trim() || input.text.trim(),
    familyKey,
    risk,
    canonicalNamespace: `capabilities/generated/${familyKey}/${semantic}`,
    requiredLayers: [
      "intent_contract",
      "canonical_data_contract",
      "policy_and_authority",
      "runtime_adapter",
      "observability",
      "tests",
      "rollback",
      "user_surface",
      "verification_evidence",
    ],
    verificationGates: [
      "security",
      "privacy",
      "jurisdiction",
      "functional_tests",
      "failure_tests",
      "rollback_test",
      "integration_test",
      "verified_live_probe",
    ],
    providerStrategy,
    productionState: "proposal_only",
  };
}

function buildOutcomeSteps(
  disposition: PantavionAdaptiveDisposition,
  risk: PantavionAdaptiveRisk,
  needsTranslation: boolean,
): OutcomeStep[] {
  const mappedRisk = outcomeRisk(risk);
  const highImpact = risk === "high" || risk === "restricted";
  const steps: OutcomeStep[] = [
    {
      id: "resolve_intent",
      title: "Resolve intent and authority",
      kind: "deterministic",
      capability: "capability.resolve",
      risk: mappedRisk,
      reversible: true,
      requiresOwnerApproval: false,
      dependsOn: [],
    },
  ];

  if (needsTranslation) {
    steps.push({
      id: "language_bridge",
      title: "Resolve bidirectional language bridge",
      kind: "workflow",
      capability: "voice.runtime",
      risk: "low",
      reversible: true,
      requiresOwnerApproval: false,
      dependsOn: ["resolve_intent"],
    });
  }

  const baseDependency = needsTranslation ? "language_bridge" : "resolve_intent";

  if (disposition === "route_existing") {
    steps.push({
      id: "execute_existing",
      title: "Execute existing canonical capability",
      kind: "workflow",
      capability: "runtime.durable",
      risk: mappedRisk,
      reversible: true,
      requiresOwnerApproval: highImpact,
      dependsOn: [baseDependency],
    });
  } else if (disposition === "synthesize_capability") {
    steps.push(
      {
        id: "research_gap",
        title: "Research missing capability and current technology",
        kind: "agent",
        capability: "research",
        risk: mappedRisk,
        reversible: true,
        requiresOwnerApproval: false,
        dependsOn: [baseDependency],
      },
      {
        id: "architect_capability",
        title: "Create canonical capability architecture",
        kind: "agent",
        capability: "architecture",
        risk: mappedRisk,
        reversible: true,
        requiresOwnerApproval: false,
        dependsOn: ["research_gap"],
      },
      {
        id: "build_candidate",
        title: "Build bounded implementation candidate",
        kind: "agent",
        capability: "build",
        risk: mappedRisk,
        reversible: true,
        requiresOwnerApproval: highImpact,
        dependsOn: ["architect_capability"],
      },
      {
        id: "test_candidate",
        title: "Run functional, security and rollback tests",
        kind: "workflow",
        capability: "verification",
        risk: mappedRisk,
        reversible: true,
        requiresOwnerApproval: false,
        dependsOn: ["build_candidate"],
      },
    );
  }

  if (disposition !== "blocked") {
    steps.push({
      id: "verify_truth",
      title: "Verify evidence and lifecycle truth",
      kind: "workflow",
      capability: "verification",
      risk: mappedRisk,
      reversible: true,
      requiresOwnerApproval: highImpact,
      dependsOn: [disposition === "route_existing" ? "execute_existing" : disposition === "synthesize_capability" ? "test_candidate" : baseDependency],
    });
  }

  return steps;
}

function roleGrant(role: SwarmRole): string[] {
  const grants: Record<SwarmRole, string[]> = {
    planner: ["intent", "plan"],
    researcher: ["research", "evidence"],
    builder: ["build", "code"],
    verifier: ["test", "verify"],
    security: ["security", "policy"],
    translator: ["translate", "language"],
    domain_specialist: ["domain", "analysis"],
  };
  return grants[role];
}

function buildPersonalSwarm(
  input: PantavionAdaptiveIntentRequest,
  disposition: PantavionAdaptiveDisposition,
  risk: PantavionAdaptiveRisk,
  needsTranslation: boolean,
): PantavionPersonalSwarmBlueprint {
  const roles = new Set<SwarmRole>(["planner", "verifier"]);
  if (disposition === "synthesize_capability") {
    roles.add("researcher");
    roles.add("builder");
    roles.add("domain_specialist");
  }
  if (risk === "high" || risk === "restricted") roles.add("security");
  if (needsTranslation) roles.add("translator");

  const createdAt = input.nowIso || new Date().toISOString();
  const createdMs = Date.parse(createdAt);
  if (!Number.isFinite(createdMs)) throw new Error("invalid_now_iso");
  const expiresAt = new Date(createdMs + 15 * 60 * 1000).toISOString();

  const agents = [...roles].map((role, index) =>
    createEphemeralAgent({
      id: `${input.intentId}:${role}:${index + 1}`,
      parentIntentId: input.intentId,
      role,
      capabilities: roleGrant(role).map((capability) => ({
        capability,
        scope: `user:${input.userId}:intent:${input.intentId}`,
        readOnly: role === "researcher" || role === "verifier" || role === "security",
        expiresAt,
      })),
      budget: role === "builder" ? 3 : role === "researcher" ? 2 : 1,
      createdAt,
      expiresAt,
    }),
  );

  return {
    persistentUserCore: {
      userId: input.userId,
      memoryIdentity: `personal-ai:${input.userId}`,
      lifetime: "persistent_until_user_or_policy_changes",
      activeWorkerCount: 0,
    },
    agents,
    rule: "persistent_identity_ephemeral_specialists",
  };
}

export function planAdaptiveCapability(
  input: PantavionAdaptiveIntentRequest,
): PantavionAdaptiveCapabilityPlan {
  if (!input.intentId.trim() || !input.userId.trim()) throw new Error("intent_and_user_required");
  if (!input.text.trim() && !input.desiredOutcome.trim()) throw new Error("intent_content_required");

  const risk = inferAdaptiveRisk(input);
  const familyKey = inferCapabilityFamily(input);
  const actorScopes = input.actorScopes ?? ["read"];

  const matches = matchCapabilities({
    domain: "general" as never,
    content: `${input.text} ${input.desiredOutcome}`,
    actorScopes: actorScopes as never[],
  });

  const allowedMatches = matches.filter((item) => item.allowed);
  const familyEvaluation = evaluateCapabilityFamilyCandidate({
    title: input.desiredOutcome || input.text,
    description: input.text,
    familyKeyHint: familyKey,
    entryKind: "service",
    riskHint: registryRisk(risk),
    tags: [familyKey, input.locale || "", input.jurisdiction || ""].filter(Boolean),
  });

  let disposition: PantavionAdaptiveDisposition;
  if (risk === "restricted") disposition = "review_required";
  else if (allowedMatches.length > 0) disposition = "route_existing";
  else if (familyEvaluation.disposition === "reject") disposition = "blocked";
  else if (familyEvaluation.disposition === "review" && !familyEvaluation.recommendedFamilyKey) disposition = "review_required";
  else disposition = "synthesize_capability";

  const needsTranslation = Boolean(
    (input.locale && input.targetLocale && input.locale !== input.targetLocale) ||
      normalize(input.text).includes("translate") ||
      normalize(input.text).includes("translation") ||
      normalize(input.text).includes("μεταφρ"),
  );

  const blueprint =
    disposition === "synthesize_capability"
      ? buildCapabilityBlueprint(input, familyEvaluation.recommendedFamilyKey || familyKey, risk)
      : null;

  const steps = buildOutcomeSteps(disposition, risk, needsTranslation);
  const outcomePlan = compileOutcomePlan(
    {
      id: input.intentId,
      userId: input.userId,
      text: input.text,
      desiredOutcome: input.desiredOutcome,
      jurisdiction: input.jurisdiction || undefined,
      maxCost: input.maxCost,
      deadlineAt: input.deadlineAt,
    },
    steps,
    disposition === "synthesize_capability" ? 5 : 1,
    {
      ownerApprovalRisks: ["high", "critical"],
      requireApprovalForIrreversible: true,
      maximumAutomaticCost: 10,
    },
  );

  const personalSwarm = buildPersonalSwarm(input, disposition, risk, needsTranslation);
  const lifelong = getPantavionLifelongHumanityEcosystemSnapshot();

  return {
    marker: "pantavion_adaptive_capability_plan_v1",
    fabric: PANTAVION_ADAPTIVE_CAPABILITY_FABRIC_V1.id,
    intentId: input.intentId,
    userId: input.userId,
    disposition,
    risk,
    inferredFamily: familyEvaluation.recommendedFamilyKey || familyKey,
    matchedCapabilityIds: allowedMatches.map((item) => item.capability.id),
    blueprint,
    outcomePlan,
    personalSwarm,
    translation: {
      sourceLocale: input.locale || null,
      targetLocale: input.targetLocale || null,
      bidirectional: true,
      text: true,
      speech: true,
      captions: true,
      targetNaturalLanguageCount: pantavionNaturalLanguageUniverse.targetNaturalLanguageCount,
      currentlyRegisteredLanguageCount: pantavionNaturalLanguageUniverse.currentPracticalLanguages.length,
      providerCoverageMustBeVerified: true,
      truthBoundary: pantavionNaturalLanguageUniverse.truthBoundary,
    },
    latencyBudget: PANTAVION_ADAPTIVE_CAPABILITY_FABRIC_V1.hotPath,
    truth: {
      instantRoutingDoesNotMeanInstantProductionBuild: true,
      buildMustUseDurableExecution: true,
      verifiedLiveRequiredBeforeUserReadyClaim: true,
      humanAuthorityPreserved: lifelong.humanAgencyRequired,
    },
  };
}
