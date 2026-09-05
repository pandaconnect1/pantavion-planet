import assert from "node:assert/strict";
import {
  authorizeAgentCapability,
  consumeAuthorizedBudget,
  createAgentBudgetGrant,
  revokeAgentBudgetGrant,
} from "../core/sovereign/agent-capability-budget-control.ts";

const base = {
  id: "grant-1",
  agentId: "agent-1",
  intentId: "intent-1",
  capabilities: [{ capability: "read:technology-library", scope: "technology-library", access: "read" }],
  budgetLimit: 10,
  issuedAt: "2026-09-05T20:00:00.000Z",
  expiresAt: "2026-09-05T21:00:00.000Z",
};

const grant = createAgentBudgetGrant(base);
assert.equal(grant.state, "active");
assert.equal(grant.spent, 0);

const allowed = authorizeAgentCapability(grant, {
  agentId: "agent-1",
  intentId: "intent-1",
  capability: "read:technology-library",
  scope: "technology-library",
  access: "read",
  cost: 4,
  now: "2026-09-05T20:15:00.000Z",
});
assert.equal(allowed.allowed, true);
assert.equal(allowed.remainingBudget, 10);

const consumed = consumeAuthorizedBudget(grant, {
  agentId: "agent-1",
  intentId: "intent-1",
  capability: "read:technology-library",
  scope: "technology-library",
  access: "read",
  cost: 4,
  now: "2026-09-05T20:15:00.000Z",
});
assert.equal(consumed.spent, 4);

const deniedBudget = authorizeAgentCapability(consumed, {
  agentId: "agent-1",
  intentId: "intent-1",
  capability: "read:technology-library",
  scope: "technology-library",
  access: "read",
  cost: 7,
  now: "2026-09-05T20:16:00.000Z",
});
assert.equal(deniedBudget.allowed, false);
assert.ok(deniedBudget.reasons.includes("budget_exceeded"));
assert.equal(deniedBudget.remainingBudget, 6);

const deniedScope = authorizeAgentCapability(grant, {
  agentId: "agent-1",
  intentId: "intent-1",
  capability: "write:technology-library",
  scope: "technology-library",
  access: "write",
  cost: 1,
  now: "2026-09-05T20:15:00.000Z",
});
assert.equal(deniedScope.allowed, false);
assert.ok(deniedScope.reasons.includes("capability_or_scope_not_granted"));

const revoked = revokeAgentBudgetGrant(grant);
const deniedRevoked = authorizeAgentCapability(revoked, {
  agentId: "agent-1",
  intentId: "intent-1",
  capability: "read:technology-library",
  scope: "technology-library",
  access: "read",
  cost: 1,
  now: "2026-09-05T20:15:00.000Z",
});
assert.equal(deniedRevoked.allowed, false);
assert.ok(deniedRevoked.reasons.includes("grant_revoked"));

console.log("sovereign capability/budget boundary contract: ok");
