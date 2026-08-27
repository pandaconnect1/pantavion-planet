import assert from "node:assert/strict";
import {
  advanceKernelTruth,
  appendKernelEvidence,
  createKernelTruthRecord,
  startKernelTruthRevision,
} from "../kernel/truth-ledger.ts";

const at = (minute) => `2026-08-27T15:${String(minute).padStart(2, "0")}:00.000Z`;
const evidence = (evidenceId, type, revision, minute) => ({
  evidenceId,
  type,
  revision,
  at: at(minute),
  actorNodeId: "truth-kernel",
  reference: `${type}:${revision}:${evidenceId}`,
});

let record = createKernelTruthRecord(
  "social.translation",
  "rev-a",
  evidence("source-1", "source", "rev-a", 40),
);
assert.equal(record.stage, "DISCOVERED");

assert.throws(
  () => advanceKernelTruth(record, "IMPLEMENTED"),
  /invalid_truth_transition:DISCOVERED->IMPLEMENTED/,
);

record = appendKernelEvidence(record, evidence("classification-1", "classification", "rev-a", 41));
record = advanceKernelTruth(record, "CLASSIFIED", at(41));
record = appendKernelEvidence(record, evidence("canonical-1", "canonical_record", "rev-a", 42));
record = advanceKernelTruth(record, "CANONICALIZED", at(42));
record = appendKernelEvidence(record, evidence("commit-1", "commit", "rev-a", 43));
record = advanceKernelTruth(record, "IMPLEMENTED", at(43));

assert.throws(
  () => advanceKernelTruth(record, "TESTED", at(44)),
  /missing_evidence:TESTED:test/,
);

record = appendKernelEvidence(record, evidence("test-1", "test", "rev-a", 44));
record = advanceKernelTruth(record, "TESTED", at(44));
record = appendKernelEvidence(record, evidence("staging-1", "staging_probe", "rev-a", 45));
record = advanceKernelTruth(record, "STAGING_VERIFIED", at(45));
record = appendKernelEvidence(record, evidence("deploy-1", "deployment", "rev-a", 46));
record = advanceKernelTruth(record, "DEPLOYED", at(46));
record = appendKernelEvidence(record, evidence("probe-1", "production_probe", "rev-a", 47));
record = advanceKernelTruth(record, "PRODUCTION_PROBED", at(47));
record = advanceKernelTruth(record, "VERIFIED_LIVE", at(48));
assert.equal(record.stage, "VERIFIED_LIVE");

const revised = startKernelTruthRevision(
  record,
  "rev-b",
  evidence("source-2", "source", "rev-b", 49),
);
assert.equal(revised.stage, "DISCOVERED");
assert.equal(revised.revision, "rev-b");
assert.throws(
  () => advanceKernelTruth(revised, "CLASSIFIED", at(50)),
  /missing_evidence:CLASSIFIED:classification/,
);
assert.throws(
  () => appendKernelEvidence(revised, evidence("wrong-revision", "classification", "rev-a", 50)),
  /evidence revision mismatch/,
);

console.log("Pantavion kernel truth ledger contract: PASS");
