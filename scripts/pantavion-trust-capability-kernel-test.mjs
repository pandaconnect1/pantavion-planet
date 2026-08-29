import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("core/trust/trust-capability-kernel.ts", "utf8");

for (const required of [
  "evaluatePantavionTrustCapability",
  "capability_grant_missing",
  "capability_grant_actor_mismatch",
  "capability_grant_scope_mismatch",
  "capability_grant_expired",
  "capability_grant_risk_exceeded",
  "capability_grant_data_denied",
  "ai_provenance_missing",
  "owner_authority_required_for_critical_or_irreversible_action",
  "resolvePantavionAdaptivePolicy",
  "auditRequired: true",
  "failClosed: true",
  "leastPrivilege: true",
  "jurisdictionAware: true",
  "ageAware: true",
]) {
  assert.ok(source.includes(required), `missing trust capability invariant: ${required}`);
}

assert.ok(!source.includes("decision: \"allow\", reasons: []"), "kernel must not bypass policy evidence");
console.log("Pantavion trust capability kernel contract gate: PASS");
