import {
  resolvePantavionAdaptivePolicy,
  type PantavionAdaptiveFeature,
  type PantavionCountryAdaptiveRule,
  type PantavionAdaptivePolicyDecision,
} from "../core/governance/adaptive-ecosystem-policy";
import {
  selectUserServingPath,
  type KernelHierarchyNode,
  type KernelTier,
} from "./hierarchy";
import {
  electKernelLeader,
  type KernelElectionPolicy,
  type KernelElectionResult,
  type KernelNodeHealth,
  type KernelNodeRole,
  type KernelNodeStatus,
} from "./resilience";
import {
  evaluateKernelZeroTrustAccess,
  type KernelPrincipal,
  type KernelProtectedResource,
  type KernelZeroTrustDecision,
} from "./zero-trust";

export const PANTAVION_CONTINENTS = [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
] as const;

export type PantavionContinent = (typeof PANTAVION_CONTINENTS)[number];

export type PantavionExecutionRisk =
  | "read_only"
  | "state_mutation"
  | "high_risk";

export type PantavionControllerRole =
  | "root_controller"
  | "governance_controller"
  | "security_controller"
  | "regional_controller"
  | "domain_controller"
  | "worker";

export interface PantavionGlobalKernelNode {
  id: string;
  tier: KernelTier;
  parentId: string | null;
  domain?: string;
  topic?: string;
  jurisdiction?: string;
  ageBand?: string;
  capabilities: string[];
  healthy: boolean;
  priority: number;
  role: KernelNodeRole;
  status: KernelNodeStatus;
  epoch: number;
  lastHeartbeatAt: string;
  continent: PantavionContinent;
  controllerRole: PantavionControllerRole;
  countryScopes: string[];
  dataResidencyScopes?: string[];
}

export interface PantavionGlobalExecutionRequest {
  requestId: string;
  countryCode: string;
  continent: PantavionContinent;
  domain: string;
  topic?: string;
  feature: PantavionAdaptiveFeature;
  executionRisk: PantavionExecutionRisk;
  action: string;
  age?: number | null;
  birthDate?: string | null;
  elderSupportOptIn?: boolean;
  guardianConsent?: boolean;
  ageProof?: {
    verified: boolean;
    minimumAgeProven?: number;
  };
  countryRule?: PantavionCountryAdaptiveRule | null;
  requiredCapabilities?: string[];
  requiredDataResidency?: string | null;
  principal: KernelPrincipal;
  resource: KernelProtectedResource;
  transportAuthenticated: boolean;
  explicitlyDenied?: boolean;
}

export interface PantavionGlobalSafetyFabricDecision {
  requestId: string;
  status: "allowed" | "restricted" | "blocked";
  leader: KernelElectionResult;
  selectedLeaderId: string | null;
  servingPath: string[];
  selectedWorkerId: string | null;
  policy: PantavionAdaptivePolicyDecision;
  zeroTrust: KernelZeroTrustDecision;
  jurisdiction: {
    countryCode: string;
    continent: PantavionContinent;
    evidenceState:
      | "effective_verified"
      | "baseline_only"
      | "invalid_or_stale";
    ruleSourceRefs: string[];
    reviewRequired: boolean;
    preservedAcrossFailover: true;
  };
  failover: {
    occurred: boolean;
    crossContinent: boolean;
    jurisdictionChanged: false;
    reason: string;
  };
  safeguards: string[];
  reasons: string[];
}

const ACCESS_BLOCKING = new Set([
  "blocked",
  "requires_guardian",
  "requires_age_proof",
]);

const normalizeCountry = (value: string) => value.trim().toUpperCase();

const parseDateMs = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function validateJurisdictionEvidence(
  countryCode: string,
  rule: PantavionCountryAdaptiveRule | null | undefined,
  nowMs: number,
): {
  state: "effective_verified" | "baseline_only" | "invalid_or_stale";
  sourceRefs: string[];
  reviewRequired: boolean;
  reasons: string[];
} {
  if (!rule) {
    return {
      state: "baseline_only",
      sourceRefs: [],
      reviewRequired: true,
      reasons: ["country_rule_missing_safe_baseline_only"],
    };
  }

  const refs = Array.from(
    new Set((rule.sourceRefs ?? []).map((ref) => ref.trim()).filter(Boolean)),
  );
  const effectiveFromMs = parseDateMs(rule.effectiveFrom);
  const countryMatches = normalizeCountry(rule.countryCode) === countryCode;
  const effectiveNow = effectiveFromMs === null || effectiveFromMs <= nowMs;
  const verified =
    countryMatches &&
    rule.status === "effective" &&
    rule.enforcementEnabled === true &&
    refs.length > 0 &&
    effectiveNow;

  if (verified) {
    return {
      state: "effective_verified",
      sourceRefs: refs,
      reviewRequired: false,
      reasons: [],
    };
  }

  return {
    state: "invalid_or_stale",
    sourceRefs: refs,
    reviewRequired: true,
    reasons: [
      !countryMatches ? "country_rule_mismatch" : "",
      rule.status !== "effective" ? "country_rule_not_effective" : "",
      !rule.enforcementEnabled ? "country_rule_enforcement_disabled" : "",
      refs.length === 0 ? "country_rule_source_evidence_missing" : "",
      !effectiveNow ? "country_rule_not_yet_effective" : "",
    ].filter(Boolean),
  };
}

function selectEligibleNodes(
  nodes: PantavionGlobalKernelNode[],
  request: PantavionGlobalExecutionRequest,
): PantavionGlobalKernelNode[] {
  const countryCode = normalizeCountry(request.countryCode);
  const requiredResidency = request.requiredDataResidency?.trim() || null;

  return nodes.filter((node) => {
    const countryAllowed =
      node.countryScopes.includes("*") || node.countryScopes.includes(countryCode);
    const residencyAllowed =
      !requiredResidency ||
      node.dataResidencyScopes?.includes("*") ||
      node.dataResidencyScopes?.includes(requiredResidency);
    return countryAllowed && Boolean(residencyAllowed);
  });
}

function toHierarchyNodes(nodes: PantavionGlobalKernelNode[]): KernelHierarchyNode[] {
  return nodes.map((node) => ({
    id: node.id,
    tier: node.tier,
    parentId: node.parentId,
    domain: node.domain,
    topic: node.topic,
    jurisdiction: node.jurisdiction,
    ageBand: node.ageBand,
    capabilities: node.capabilities,
    healthy: node.healthy,
    priority: node.priority,
  }));
}

function toHealthNodes(nodes: PantavionGlobalKernelNode[]): KernelNodeHealth[] {
  return nodes.map((node) => ({
    id: node.id,
    role: node.role,
    status: node.status,
    priority: node.priority,
    epoch: node.epoch,
    lastHeartbeatAt: node.lastHeartbeatAt,
    parentId: node.parentId ?? undefined,
  }));
}

export function resolvePantavionGlobalSafetyFabric(input: {
  nodes: PantavionGlobalKernelNode[];
  currentLeaderId: string | null;
  electionPolicy: KernelElectionPolicy;
  request: PantavionGlobalExecutionRequest;
  nowMs?: number;
}): PantavionGlobalSafetyFabricDecision {
  const nowMs = input.nowMs ?? Date.now();
  const request = input.request;
  const countryCode = normalizeCountry(request.countryCode);
  const reasons: string[] = [];
  const safeguards = [
    "jurisdiction-follows-request-not-failover-node",
    "age-policy-is-monotonic-and-cannot-be-weakened-by-kernel-failover",
    "zero-trust-default-deny-remains-active-after-failover",
    "explicit-deny-overrides-health-capacity-and-priority",
    "country-law-evidence-required-for-state-mutation-and-high-risk-execution",
    "data-residency-scope-cannot-be-relaxed-by-failover",
    "no-quorum-means-no-execution",
  ];

  const jurisdictionEvidence = validateJurisdictionEvidence(
    countryCode,
    request.countryRule,
    nowMs,
  );
  reasons.push(...jurisdictionEvidence.reasons);

  const policy = resolvePantavionAdaptivePolicy({
    countryCode,
    feature: request.feature,
    age: request.age,
    birthDate: request.birthDate,
    now: new Date(nowMs),
    elderSupportOptIn: request.elderSupportOptIn,
    guardianConsent: request.guardianConsent,
    ageProof: request.ageProof,
    countryRule: request.countryRule,
  });

  const eligibleNodes = selectEligibleNodes(input.nodes, request);
  const controllerNodes = eligibleNodes.filter(
    (node) => node.controllerRole !== "worker",
  );
  const leader = electKernelLeader(
    toHealthNodes(controllerNodes),
    input.currentLeaderId,
    input.electionPolicy,
    nowMs,
  );

  if (!leader.leaderId) reasons.push(`kernel_control_unavailable:${leader.reason}`);

  const previousLeader = input.currentLeaderId
    ? input.nodes.find((node) => node.id === input.currentLeaderId)
    : null;
  const nextLeader = leader.leaderId
    ? input.nodes.find((node) => node.id === leader.leaderId)
    : null;
  const crossContinent = Boolean(
    leader.changed &&
      previousLeader &&
      nextLeader &&
      previousLeader.continent !== nextLeader.continent,
  );

  const hierarchyPath = selectUserServingPath(toHierarchyNodes(eligibleNodes), {
    domain: request.domain,
    topic: request.topic,
    jurisdiction: countryCode,
    ageBand: policy.ageRole.ageBand,
    requiredCapabilities: request.requiredCapabilities,
  });

  const workers = hierarchyPath
    .map((node) => eligibleNodes.find((candidate) => candidate.id === node.id))
    .filter((node): node is PantavionGlobalKernelNode => Boolean(node))
    .filter((node) => node.controllerRole === "worker");
  const selectedWorker = workers[0] ?? null;

  const executionNeedsVerifiedJurisdiction = request.executionRisk !== "read_only";
  const jurisdictionAllowed =
    policy.access !== "blocked" &&
    (!executionNeedsVerifiedJurisdiction ||
      jurisdictionEvidence.state === "effective_verified");

  if (ACCESS_BLOCKING.has(policy.access)) {
    reasons.push(`adaptive_policy_${policy.access}`);
  }
  if (
    executionNeedsVerifiedJurisdiction &&
    jurisdictionEvidence.state !== "effective_verified"
  ) {
    reasons.push("verified_jurisdiction_evidence_required");
  }
  if (!selectedWorker) reasons.push("eligible_worker_unavailable");

  const zeroTrust = evaluateKernelZeroTrustAccess(
    {
      requestId: request.requestId,
      principal: request.principal,
      resource: request.resource,
      action: request.action,
      transportAuthenticated: request.transportAuthenticated,
      jurisdictionAllowed,
      agePolicyAllowed: !ACCESS_BLOCKING.has(policy.access),
      explicitlyDenied: request.explicitlyDenied,
    },
    nowMs,
  );

  reasons.push(...zeroTrust.reasons.map((reason) => `zero_trust:${reason}`));

  const hardBlocked =
    !leader.leaderId ||
    !selectedWorker ||
    ACCESS_BLOCKING.has(policy.access) ||
    !zeroTrust.allowed ||
    (executionNeedsVerifiedJurisdiction &&
      jurisdictionEvidence.state !== "effective_verified");

  const status: PantavionGlobalSafetyFabricDecision["status"] = hardBlocked
    ? "blocked"
    : policy.access === "restricted" || jurisdictionEvidence.reviewRequired
      ? "restricted"
      : "allowed";

  return {
    requestId: request.requestId,
    status,
    leader,
    selectedLeaderId: leader.leaderId,
    servingPath: hierarchyPath.map((node) => node.id),
    selectedWorkerId: selectedWorker?.id ?? null,
    policy,
    zeroTrust,
    jurisdiction: {
      countryCode,
      continent: request.continent,
      evidenceState: jurisdictionEvidence.state,
      ruleSourceRefs: jurisdictionEvidence.sourceRefs,
      reviewRequired: jurisdictionEvidence.reviewRequired,
      preservedAcrossFailover: true,
    },
    failover: {
      occurred: leader.changed,
      crossContinent,
      jurisdictionChanged: false,
      reason: leader.reason,
    },
    safeguards,
    reasons: Array.from(new Set(reasons.filter(Boolean))),
  };
}
