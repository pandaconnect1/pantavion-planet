import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  createFounderTechnologyAssessment,
  parseTechnologyAssessmentRequest,
  TECHNOLOGY_ASSESSMENT_POLICY,
  TECHNOLOGY_ASSESSMENT_SCHEMA,
} from "../core/sovereign/founder-technology-assessment.ts";

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
  assert.throws(() => parseTechnologyAssessmentRequest(input), new RegExp(fragment));
  assertions += 1;
}

const observedAt = "2026-09-09T12:00:00.000Z";
const nativeEntry = {
  id: "pantavion-native-search",
  name: "Pantavion Native Search",
  capability: "Local deterministic knowledge retrieval",
  source: "pantavion_native",
  maturity: "prototype",
  licenseId: "Pantavion-Proprietary-1.0",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: [
    { kind: "source", reference: "git:abc123", observedAt },
    { kind: "benchmark", reference: "benchmark:search-v1", observedAt },
    { kind: "security", reference: "review:security-v1", observedAt },
    { kind: "privacy", reference: "review:privacy-v1", observedAt },
    { kind: "license", reference: "Pantavion-Proprietary-1.0", observedAt },
  ],
};

const native = createFounderTechnologyAssessment(nativeEntry);
equal(native.schema, TECHNOLOGY_ASSESSMENT_SCHEMA, "schema");
equal(native.policyVersion, TECHNOLOGY_ASSESSMENT_POLICY, "policy");
equal(native.assessment.readiness, "prototype_ready", "complete native readiness");
equal(native.assessment.blockers.length, 0, "complete native blockers");
equal(native.assessment.deploymentAuthorized, false, "base assessor deployment authority");
equal(native.assessmentOnly, true, "assessment-only boundary");
equal(native.installationAuthorized, false, "installation boundary");
equal(native.deploymentAuthorized, false, "deployment boundary");
equal(native.authorizationEffect, "none", "authorization effect");
check(/^[a-f0-9]{64}$/.test(native.receiptSha256), "receipt format");

const repeated = createFounderTechnologyAssessment(structuredClone(nativeEntry));
equal(repeated.receiptSha256, native.receiptSha256, "deterministic receipt");

const changed = createFounderTechnologyAssessment({
  ...nativeEntry,
  capability: "Changed capability",
});
check(changed.receiptSha256 !== native.receiptSha256, "payload-bound receipt");

const external = createFounderTechnologyAssessment({
  ...nativeEntry,
  id: "external-provider",
  source: "external_provider",
});
equal(external.assessment.readiness, "owner_approval_required", "external provider owner boundary");
equal(external.installationAuthorized, false, "external installation remains blocked");
equal(external.deploymentAuthorized, false, "external deployment remains blocked");

const hold = createFounderTechnologyAssessment({
  ...nativeEntry,
  commercialUseAllowed: false,
  reversibleIntegration: false,
  securityReviewed: false,
  evidence: nativeEntry.evidence.filter((item) => item.kind !== "security"),
});
equal(hold.assessment.readiness, "hold", "incomplete entry holds");
check(hold.assessment.blockers.includes("commercial_use_not_allowed"), "commercial blocker");
check(hold.assessment.blockers.includes("rollback_unavailable"), "rollback blocker");
check(hold.assessment.blockers.includes("security_review_missing"), "security blocker");
equal(hold.deploymentAuthorized, false, "hold cannot authorize deployment");

rejects(null, "object_required");
rejects({ ...nativeEntry, unexpected: true }, "unknown_entry_field");
rejects({ ...nativeEntry, source: "closed_unknown" }, "source");
rejects({ ...nativeEntry, maturity: "unknown" }, "maturity");
rejects({ ...nativeEntry, evidence: [] }, "evidence_count");
rejects({ ...nativeEntry, evidence: [{ ...nativeEntry.evidence[0], extra: true }] }, "unknown_evidence_field");
rejects({ ...nativeEntry, evidence: [{ ...nativeEntry.evidence[0], observedAt: "not-a-date" }] }, "evidence_timestamp");
rejects({ ...nativeEntry, id: "" }, "id_length");
rejects({ ...nativeEntry, commercialUseAllowed: "true" }, "commercialUseAllowed_must_be_boolean");

const route = readFileSync("app/api/owner/technology-library/assess/route.ts", "utf8");
check(route.includes("requireFounderIdentity(auth.user.id)"), "API founder identity gate");
check(route.includes('currentLevel !== "aal2"'), "API AAL2 gate");
check(route.includes("MAX_REQUEST_BYTES = 24_576"), "API bounded body");
check(route.includes('"Cache-Control": "no-store, max-age=0"'), "API no-store");
check(!route.includes(".from(") && !route.includes("fetch("), "API has no persistence or external action");

const page = readFileSync("app/owner/control/technology-library/page.tsx", "utf8");
check(page.includes("requireFounderIdentity(auth.user.id)"), "page founder identity gate");
check(page.includes('currentLevel !== "aal2"'), "page AAL2 gate");

const client = readFileSync(
  "app/owner/control/technology-library/technology-library-client.tsx",
  "utf8",
);
check(client.includes('aria-live="polite"'), "live result region");
check(client.includes("installationAuthorized"), "installation boundary visible");
check(client.includes("deploymentAuthorized"), "deployment boundary visible");

console.log(`Technology Library workbench contract: PASS (${assertions} assertions)`);
