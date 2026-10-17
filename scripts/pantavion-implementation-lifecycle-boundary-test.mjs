import {
  advanceImplementationItem,
  canAdvanceImplementationState,
  validateImplementationTruth,
} from "../core/pantavion/implementation-sync-registry.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrows(operation, message) {
  let threw = false;
  try {
    operation();
  } catch {
    threw = true;
  }
  assert(threw, message);
}

const base = {
  id: "lifecycle-test",
  title: "Lifecycle boundary",
  domain: "sovereign",
  state: "idea",
  source: "test",
  updatedAt: "2026-09-03T09:00:00.000Z",
  evidenceRecords: [],
};

assert(canAdvanceImplementationState("idea", "coded"), "IDEA -> CODED must be allowed.");
assert(canAdvanceImplementationState("coded", "tested"), "CODED -> TESTED must be allowed.");
assert(!canAdvanceImplementationState("idea", "tested"), "IDEA -> TESTED must be rejected.");
assert(!canAdvanceImplementationState("tested", "deployed"), "TESTED -> DEPLOYED must be rejected.");
assert(canAdvanceImplementationState("tested", "blocked"), "Any active state may enter BLOCKED.");
assert(!canAdvanceImplementationState("blocked", "coded"), "BLOCKED must not silently resume.");

const coded = advanceImplementationItem(
  base,
  "coded",
  [{ kind: "code", reference: "test-file", recordedAt: "2026-09-03T09:01:00.000Z" }],
  "2026-09-03T09:02:00.000Z",
);
assert(validateImplementationTruth(coded).length === 0, "CODED item with code evidence must be truthful.");

const tested = advanceImplementationItem(
  coded,
  "tested",
  [{ kind: "test", reference: "test-run", recordedAt: "2026-09-03T09:03:00.000Z" }],
  "2026-09-03T09:04:00.000Z",
);
assert(validateImplementationTruth(tested).length === 0, "TESTED item with code and test evidence must be truthful.");

expectThrows(
  () => advanceImplementationItem(tested, "deployed", [], "2026-09-03T09:05:00.000Z"),
  "DEPLOYED must require merge, deployment, and exact-revision evidence.",
);
expectThrows(
  () => advanceImplementationItem(tested, "merged", [{ kind: "merge", reference: "merge-1", recordedAt: "2026-09-03T08:59:00.000Z", revision: "sha-1" }], "2026-09-03T08:58:00.000Z"),
  "Lifecycle timestamps must be monotonic.",
);

const badDeployed = {
  ...tested,
  state: "deployed",
  evidenceRecords: [
    ...(tested.evidenceRecords ?? []),
    { kind: "merge", reference: "merge-1", recordedAt: "2026-09-03T09:05:00.000Z", revision: "sha-1" },
    { kind: "deployment", reference: "deploy-1", recordedAt: "2026-09-03T09:06:00.000Z", revision: "sha-2" },
    { kind: "exact_revision", reference: "revision-1", recordedAt: "2026-09-03T09:06:00.000Z", revision: "sha-1" },
  ],
  updatedAt: "2026-09-03T09:07:00.000Z",
};
assert(
  validateImplementationTruth(badDeployed).includes("evidence_revision_mismatch:deployment"),
  "Deployment evidence must match the exact deployed revision.",
);

console.log("implementation lifecycle boundary contract: PASS");
