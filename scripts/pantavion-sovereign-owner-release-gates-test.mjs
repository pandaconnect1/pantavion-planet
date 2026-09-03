import { evaluateIntentFirewall } from "../core/sovereign/intent-firewall.ts";
import { createAgentBudgetGrant, authorizeAgentCapability } from "../core/sovereign/agent-capability-budget-control.ts";
import { createDisconnectedExecutionPacket, verifyDisconnectedExecutionPacket } from "../core/sovereign/edge-execution.ts";
import { assessTechnologyLibraryEntry } from "../core/sovereign/technology-library.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const policy = {
  allowedJurisdictions: ["CY", "EU"],
  automaticCapabilities: ["read"],
  maximumAutomaticCost: 2,
  ownerApprovalRisks: ["high", "critical"],
  requireConsentForSensitiveData: true,
  productionMutationMode: "owner_approval",
  publicExposureMode: "owner_approval",
};

const safeRequest = {
  intentId: "intent_owner_gate",
  actorId: "founder_test",
  actorKind: "founder",
  jurisdiction: "CY",
  capabilities: ["read"],
  dataClasses: ["private"],
  estimatedCost: 1,
  risk: "low",
  reversible: true,
  legalConsentRecorded: true,
  writesProduction: false,
  publishesToUsers: false,
  sendsExternalMessage: false,
  changesIdentityOrAccess: false,
};

assert(evaluateIntentFirewall(safeRequest, policy).disposition === "allow", "Safe owner-scoped request must be allowed.");
assert(
  evaluateIntentFirewall({ ...safeRequest, writesProduction: true }, policy).disposition === "owner_approval",
  "Production mutation must stop at owner approval.",
);
assert(
  evaluateIntentFirewall({ ...safeRequest, publishesToUsers: true }, policy).disposition === "owner_approval",
  "Public exposure must stop at owner approval.",
);
assert(
  evaluateIntentFirewall({ ...safeRequest, jurisdiction: "US" }, policy).disposition === "deny",
  "Unlisted jurisdiction must fail closed.",
);

const grant = createAgentBudgetGrant({
  id: "grant_owner_gate",
  agentId: "agent_owner_gate",
  intentId: "intent_owner_gate",
  capabilities: [{ capability: "read", scope: "recovery/corpus", access: "read" }],
  budgetLimit: 2,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});
assert(
  authorizeAgentCapability(grant, {
    agentId: "agent_owner_gate",
    intentId: "intent_owner_gate",
    capability: "read",
    scope: "recovery/corpus",
    access: "read",
    cost: 2,
    now: "2026-08-27T21:00:00.000Z",
  }).allowed,
  "Exact budget boundary must remain usable.",
);
assert(
  !authorizeAgentCapability(grant, {
    agentId: "agent_owner_gate",
    intentId: "intent_other",
    capability: "read",
    scope: "recovery/corpus",
    access: "read",
    cost: 1,
    now: "2026-08-27T21:00:00.000Z",
  }).allowed,
  "Cross-intent capability use must fail closed.",
);

const edgeTask = {
  id: "edge_owner_gate",
  intentId: "intent_owner_gate",
  capability: "read",
  payload: { mode: "verify" },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
};
const edgePolicy = { allowedCapabilities: ["read"], maximumPayloadBytes: 512 };
const packet = createDisconnectedExecutionPacket(edgeTask, edgePolicy);
assert(verifyDisconnectedExecutionPacket(packet, "2026-08-27T21:00:00.000Z", edgePolicy).valid, "Valid offline packet must verify.");
assert(
  !verifyDisconnectedExecutionPacket(packet, "2026-08-28T20:00:01.000Z", edgePolicy).valid,
  "Expired offline packet must fail closed.",
);

const technology = {
  id: "tech_owner_gate",
  name: "Owner-gated technology",
  capability: "read",
  source: "open_source",
  maturity: "prototype",
  licenseId: "Apache-2.0",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: [
    { kind: "source", reference: "source-digest", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "security", reference: "security-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "privacy", reference: "privacy-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "license", reference: "Apache-2.0", observedAt: "2026-08-27T20:00:00.000Z" },
  ],
};
const assessment = assessTechnologyLibraryEntry(technology);
assert(assessment.deploymentAuthorized === false, "Technology readiness must never authorize deployment.");
assert(assessment.readiness === "hold", "Incomplete evidence must remain on hold.");

console.log("sovereign owner/release gate contract checks passed");
