import type { PantavionEcosystemServiceId } from "./pantavion-ecosystem-cell-factory";
import type { PantavionOwnedAgentRole } from "./pantavion-agent-factory";

export type PantavionElasticCapabilityRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type PantavionElasticCapabilityDomain =
  | "known_module"
  | "new_human_need"
  | "scientific"
  | "health"
  | "security"
  | "infrastructure"
  | "education"
  | "communication"
  | "creative"
  | "commerce"
  | "mobility"
  | "space"
  | "research"
  | "future_unknown";

export interface PantavionElasticCapabilityRequest {
  requestId: string;
  userIntent: string;
  userOutcome: string;
  domain: PantavionElasticCapabilityDomain;
  risk: PantavionElasticCapabilityRisk;
  requestedBy: "user" | "founder" | "system_research";
  requiresRealtime: boolean;
  requiresPrivateData: boolean;
  requiresExternalProvider: boolean;
  requiresPhysicalWorldAction: boolean;
  requiresRegulatedDecisionSupport: boolean;
}

export interface PantavionElasticCapabilityPlan {
  marker: "pantavion_elastic_capability_plan_v1";
  requestId: string;
  capabilityId: string;
  namespace: "pantavion_dynamic";
  userIntent: string;
  userOutcome: string;
  domain: PantavionElasticCapabilityDomain;
  risk: PantavionElasticCapabilityRisk;
  lifecycle: [
    "INTAKE",
    "CLASSIFIED",
    "CANONICAL_SPEC",
    "AGENT_PLAN",
    "BUILD",
    "TEST",
    "SECURITY_REVIEW",
    "CANARY",
    "DEPLOY",
    "VERIFIED_LIVE",
  ];
  requiredServices: PantavionEcosystemServiceId[];
  requiredAgentRoles: PantavionOwnedAgentRole[];
  requiredEvidence: string[];
  authority: {
    mayResearch: true;
    mayPlan: true;
    mayDraftInternalImplementation: true;
    mayDeployAutomatically: false;
    mayPerformIrreversibleActionAutomatically: false;
    mayEscalateToHuman: true;
  };
  realtimeTarget: {
    userAcknowledgementMs: 250;
    routingDecisionMs: 1000;
    cachedKnownCapabilityTargetMs: 1000;
    novelCapabilityPlanTargetMs: 5000;
    truthBoundary: string;
  };
  generatedAt: string;
}

function slug(input: string): string {
  const normalized = input
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return normalized || "capability";
}

function servicesFor(input: PantavionElasticCapabilityRequest): PantavionEcosystemServiceId[] {
  const services = new Set<PantavionEcosystemServiceId>([
    "identity_trust",
    "knowledge_memory_graph",
    "safety_governance",
    "workflow_agent_fabric",
    "observability_evidence",
    "experience_accessibility",
  ]);

  if (
    input.domain === "communication" ||
    /language|translation|voice|chat|message|interpreter/i.test(input.userIntent)
  ) {
    services.add("communication_language");
  }

  if (
    input.domain === "mobility" ||
    input.domain === "infrastructure" ||
    /map|location|travel|city|water|space/i.test(input.userIntent)
  ) {
    services.add("discovery_maps_local");
  }

  if (
    input.domain === "commerce" ||
    /payment|price|market|business|subscription|entitlement/i.test(input.userIntent)
  ) {
    services.add("commerce_entitlements");
  }

  if (/people|family|friend|community|caregiver|relationship/i.test(input.userIntent)) {
    services.add("people_relationships");
  }

  return [...services];
}

function rolesFor(input: PantavionElasticCapabilityRequest): PantavionOwnedAgentRole[] {
  const roles = new Set<PantavionOwnedAgentRole>([
    "orchestrator",
    "sentinel",
    "classifier",
    "planner",
    "researcher",
    "builder",
    "auditor",
    "verifier",
    "repairer",
    "memory_guard",
  ]);

  if (input.risk === "low" && !input.requiresPrivateData && !input.requiresPhysicalWorldAction) {
    roles.delete("repairer");
  }

  return [...roles];
}

export function createPantavionElasticCapabilityPlan(
  input: PantavionElasticCapabilityRequest,
): PantavionElasticCapabilityPlan {
  if (!input.requestId.trim()) throw new Error("requestId is required");
  if (!input.userIntent.trim()) throw new Error("userIntent is required");
  if (!input.userOutcome.trim()) throw new Error("userOutcome is required");

  const requiredEvidence = [
    "canonical intent and acceptance criteria",
    "identity/consent/authority decision",
    "provenance-bound data and dependency plan",
    "real backend or deterministic execution path",
    "mobile-accessible truthful user flow",
    "security and privacy review",
    "automated tests and failure-path tests",
    "observability and rollback evidence",
    "canary evidence when production-impacting",
    "VERIFIED_LIVE evidence before full completion claim",
  ];

  if (input.requiresRegulatedDecisionSupport) {
    requiredEvidence.push(
      "domain-specific professional/regulatory boundary",
      "uncertainty and non-substitution disclosure",
    );
  }

  if (input.requiresPhysicalWorldAction) {
    requiredEvidence.push(
      "physical-world authority and safety boundary",
      "human confirmation before irreversible actuation",
    );
  }

  return {
    marker: "pantavion_elastic_capability_plan_v1",
    requestId: input.requestId,
    capabilityId: `pcap-${slug(input.userOutcome)}`,
    namespace: "pantavion_dynamic",
    userIntent: input.userIntent,
    userOutcome: input.userOutcome,
    domain: input.domain,
    risk: input.risk,
    lifecycle: [
      "INTAKE",
      "CLASSIFIED",
      "CANONICAL_SPEC",
      "AGENT_PLAN",
      "BUILD",
      "TEST",
      "SECURITY_REVIEW",
      "CANARY",
      "DEPLOY",
      "VERIFIED_LIVE",
    ],
    requiredServices: servicesFor(input),
    requiredAgentRoles: rolesFor(input),
    requiredEvidence,
    authority: {
      mayResearch: true,
      mayPlan: true,
      mayDraftInternalImplementation: true,
      mayDeployAutomatically: false,
      mayPerformIrreversibleActionAutomatically: false,
      mayEscalateToHuman: true,
    },
    realtimeTarget: {
      userAcknowledgementMs: 250,
      routingDecisionMs: 1000,
      cachedKnownCapabilityTargetMs: 1000,
      novelCapabilityPlanTargetMs: 5000,
      truthBoundary:
        "Latency targets are architecture SLOs, not guaranteed end-to-end response times. Novel regulated, physical-world, provider-dependent or build-heavy capabilities may require longer execution and explicit verification.",
    },
    generatedAt: new Date().toISOString(),
  };
}

export const PANTAVION_ELASTIC_CAPABILITY_FACTORY = {
  marker: "pantavion_elastic_capability_factory_v1",
  principle:
    "Pantavion modules are extensible cells, not a closed catalog. A previously unknown human need becomes a governed capability plan attached to the shared Pantavion spine.",
  unknownFutureDomainsAllowed: true,
  fixedCoreServicesRemainStable: true,
  generatedCapabilitiesRequireEvidence: true,
  generatedCapabilitiesMayBypassSafety: false,
  generatedCapabilitiesMaySelfDeploy: false,
  noStaticPlaceholderCompletion: true,
} as const;
