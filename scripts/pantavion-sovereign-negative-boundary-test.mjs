import { evaluateIntentFirewall } from "../core/sovereign/intent-firewall.ts";
import {
  authorizeAgentCapability,
  createAgentBudgetGrant,
} from "../core/sovereign/agent-capability-budget-control.ts";
import {
  activateEphemeralAgent,
  canAgentUseCapability,
  createEphemeralAgent,
} from "../core/sovereign/ephemeral-agent-swarm.ts";
import {
  createDisconnectedExecutionPacket,
  verifyDisconnectedExecutionPacket,
} from "../core/sovereign/edge-execution.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const policy = {
  allowedJurisdictions: ["CY", "EU"],
  automaticCapabilities: ["classify"],
  maximumAutomaticCost: 5,
  ownerApprovalRisks: ["high", "critical"],
  requireConsentForSensitiveData: true,
  productionMutationMode: "owner_approval",
  publicExposureMode: "owner_approval",
};

const baseIntent = {
  intentId: "intent_negative_boundary",
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

assert(
  evaluateIntentFirewall({ ...baseIntent, jurisdiction: "US" }, policy).disposition === "deny",
  "A jurisdiction outside policy must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...baseIntent, capabilities: ["unknown_capability"] }, policy).disposition === "deny",
  "An unknown capability must fail closed.",
);
assert(
  evaluateIntentFirewall({ ...baseIntent, estimatedCost: 6 }, policy).disposition === "owner_approval",
  "A cost above the automatic threshold must stop at owner approval.",
);

const grant = createAgentBudgetGrant({
  id: "grant_negative",
  agentId: "agent_negative",
  intentId: baseIntent.intentId,
  capabilities: [{ capability: "classify", scope: "recovery/corpus", access: "read" }],
  budgetLimit: 2,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});

assert(
  !authorizeAgentCapability(grant, {
    agentId: "agent_other",
    intentId: baseIntent.intentId,
    capability: "classify",
    scope: "recovery/corpus",
    access: "read",
    cost: 1,
    now: "2026-08-27T21:00:00.000Z",
  }).allowed,
  "A grant must not cross agent identity boundaries.",
);
assert(
  !authorizeAgentCapability(grant, {
    agentId: grant.agentId,
    intentId: baseIntent.intentId,
    capability: "classify",
    scope: "recovery/other",
    access: "read",
    cost: 1,
    now: "2026-08-27T21:00:00.000Z",
  }).allowed,
  "A grant must not cross scope boundaries.",
);
assert(
  !authorizeAgentCapability(grant, {
    agentId: grant.agentId,
    intentId: baseIntent.intentId,
    capability: "classify",
    scope: "recovery/corpus",
    access: "read",
    cost: 1,
    now: "2026-08-29T21:00:00.000Z",
  }).allowed,
  "An expired grant must fail closed.",
);

const agent = createEphemeralAgent({
  id: "agent_negative",
  parentIntentId: baseIntent.intentId,
  role: "verifier",
  capabilities: [{ capability: "classify", scope: "recovery/corpus", expiresAt: "2026-08-28T20:00:00.000Z" }],
  budget: 2,
  createdAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
});
assert(
  !canAgentUseCapability(agent, "classify", "recovery/corpus", new Date("2026-08-27T21:00:00.000Z")),
  "An unactivated ephemeral agent must not execute.",
);
const activated = activateEphemeralAgent(agent, new Date("2026-08-27T21:00:00.000Z"));
assert(
  !canAgentUseCapability(activated, "classify", "recovery/corpus", new Date("2026-08-29T21:00:00.000Z")),
  "An expired ephemeral agent must not execute.",
);

const edgeTask = {
  id: "edge_negative",
  intentId: baseIntent.intentId,
  capability: "classify",
  payload: { batch: 1 },
  deterministic: true,
  reversible: true,
  requiresNetwork: false,
  writesProduction: false,
  issuedAt: "2026-08-27T20:00:00.000Z",
  expiresAt: "2026-08-28T20:00:00.000Z",
};
const edgePolicy = { allowedCapabilities: ["classify"], maximumPayloadBytes: 1024 };
const packet = createDisconnectedExecutionPacket(edgeTask, edgePolicy);
assert(
  !verifyDisconnectedExecutionPacket(packet, "2026-08-29T21:00:00.000Z", edgePolicy).valid,
  "An expired offline packet must fail closed.",
);
expectThrows(
  () => createDisconnectedExecutionPacket({ ...edgeTask, capability: "unknown_capability" }, edgePolicy),
  "An offline packet with an unauthorized capability must be rejected.",
);
