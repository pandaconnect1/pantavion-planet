import {
  synchronizeImplementationItems,
  validateImplementationTruth,
} from "../core/pantavion/implementation-sync-registry.ts";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const baseItem = {
  id: "intent-outcome-fabric",
  title: "Intent-to-Outcome Fabric",
  domain: "sovereign",
  source: "core/sovereign/intent-to-outcome-fabric.ts",
  updatedAt: "2026-09-03T16:00:00.000Z",
};

const coded = {
  ...baseItem,
  state: "coded",
  evidenceRecords: [
    {
      kind: "code",
      reference: "pr-401-code",
      recordedAt: "2026-09-03T15:59:00.000Z",
    },
  ],
};

const tested = {
  ...baseItem,
  state: "tested",
  updatedAt: "2026-09-03T16:30:00.000Z",
  evidenceRecords: [
    ...coded.evidenceRecords,
    {
      kind: "test",
      reference: "pr-401-ci",
      recordedAt: "2026-09-03T16:29:00.000Z",
    },
  ],
};

const reconciled = synchronizeImplementationItems([coded], [tested]);
assert(reconciled.length === 1, "Duplicate registry entries must reconcile to one item.");
assert(reconciled[0].state === "tested", "The higher verified lifecycle state must win.");
assert(
  reconciled[0].evidenceRecords?.some((record) => record.kind === "code") &&
    reconciled[0].evidenceRecords?.some((record) => record.kind === "test"),
  "Reconciliation must preserve the union of valid evidence records.",
);
assert(validateImplementationTruth(reconciled[0]).length === 0, "Reconciled item must remain truth-valid.");

const malformedTested = {
  ...tested,
  evidenceRecords: tested.evidenceRecords.filter((record) => record.kind !== "test"),
};
const failClosed = synchronizeImplementationItems([tested], [malformedTested]);
assert(failClosed[0].state === "tested", "A malformed lower-quality duplicate must not downgrade valid truth.");

const blocked = synchronizeImplementationItems([
  {
    ...baseItem,
    state: "blocked",
    blocker: "truth_gate:evidence_missing:code",
  },
]);
assert(blocked[0].state === "blocked", "Explicit blockers must remain visible.");
assert(blocked[0].blocker === "truth_gate:evidence_missing:code", "Blocker provenance must be preserved.");

console.log("sovereign registry reconciliation boundary tests passed");
