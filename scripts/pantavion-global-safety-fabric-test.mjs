import assert from "node:assert/strict";

import {
  PANTAVION_CONTINENTS,
  resolvePantavionGlobalSafetyFabric,
} from "../kernel/global-safety-fabric.ts";

const now = Date.parse("2026-08-29T09:45:00.000Z");

assert.deepEqual(PANTAVION_CONTINENTS, [
  "Africa",
  "Antarctica",
  "Asia",
  "Europe",
  "North America",
  "Oceania",
  "South America",
]);
assert.equal(PANTAVION_CONTINENTS.length, 7);

const node = (overrides = {}) => ({
  id: "node",
  tier: "worker",
  parentId: "root-eu",
  domain: "personal_ai",
  capabilities: ["execute"],
  healthy: true,
  priority: 50,
  role: "worker",
  status: "healthy",
  epoch: 4,
  lastHeartbeatAt: new Date(now - 1_000).toISOString(),
  continent: "Europe",
  controllerRole: "worker",
  countryScopes: ["CY"],
  dataResidencyScopes: ["EU"],
  ...overrides,
});

const nodes = [
  node({
    id: "root-eu",
    tier: "root",
    parentId: null,
    domain: undefined,
    role: "leader",
    controllerRole: "root_controller",
    priority: 100,
    status: "unreachable",
    healthy: false,
    lastHeartbeatAt: new Date(now - 120_000).toISOString(),
  }),
  node({
    id: "standby-na",
    tier: "governance",
    parentId: "root-eu",
    domain: undefined,
    role: "standby",
    controllerRole: "governance_controller",
    continent: "North America",
    priority: 90,
    dataResidencyScopes: ["EU", "US"],
  }),
  node({
    id: "security-eu",
    tier: "governance",
    parentId: "root-eu",
    domain: undefined,
    role: "supervisor",
    controllerRole: "security_controller",
    priority: 80,
  }),
  node({
    id: "worker-eu",
    tier: "worker",
    parentId: "security-eu",
    jurisdiction: "CY",
    role: "worker",
    controllerRole: "worker",
    priority: 70,
  }),
];

const effectiveCyRule = {
  countryCode: "CY",
  status: "effective",
  enforcementEnabled: true,
  sourceRefs: ["test://official-effective-country-rule"],
  effectiveFrom: "2026-01-01T00:00:00.000Z",
};

const principal = {
  id: "user-1",
  type: "user",
  authenticated: true,
  credentialExpiresAt: new Date(now + 60_000).toISOString(),
  tenantId: "tenant-1",
  grants: [
    {
      grantId: "grant-1",
      actions: ["execute"],
      resourceIds: ["artifact-1"],
      environments: ["production"],
    },
  ],
};

const resource = {
  id: "artifact-1",
  tenantId: "tenant-1",
  environment: "production",
  sensitivity: "restricted",
};

const baseRequest = {
  requestId: "request-1",
  countryCode: "CY",
  continent: "Europe",
  domain: "personal_ai",
  feature: "ai_assistant",
  executionRisk: "state_mutation",
  action: "execute",
  age: 30,
  countryRule: effectiveCyRule,
  requiredCapabilities: ["execute"],
  requiredDataResidency: "EU",
  principal,
  resource,
  transportAuthenticated: true,
};

const failover = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: baseRequest,
  nowMs: now,
});

assert.equal(failover.status, "allowed");
assert.equal(failover.selectedLeaderId, "standby-na");
assert.equal(failover.selectedWorkerId, "worker-eu");
assert.equal(failover.failover.occurred, true);
assert.equal(failover.failover.crossContinent, true);
assert.equal(failover.failover.jurisdictionChanged, false);
assert.equal(failover.jurisdiction.countryCode, "CY");
assert.equal(failover.jurisdiction.continent, "Europe");
assert.equal(failover.jurisdiction.preservedAcrossFailover, true);
assert.equal(failover.jurisdiction.evidenceState, "effective_verified");
assert.equal(failover.zeroTrust.allowed, true);

const missingLegalEvidence = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: {
    ...baseRequest,
    requestId: "request-2",
    countryRule: { ...effectiveCyRule, sourceRefs: [] },
  },
  nowMs: now,
});
assert.equal(missingLegalEvidence.status, "blocked");
assert.equal(missingLegalEvidence.jurisdiction.evidenceState, "invalid_or_stale");
assert.ok(missingLegalEvidence.reasons.includes("verified_jurisdiction_evidence_required"));
assert.ok(missingLegalEvidence.reasons.includes("country_rule_source_evidence_missing"));

const readOnlyBaseline = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: {
    ...baseRequest,
    requestId: "request-3",
    executionRisk: "read_only",
    countryRule: null,
  },
  nowMs: now,
});
assert.equal(readOnlyBaseline.status, "restricted");
assert.equal(readOnlyBaseline.jurisdiction.evidenceState, "baseline_only");
assert.equal(readOnlyBaseline.jurisdiction.reviewRequired, true);

const minorDating = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: {
    ...baseRequest,
    requestId: "request-4",
    feature: "dating",
    executionRisk: "high_risk",
    age: 16,
    ageProof: { verified: true, minimumAgeProven: 16 },
    countryRule: { ...effectiveCyRule, minimumDatingAge: 18 },
  },
  nowMs: now,
});
assert.equal(minorDating.status, "blocked");
assert.equal(minorDating.policy.access, "blocked");
assert.ok(minorDating.reasons.includes("adaptive_policy_blocked"));

const tenantMismatch = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: {
    ...baseRequest,
    requestId: "request-5",
    resource: { ...resource, tenantId: "tenant-2" },
  },
  nowMs: now,
});
assert.equal(tenantMismatch.status, "blocked");
assert.ok(tenantMismatch.reasons.includes("zero_trust:tenant_isolation_denied"));

const noQuorumNodes = nodes.map((item) =>
  item.id === "security-eu"
    ? {
        ...item,
        status: "unreachable",
        healthy: false,
        lastHeartbeatAt: new Date(now - 120_000).toISOString(),
      }
    : item,
);
const noQuorum = resolvePantavionGlobalSafetyFabric({
  nodes: noQuorumNodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: { ...baseRequest, requestId: "request-6" },
  nowMs: now,
});
assert.equal(noQuorum.status, "blocked");
assert.equal(noQuorum.selectedLeaderId, null);
assert.equal(noQuorum.leader.reason, "quorum_unavailable");
assert.ok(noQuorum.reasons.includes("kernel_control_unavailable:quorum_unavailable"));

const explicitDeny = resolvePantavionGlobalSafetyFabric({
  nodes,
  currentLeaderId: "root-eu",
  electionPolicy: { heartbeatTimeoutMs: 30_000, minimumHealthyVoters: 2 },
  request: { ...baseRequest, requestId: "request-7", explicitlyDenied: true },
  nowMs: now,
});
assert.equal(explicitDeny.status, "blocked");
assert.ok(explicitDeny.reasons.includes("zero_trust:explicit_deny"));

console.log("PANTAVION GLOBAL MULTI-KERNEL SAFETY FABRIC: PASSED");
console.log("- seven-continent topology contract: yes");
console.log("- cross-continent failover preserves request jurisdiction: yes");
console.log("- state mutation requires evidence-backed effective country rule: yes");
console.log("- age/minor restrictions remain monotonic across failover: yes");
console.log("- zero-trust and tenant isolation remain fail-closed: yes");
console.log("- no quorum means no execution: yes");
