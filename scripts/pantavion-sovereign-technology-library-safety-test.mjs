import assert from "node:assert/strict";
import { assessTechnologyLibraryEntry } from "../core/sovereign/technology-library.ts";

const baseEvidence = [
  { kind: "source", reference: "https://example.invalid/source", observedAt: "2026-09-05T00:00:00Z" },
  { kind: "benchmark", reference: "benchmark-1", observedAt: "2026-09-05T00:00:00Z" },
  { kind: "security", reference: "security-review-1", observedAt: "2026-09-05T00:00:00Z" },
  { kind: "privacy", reference: "privacy-review-1", observedAt: "2026-09-05T00:00:00Z" },
  { kind: "license", reference: "MIT", observedAt: "2026-09-05T00:00:00Z" },
];

const completeNative = {
  id: "tech-native-1",
  name: "Native test capability",
  capability: "bounded execution",
  source: "pantavion_native",
  maturity: "prototype",
  licenseId: "MIT",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: baseEvidence,
};

const nativeAssessment = assessTechnologyLibraryEntry(completeNative);
assert.equal(nativeAssessment.readiness, "prototype_ready");
assert.deepEqual(nativeAssessment.blockers, []);
assert.equal(nativeAssessment.deploymentAuthorized, false);

const incomplete = assessTechnologyLibraryEntry({
  ...completeNative,
  id: "",
  evidence: baseEvidence.filter((item) => item.kind !== "privacy"),
  privacyReviewed: false,
  reversibleIntegration: false,
});
assert.equal(incomplete.readiness, "hold");
assert.ok(incomplete.blockers.includes("identity_or_capability_missing"));
assert.ok(incomplete.blockers.includes("privacy_review_missing"));
assert.ok(incomplete.blockers.includes("rollback_unavailable"));
assert.equal(incomplete.deploymentAuthorized, false);

const external = assessTechnologyLibraryEntry({
  ...completeNative,
  id: "tech-external-1",
  source: "external_provider",
});
assert.equal(external.readiness, "owner_approval_required");
assert.equal(external.deploymentAuthorized, false);

console.log("sovereign technology library safety contract: PASS");
