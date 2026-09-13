import assert from "node:assert/strict";
import { assessTechnologyLibraryEntry } from "../core/sovereign/technology-library.ts";

const base = {
  id: "tech.example.v1",
  name: "Example Technology",
  capability: "bounded_local_processing",
  source: "open_source",
  maturity: "prototype",
  licenseId: "MIT",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: [
    { kind: "source", reference: "https://example.invalid/source", observedAt: "2026-09-07T00:00:00Z" },
    { kind: "benchmark", reference: "bench-001", observedAt: "2026-09-07T00:00:00Z" },
    { kind: "security", reference: "sec-001", observedAt: "2026-09-07T00:00:00Z" },
    { kind: "privacy", reference: "privacy-001", observedAt: "2026-09-07T00:00:00Z" },
    { kind: "license", reference: "MIT", observedAt: "2026-09-07T00:00:00Z" },
  ],
};

const ready = assessTechnologyLibraryEntry(base);
assert.equal(ready.readiness, "prototype_ready");
assert.deepEqual(ready.blockers, []);
assert.equal(ready.deploymentAuthorized, false);

const external = assessTechnologyLibraryEntry({ ...base, source: "external_provider" });
assert.equal(external.readiness, "owner_approval_required");
assert.equal(external.deploymentAuthorized, false);

const missingLicense = assessTechnologyLibraryEntry({
  ...base,
  licenseId: "Apache-2.0",
});
assert.equal(missingLicense.readiness, "hold");
assert.ok(missingLicense.blockers.includes("license_evidence_mismatch"));

const unsafe = assessTechnologyLibraryEntry({
  ...base,
  reversibleIntegration: false,
  securityReviewed: false,
  privacyReviewed: false,
  commercialUseAllowed: false,
});
assert.equal(unsafe.readiness, "hold");
assert.ok(unsafe.blockers.includes("rollback_unavailable"));
assert.ok(unsafe.blockers.includes("commercial_use_not_allowed"));
assert.ok(unsafe.blockers.includes("security_review_missing"));
assert.ok(unsafe.blockers.includes("privacy_review_missing"));

const malformedEvidence = assessTechnologyLibraryEntry({
  ...base,
  evidence: [{ kind: "source", reference: "", observedAt: "not-a-date" }],
});
assert.equal(malformedEvidence.readiness, "hold");
assert.ok(malformedEvidence.blockers.includes("evidence_reference_missing:source"));
assert.ok(malformedEvidence.blockers.includes("evidence_timestamp_invalid:source"));
assert.ok(malformedEvidence.blockers.includes("technical_evidence_incomplete"));

console.log("sovereign technology library boundary tests passed");
