import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PANTAVION_RECOVERY_CORPUS_CONTRACT,
  assertPantavionRecoveryRuntimeCounts,
  digestPantavionRecoverySourceRecord,
  materializePantavionRecoveryWorkUnit,
  pantavionRecoveryRuntimeDoctrine,
} from "../core/recovery/pantavion-recovery-runtime-fabric.ts";

const pinned = JSON.parse(fs.readFileSync("data/recovery/recovery-runtime-fabric-v1.json", "utf8"));
assert.equal(pinned.corpus.records, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceRecordCount);
assert.equal(pinned.corpus.batches, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceBatchCount);
assert.equal(pinned.corpus.sourceFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.sourceFingerprint);
assert.equal(pinned.corpus.orderedIdFingerprint, PANTAVION_RECOVERY_CORPUS_CONTRACT.orderedIdFingerprint);
assert.equal(pinned.workload.partitionCount, Math.ceil(pinned.corpus.records / pinned.workload.batchSize));
assert.equal(pantavionRecoveryRuntimeDoctrine.publicReleaseRequiresFounderGreenLight, true);

const plannerSource = fs.readFileSync("core/kernel/pantavion-foundry-workload-planner.ts", "utf8");
for (const required of [
  "resolvePantavionRecoveryCorpusBinding",
  "recovery_corpus_workload_record_count_mismatch",
  "recovery_corpus_workload_batch_size_mismatch",
  "canonical_corpus_ordered_record_id",
  "corpusBinding",
]) {
  assert.equal(plannerSource.includes(required), true, `planner missing ${required}`);
}

const founderSurface = fs.readFileSync("app/kernel/canonical-materialization-client.tsx", "utf8");
for (const required of [
  "Recovery Runtime Fabric",
  "82,413 canonical work units",
  "total_ingest_004",
  "total-ingestion:recovery-corpus",
  "Public / production authority",
  "LOCKED",
]) {
  assert.equal(founderSurface.includes(required), true, `founder surface missing ${required}`);
}
assert.equal(founderSurface.includes("NEXT_PUBLIC_"), false);
assert.equal(founderSurface.includes("SUPABASE_SERVICE_ROLE"), false);

const foundryRuntime = fs.readFileSync("core/kernel/pantavion-foundry-runtime.ts", "utf8");
for (const required of [
  "parseRecoveryCorpusBinding",
  "canonical_corpus_ordered_record_id",
  "sourceOrdinalBinding",
  "corpusBinding",
  "PANTAVION_RECOVERY_CORPUS_CONTRACT",
]) {
  assert.equal(foundryRuntime.includes(required), true, `Foundry runtime missing ${required}`);
}

function locator(record, ordinal) {
  return {
    batchFile: "batch-contract.json",
    batchRecordIndex: ordinal - 1,
    globalOrdinal: ordinal,
    sourceRecordSha256: digestPantavionRecoverySourceRecord(record),
  };
}

const classified = {
  id: "record-classified",
  text: "private raw payload must not be copied",
  reviewStatus: "SEMANTICALLY_CLASSIFIED",
  semanticDecision: "ROUTE_CANDIDATE",
  semanticReviewReasons: [],
  provenance: { sourceFile: "core/example.ts", sourceFamily: "repository" },
  classification: {
    module: "Personal AI / PantaAI",
    subsystem: "orchestration",
    capability: "plan",
    feature: "orchestration.plan.implementation",
    artifactType: "implementation",
    canonicalTarget: "canonical/Personal AI / PantaAI/orchestration/plan",
    classificationMethod: "contract-fixture",
  },
};
const candidate = materializePantavionRecoveryWorkUnit({
  record: classified,
  locator: locator(classified, 1),
});
assert.equal(candidate.runtimeLane, "CLASSIFIED_CANDIDATE");
assert.equal(candidate.implementationState, "idea");
assert.equal(candidate.nextAction, "PLAN_SCOPED_INTERNAL_DRAFT");
assert.equal(candidate.governance.executionAuthority, false);
assert.equal(candidate.governance.releaseAuthority, false);
assert.equal(candidate.governance.productionWriteAuthority, false);
assert.equal(JSON.stringify(candidate).includes(classified.text), false);

const recursive = {
  id: "record-recursive",
  reviewStatus: "PRESERVED_RECURSIVE_ARTIFACT",
  semanticDecision: "PRESERVE_QUARANTINE",
  semanticReviewReasons: ["recursive_ledger_artifact"],
  provenance: { sourceFile: "data/recovery/canonical-ledger/corpus/batches/batch-a.json" },
  classification: {
    module: "Recovery / Provenance",
    subsystem: "recursive-ledger",
    capability: "preserve",
    canonicalTarget: "canonical/recovery/quarantine/batch-a",
  },
};
const quarantine = materializePantavionRecoveryWorkUnit({
  record: recursive,
  locator: locator(recursive, 2),
  previousWorkUnitDigest: candidate.workUnitDigest,
});
assert.equal(quarantine.runtimeLane, "QUARANTINED_RECURSIVE");
assert.equal(quarantine.previousWorkUnitDigest, candidate.workUnitDigest);
assert.equal(quarantine.implementationState, "blocked");

const held = {
  id: "record-held",
  reviewStatus: "REVIEW_REQUIRED",
  semanticDecision: "HOLD",
  semanticReviewReasons: ["capability_conflict"],
  provenance: { sourceFile: "app/dashboard/page.tsx" },
  classification: { module: "Experience / Navigation" },
};
const disposition = {
  sourceFile: "app/dashboard/page.tsx",
  expectedRecords: 1,
  disposition: "CANONICAL_OWNER",
  canonicalOwner: "Experience / Navigation",
  sharedWith: [],
  subsystem: "shell",
  capability: "present",
  canonicalTarget: "app/dashboard/page.tsx",
  executionAuthority: false,
  reason: "Preserve until explicit scoped planning.",
};
const governed = materializePantavionRecoveryWorkUnit({
  record: held,
  locator: locator(held, 3),
  governedDisposition: disposition,
  previousWorkUnitDigest: quarantine.workUnitDigest,
});
assert.equal(governed.runtimeLane, "GOVERNED_HOLD");
assert.equal(governed.governance.disposition, "CANONICAL_OWNER");
assert.equal(governed.nextAction, "PRESERVE_GOVERNED_HOLD");

assert.throws(
  () => materializePantavionRecoveryWorkUnit({ record: held, locator: locator(held, 3) }),
  /governed_hold_disposition_required/,
);
assert.throws(
  () => materializePantavionRecoveryWorkUnit({
    record: held,
    locator: locator(held, 3),
    governedDisposition: { ...disposition, sourceFile: "wrong.ts" },
  }),
  /governed_hold_source_mismatch/,
);
assert.throws(
  () => materializePantavionRecoveryWorkUnit({
    record: { ...classified, semanticDecision: "HOLD" },
    locator: locator(classified, 1),
  }),
  /classified_record_missing_route_candidate_decision/,
);

assertPantavionRecoveryRuntimeCounts({
  CLASSIFIED_CANDIDATE: 31_779,
  QUARANTINED_RECURSIVE: 50_279,
  GOVERNED_HOLD: 355,
});
assert.throws(
  () => assertPantavionRecoveryRuntimeCounts({
    CLASSIFIED_CANDIDATE: 31_778,
    QUARANTINED_RECURSIVE: 50_279,
    GOVERNED_HOLD: 355,
  }),
  /classified_count_mismatch/,
);

console.log("Pantavion Recovery Runtime Fabric contract verified.");
