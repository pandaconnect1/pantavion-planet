import { compileOutcomePlan } from "../core/sovereign/intent-to-outcome-fabric.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const safeRequest = {
  intentId: "intent_determinism_test",
  actorId: "founder_test",
  objective: "classify recovered material",
  capabilities: ["classify", "read"],
  jurisdiction: "CY",
  dataClasses: ["private"],
  estimatedCost: 2,
  reversible: true,
  legalConsentRecorded: true,
  writesProduction: false,
  publishesToUsers: false,
  sendsExternalMessage: false,
  changesIdentityOrAccess: false,
  steps: [
    { id: "read", capability: "read", description: "Read bounded recovery batch", cost: 1 },
    { id: "classify", capability: "classify", description: "Classify without mutation", cost: 1 },
  ],
};

const first = compileOutcomePlan(safeRequest);
const second = compileOutcomePlan(JSON.parse(JSON.stringify(safeRequest)));

assert(first.intentId === safeRequest.intentId, "Plan must preserve the intent identity.");
assert(first.state === "ready", "Safe deterministic intent must compile to ready.");
assert(first.blockers.length === 0, "Safe deterministic intent must have no blockers.");
assert(first.requiresOwnerApproval === false, "Read/classify recovery work must not require owner approval.");
assert(first.estimatedCost === 2, "Compiled plan must preserve bounded cost.");
assert(JSON.stringify(first) === JSON.stringify(second), "Equivalent inputs must produce byte-stable plan output.");
assert(first.steps.every((step) => step.writesProduction === false), "Compiled recovery steps must not write production.");
assert(first.steps.every((step) => step.publishesToUsers === false), "Compiled recovery steps must not publish to users.");

const blocked = compileOutcomePlan({ ...safeRequest, writesProduction: true });
assert(blocked.state !== "ready", "Production mutation intent must not compile as ready.");
assert(blocked.blockers.length > 0, "Blocked production mutation intent must expose blockers.");

console.log("sovereign intent determinism contract: PASS");
