import { assessTechnologyLibraryEntry } from "../core/sovereign/technology-library.ts";
import { evaluateReplacement, nextFactoryStage } from "../core/sovereign/technology-factory.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const baseTechnology = {
  id: "tech_local_runtime",
  name: "Local runtime",
  capability: "model_execution",
  source: "open_source",
  maturity: "prototype",
  licenseId: "Apache-2.0",
  commercialUseAllowed: true,
  sourceAvailable: true,
  reversibleIntegration: true,
  securityReviewed: true,
  privacyReviewed: true,
  evidence: [
    { kind: "source", reference: "source-digest", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "benchmark", reference: "benchmark-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "security", reference: "security-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "privacy", reference: "privacy-1", observedAt: "2026-08-27T20:00:00.000Z" },
    { kind: "license", reference: "Apache-2.0", observedAt: "2026-08-27T20:00:00.000Z" },
  ],
};

const ready = assessTechnologyLibraryEntry(baseTechnology);
assert(ready.readiness === "prototype_ready", "Complete evidence must make an entry prototype-ready.");
assert(ready.deploymentAuthorized === false, "Readiness must never become deployment authorization.");

for (const evidence of [
  { kind: "source", reference: "", observedAt: "2026-08-27T20:00:00.000Z" },
  { kind: "security", reference: "security-1", observedAt: "" },
]) {
  const assessment = assessTechnologyLibraryEntry({
    ...baseTechnology,
    evidence: baseTechnology.evidence.map((item) => item.kind === evidence.kind ? evidence : item),
  });
  assert(assessment.readiness === "hold", "Malformed evidence must fail closed to hold.");
}

const incumbent = {
  id: "external_incumbent",
  capability: "translation",
  source: "external_provider",
  provider: "provider-a",
  quality: 90,
  latencyMs: 300,
  unitCost: 5,
  privacyScore: 70,
  resilienceScore: 70,
  sovereigntyScore: 30,
  reversible: true,
};
const candidate = { ...incumbent, id: "native_candidate", source: "pantavion_native", quality: 92, unitCost: 1, sovereigntyScore: 95 };
const recommendation = evaluateReplacement(incumbent, candidate, {
  minimumQuality: 85,
  minimumPrivacy: 65,
  minimumResilience: 65,
  maximumUnitCost: 6,
  ownerApprovalForExternalReplacement: true,
});
assert(recommendation.decision === "owner_approval", "External replacement must stop at the owner gate.");
assert(recommendation.rollbackRequired === true, "Any replacement path must retain rollback evidence.");

assert(nextFactoryStage("discover") === "research", "Factory stage progression must be deterministic.");
assert(nextFactoryStage("improve") === "improve", "Factory stage progression must not move beyond terminal stage.");

console.log("pantavion sovereign evidence provenance contract: PASS");
