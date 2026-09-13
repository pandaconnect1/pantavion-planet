import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  AGENT_BUDGET_ASSESSMENT_POLICY,
  AGENT_BUDGET_ASSESSMENT_SCHEMA,
  createFounderAgentBudgetAssessment,
  parseAgentBudgetAssessment,
} from "../core/sovereign/founder-agent-budget-assessment.ts";

let assertions = 0;
function check(condition, message) {
  assert.ok(condition, message);
  assertions += 1;
}
function equal(actual, expected, message) {
  assert.equal(actual, expected, message);
  assertions += 1;
}
function rejects(input, fragment) {
  assert.throws(() => parseAgentBudgetAssessment(input), new RegExp(fragment));
  assertions += 1;
}

const base = {
  grantId: "grant-001",
  agentId: "agent-001",
  intentId: "intent-001",
  capabilities: [
    { capability: "verify_evidence", scope: "technology_library", access: "read" },
  ],
  budgetLimit: 100,
  spent: 25,
  issuedAt: "2026-09-09T10:00:00.000Z",
  expiresAt: "2026-09-09T18:00:00.000Z",
  requestCapability: "verify_evidence",
  requestScope: "technology_library",
  requestAccess: "read",
  requestCost: 10,
  requestAt: "2026-09-09T12:00:00.000Z",
};

const allowed = createFounderAgentBudgetAssessment(base);
equal(allowed.schema, AGENT_BUDGET_ASSESSMENT_SCHEMA, "schema");
equal(allowed.policyVersion, AGENT_BUDGET_ASSESSMENT_POLICY, "policy");
equal(allowed.decision.eligible, true, "eligible request");
equal(allowed.decision.reasons.length, 0, "eligible reasons");
equal(allowed.decision.remainingBudget, 75, "remaining budget before hypothetical request");
equal(allowed.grantState, "withheld_pending_owner_admission", "grant withheld");
equal(allowed.assessmentOnly, true, "assessment-only");
equal(allowed.executionAllowed, false, "execution blocked");
equal(allowed.budgetConsumed, false, "budget not consumed");
equal(allowed.authorizationEffect, "none", "no authorization");
check(/^[a-f0-9]{64}$/.test(allowed.receiptSha256), "receipt format");

const repeated = createFounderAgentBudgetAssessment(structuredClone(base));
equal(repeated.receiptSha256, allowed.receiptSha256, "deterministic receipt");
const changed = createFounderAgentBudgetAssessment({ ...base, requestCost: 11 });
check(changed.receiptSha256 !== allowed.receiptSha256, "request-bound receipt");

const wrongScope = createFounderAgentBudgetAssessment({ ...base, requestScope: "production" });
equal(wrongScope.decision.eligible, false, "scope widening blocked");
check(wrongScope.decision.reasons.includes("capability_or_scope_not_granted"), "scope blocker");
equal(wrongScope.executionAllowed, false, "scope failure cannot execute");

const write = createFounderAgentBudgetAssessment({ ...base, requestAccess: "write" });
equal(write.decision.eligible, false, "write widening blocked");
check(write.decision.reasons.includes("write_not_granted"), "write blocker");

const overBudget = createFounderAgentBudgetAssessment({ ...base, requestCost: 76 });
equal(overBudget.decision.eligible, false, "over budget blocked");
check(overBudget.decision.reasons.includes("budget_exceeded"), "budget blocker");
equal(overBudget.decision.remainingBudget, 75, "budget evidence stable");
equal(overBudget.budgetConsumed, false, "denied request consumes nothing");

const expired = createFounderAgentBudgetAssessment({
  ...base,
  requestAt: "2026-09-09T18:00:00.000Z",
});
equal(expired.decision.eligible, false, "expiry boundary blocked");
check(expired.decision.reasons.includes("grant_expired"), "expiry blocker");

const future = createFounderAgentBudgetAssessment({
  ...base,
  requestAt: "2026-09-09T09:59:59.000Z",
});
check(future.decision.reasons.includes("grant_not_yet_active"), "not-yet-active blocker");

rejects(null, "object_required");
rejects({ ...base, extra: true }, "unknown_request_field");
rejects({ ...base, capabilities: [] }, "capability_count");
rejects({ ...base, capabilities: [{ ...base.capabilities[0], extra: true }] }, "unknown_capability_field");
rejects({ ...base, capabilities: [base.capabilities[0], base.capabilities[0]] }, "duplicate_capability_scope");
rejects({ ...base, budgetLimit: -1 }, "budgetLimit");
rejects({ ...base, spent: Number.NaN }, "spent");
rejects({ ...base, issuedAt: "invalid" }, "issuedAt");
rejects({ ...base, expiresAt: base.issuedAt }, "expiry_order");
rejects({ ...base, requestAccess: "admin" }, "requestAccess");
rejects({ ...base, requestCost: "10" }, "requestCost");
rejects({ ...base, agentId: "" }, "agentId_length");

const route = readFileSync("app/api/owner/agent-budget/assess/route.ts", "utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"), "API founder gate");
check(route.includes('currentLevel !== "aal2"'), "API AAL2 gate");
check(route.includes("MAX_REQUEST_BYTES = 16_384"), "API body limit");
check(route.includes('"Cache-Control": "no-store, max-age=0"'), "API no-store");
check(!route.includes(".from(") && !route.includes("consumeAuthorizedBudget"), "API has no mutation path");

const page = readFileSync("app/owner/control/agent-budget/page.tsx", "utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"), "page founder gate");
check(page.includes('currentLevel !== "aal2"'), "page AAL2 gate");

const client = readFileSync("app/owner/control/agent-budget/agent-budget-client.tsx", "utf8");
check(client.includes('aria-live="polite"'), "accessible result region");
check(client.includes("withheld") || client.includes("grantState"), "withheld state visible");
check(client.includes("executionAllowed"), "execution boundary visible");
check(client.includes("budgetConsumed"), "budget consumption boundary visible");

console.log(`Agent capability/budget workbench contract: PASS (${assertions} assertions)`);
