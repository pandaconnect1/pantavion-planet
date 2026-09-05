import {
  advanceImplementationItem,
  canAdvanceImplementationState,
  requiredEvidenceForState,
  validateImplementationTruth,
  sovereignFactoryImplementationItems,
} from "../core/pantavion/implementation-sync-registry.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  JSON.stringify(requiredEvidenceForState("tested")) === JSON.stringify(["code", "test"]),
  "TESTED must require code and test evidence.",
);
assert(canAdvanceImplementationState("coded", "tested"), "CODED -> TESTED must be allowed.");
assert(!canAdvanceImplementationState("coded", "merged"), "CODED -> MERGED must be rejected as a skipped state.");
assert(!canAdvanceImplementationState("tested", "deployed"), "TESTED -> DEPLOYED must be rejected as a skipped state.");

const coded = sovereignFactoryImplementationItems.find((item) => item.state === "coded");
assert(coded, "Expected at least one canonical CODED implementation item.");
assert(validateImplementationTruth(coded).length === 0, "Canonical CODED item must satisfy truth validation.");

const testedWithoutEvidence = {
  ...coded,
  state: "tested",
  evidenceRecords: coded.evidenceRecords?.filter((record) => record.kind !== "test") ?? [],
};
assert(
  validateImplementationTruth(testedWithoutEvidence).includes("evidence_missing:test"),
  "TESTED without test evidence must fail closed.",
);

const mergedWithoutGateEvidence = {
  ...coded,
  state: "merged",
  evidenceRecords: [
    ...(coded.evidenceRecords ?? []),
    { kind: "test", reference: "https://example.invalid/test", recordedAt: coded.updatedAt, revision: "a".repeat(40) },
  ],
};
assert(
  validateImplementationTruth(mergedWithoutGateEvidence).includes("evidence_missing:merge"),
  "MERGED without merge evidence must fail closed.",
);

let rejected = false;
try {
  advanceImplementationItem(coded, "merged", [], coded.updatedAt);
} catch {
  rejected = true;
}
assert(rejected, "Direct CODED -> MERGED advancement must be rejected.");

console.log("Sovereign registry truth-gate contract passed.");
