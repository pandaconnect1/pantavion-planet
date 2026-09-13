import { strict as assert } from "node:assert";

import {
  authorizeAgentCapability,
  consumeAuthorizedBudget,
  createAgentBudgetGrant,
} from "../core/sovereign/agent-capability-budget-control.ts";
import {
  createDisconnectedExecutionPacket,
  verifyDisconnectedExecutionPacket,
} from "../core/sovereign/edge-execution.ts";
import { evaluateIntentFirewall } from "../core/sovereign/intent-firewall.ts";

const grant = createAgentBudgetGrant({
  id: "grant_edge_boundary",
  agentId: "agent_edge_boundary",
  intentId: "intent_edge_boundary",
  capabilities: [
    { capability: "classify", scope: "recovery/corpus", access: "read" },
  ],
  budgetLimit: 2,
  issuedAt: "2026-09-04T00:00:00.000Z",
  expiresAt: "2026-09-04T01:00:00.000Z",
});

const request = {
  agentId: "agent_edge_boundary",
  intentId: "intent_edge_boundary",
  capability: "classify",
  scope: "recovery/corpus",
  access: "read",
  cost: 1,
  now: "2026-09-04T00:30:00.000Z",
};

assert.equal(authorizeAgentCapability(grant, request).allowed, true);
const consumed = consumeAuthorizedBudget(grant, request);
assert.equal(consumed.spent, 1);
assert.equal(
  authorizeAgentCapability(consumed, { ...request, cost: 2 }).allowed,
  false,
  "A grant must fail closed when the remaining budget is insufficient.",
);
assert.equal(
  authorizeAgentCapability(grant, { ...request, intentId: "different_intent" }).allowed,
  false,
  "Capability grants must not cross intent boundaries.",
);
assert.equal(
  authorizeAgentCapability(grant, { ...request, now: "2026-09-04T01:00:01.000Z" }).allowed,
  false,
  "Expired capability grants must fail closed.",
);

const edgePolicy = {
  allowedCapabilities: ["classify"],
  maximumPayloadBytes: 1024,
};
const edgeTask = {
  id: "edge_boundary_task",
  intentId: "intent_edge_boundary",
  capability: "classify",
  payload: { batch: 1, mode: "verify" },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-09-04T00:00:00.000Z",
  expiresAt: "2026-09-04T01:00:00.000Z",
};
const packet = createDisconnectedExecutionPacket(edgeTask, edgePolicy);
assert.equal(
  verifyDisconnectedExecutionPacket(packet, "2026-09-04T00:30:00.000Z", edgePolicy).valid,
  true,
);
assert.equal(
  verifyDisconnectedExecutionPacket(
    packet,
    "2026-09-04T00:30:00.000Z",
    edgePolicy,
    new Set([packet.payloadDigest]),
  ).valid,
  false,
  "A consumed disconnected packet must be rejected on replay.",
);
assert.throws(
  () =>
    createDisconnectedExecutionPacket(
      { ...edgeTask, writesProduction: true },
      edgePolicy,
    ),
  "Disconnected execution must never authorize production writes.",
);

const firewallPolicy = {
  allowedJurisdictions: ["CY", "EU"],
  automaticCapabilities: ["classify"],
  maximumAutomaticCost: 2,
  ownerApprovalRisks: ["high", "critical"],
  requireConsentForSensitiveData: true,
  productionMutationMode: "owner_approval",
  publicExposureMode: "owner_approval",
};
const safeIntent = {
  intentId: "intent_edge_boundary",
  actorId: "founder_test",
  actorKind: "founder",
  jurisdiction: "CY",
  capabilities: ["classify"],
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
assert.equal(evaluateIntentFirewall(safeIntent, firewallPolicy).disposition, "allow");
assert.equal(
  evaluateIntentFirewall({ ...safeIntent, writesProduction: true }, firewallPolicy).disposition,
  "owner_approval",
  "Production mutation must stop at the explicit owner gate.",
);
assert.equal(
  evaluateIntentFirewall({ ...safeIntent, jurisdiction: "US" }, firewallPolicy).disposition,
  "deny",
  "An unlisted jurisdiction must fail closed.",
);

console.log("pantavion-sovereign-capability-edge-boundaries-test: PASS");
