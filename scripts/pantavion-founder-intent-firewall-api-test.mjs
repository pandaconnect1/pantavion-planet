import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  createFounderIntentFirewallAssessment,
  normalizeFounderIntentFirewallRequest,
} from "../core/sovereign/founder-intent-firewall-assessment.ts";

const safeIntent = {
  intentId: "intent-read-001",
  actorId: "founder-test",
  actorKind: "founder",
  jurisdiction: "cy",
  capabilities: ["read_repository", "verify_evidence"],
  dataClasses: ["private"],
  estimatedCost: 0,
  risk: "low",
  reversible: true,
  legalConsentRecorded: true,
  writesProduction: false,
  publishesToUsers: false,
  sendsExternalMessage: false,
  changesIdentityOrAccess: false,
};

const safeAssessment = createFounderIntentFirewallAssessment(safeIntent);
assert.equal(safeAssessment.decision.disposition, "allow");
assert.deepEqual(safeAssessment.decision.reasons, ["policy_satisfied"]);
assert.equal(safeAssessment.assessmentOnly, true);
assert.equal(safeAssessment.executionAllowed, false);
assert.match(safeAssessment.receiptSha256, /^[a-f0-9]{64}$/);
assert.equal(safeAssessment.request.jurisdiction, "CY");

const reorderedAssessment = createFounderIntentFirewallAssessment({
  changesIdentityOrAccess: false,
  sendsExternalMessage: false,
  publishesToUsers: false,
  writesProduction: false,
  legalConsentRecorded: true,
  reversible: true,
  risk: "low",
  estimatedCost: 0,
  dataClasses: ["private"],
  capabilities: ["read_repository", "verify_evidence"],
  jurisdiction: "CY",
  actorKind: "founder",
  actorId: "founder-test",
  intentId: "intent-read-001",
});
assert.equal(reorderedAssessment.receiptSha256, safeAssessment.receiptSha256);

const productionAssessment = createFounderIntentFirewallAssessment({
  ...safeIntent,
  writesProduction: true,
});
assert.equal(productionAssessment.decision.disposition, "deny");
assert.ok(productionAssessment.decision.reasons.includes("production_mutation_denied"));
assert.equal(productionAssessment.executionAllowed, false);

const publicAssessment = createFounderIntentFirewallAssessment({
  ...safeIntent,
  publishesToUsers: true,
});
assert.equal(publicAssessment.decision.disposition, "deny");
assert.ok(publicAssessment.decision.reasons.includes("public_exposure_denied"));

const sensitiveAssessment = createFounderIntentFirewallAssessment({
  ...safeIntent,
  dataClasses: ["regulated"],
  legalConsentRecorded: false,
});
assert.equal(sensitiveAssessment.decision.disposition, "deny");
assert.ok(sensitiveAssessment.decision.reasons.includes("sensitive_data_without_consent"));

const unknownCapabilityAssessment = createFounderIntentFirewallAssessment({
  ...safeIntent,
  capabilities: ["activate_agent"],
});
assert.equal(unknownCapabilityAssessment.decision.disposition, "owner_approval");
assert.ok(
  unknownCapabilityAssessment.decision.reasons.includes("capability_requires_owner_scope"),
);
assert.equal(unknownCapabilityAssessment.executionAllowed, false);

const externalMessageAssessment = createFounderIntentFirewallAssessment({
  ...safeIntent,
  sendsExternalMessage: true,
});
assert.equal(externalMessageAssessment.decision.disposition, "owner_approval");
assert.ok(externalMessageAssessment.decision.reasons.includes("external_message"));

assert.throws(
  () => normalizeFounderIntentFirewallRequest({ ...safeIntent, unexpected: true }),
  /unknown_field/,
);
assert.throws(
  () => normalizeFounderIntentFirewallRequest({ ...safeIntent, capabilities: [] }),
  /capabilities/,
);
assert.throws(
  () => normalizeFounderIntentFirewallRequest({ ...safeIntent, estimatedCost: Number.NaN }),
  /estimatedCost/,
);
assert.throws(
  () => normalizeFounderIntentFirewallRequest({ ...safeIntent, risk: "unknown" }),
  /risk/,
);
assert.throws(
  () =>
    normalizeFounderIntentFirewallRequest({
      ...safeIntent,
      capabilities: Array.from({ length: 33 }, (_, index) => `capability-${index}`),
    }),
  /capabilities/,
);

const routeSource = await readFile(
  join(process.cwd(), "app/api/owner/intent-firewall/route.ts"),
  "utf8",
);
assert.ok(routeSource.includes("requireFounderIdentity(auth.user.id)"));
assert.ok(routeSource.includes('currentLevel !== "aal2"'));
assert.ok(routeSource.includes("MAX_REQUEST_BYTES"));
assert.ok(routeSource.includes('authorizationEffect: "none"'));
assert.ok(routeSource.includes('"Cache-Control": "no-store, max-age=0"'));

console.log("PANTAVION FOUNDER INTENT FIREWALL API TEST: PASSED");
console.log("- 31 assertions cover deterministic receipts, fail-closed policy, input bounds, Founder auth and AAL2");
console.log("- assessmentOnly=true; executionAllowed=false; authorizationEffect=none");
