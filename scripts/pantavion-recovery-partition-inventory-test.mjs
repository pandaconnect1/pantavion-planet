import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

import {
  materializeVerifiedPantavionRecoveryPartition,
  verifyPantavionRecoveryBatchPayload,
} from "../core/recovery/pantavion-recovery-source-reader.ts";
import { analyzePantavionRecoveryPartitionInventory } from "../core/recovery/pantavion-recovery-partition-inventory.ts";

const root = process.cwd();
const index = JSON.parse(
  fs.readFileSync(path.join(root, "data/recovery/runtime-fabric-v1/source-batch-index.json"), "utf8"),
);

function verifiedBatchesForPartition(partitionOrdinal) {
  const partition = index.partitions[partitionOrdinal - 1];
  const map = new Map();
  for (const segment of partition.segments) {
    if (map.has(segment.file)) continue;
    const entry = index.batches.find((batch) => batch.file === segment.file);
    assert.ok(entry, `missing batch entry for ${segment.file}`);
    const payload = fs.readFileSync(path.join(root, entry.relativePath));
    map.set(entry.file, verifyPantavionRecoveryBatchPayload({ entry, payload }));
  }
  return map;
}

for (const partitionOrdinal of [1, index.partitionPlan.partitionCount]) {
  const partition = materializeVerifiedPantavionRecoveryPartition({
    index,
    partitionOrdinal,
    verifiedBatches: verifiedBatchesForPartition(partitionOrdinal),
  });
  const inventory = analyzePantavionRecoveryPartitionInventory(partition);

  assert.equal(inventory.marker, "pantavion_recovery_partition_inventory_v1");
  assert.equal(inventory.partitionOrdinal, partitionOrdinal);
  assert.equal(inventory.recordCount, partition.recordCount);
  assert.equal(inventory.uniqueRecordCount, partition.recordCount);
  assert.equal(inventory.recordEvidence.length, partition.recordCount);
  assert.match(inventory.partitionEvidenceSha256, /^[a-f0-9]{64}$/);
  assert.equal(
    analyzePantavionRecoveryPartitionInventory(partition).partitionEvidenceSha256,
    inventory.partitionEvidenceSha256,
    "partition evidence must be deterministic",
  );
  assert.equal(Object.getPrototypeOf(inventory.sourceFamilies), null);
  assert.equal(Object.getPrototypeOf(inventory.seedModules), null);
  for (const evidence of inventory.recordEvidence) {
    assert.deepEqual(
      Object.keys(evidence).sort(),
      [
        "hasContext",
        "hasText",
        "recordId",
        "seedModule",
        "sourceFamily",
        "sourceFile",
        "sourceRecordSha256",
      ],
      "inventory evidence must expose only bounded metadata and digests",
    );
  }
  assert.equal(inventory.nextStage, "semantic_classification_v3");
  assert.equal(inventory.authority.analysis, true);
  assert.equal(inventory.authority.planning, true);
  assert.equal(inventory.authority.codeMutation, false);
  assert.equal(inventory.authority.productionWrite, false);
  assert.equal(inventory.authority.merge, false);
  assert.equal(inventory.authority.deployment, false);
  assert.equal(inventory.authority.publicExposure, false);
  assert.equal(inventory.authority.release, false);

  const serialized = JSON.stringify(inventory);
  for (const record of partition.records.slice(0, 10)) {
    if (typeof record.text === "string" && record.text.length > 32) {
      assert.equal(serialized.includes(record.text), false, "inventory must not copy raw recovered text");
    }
    if (typeof record.context === "string" && record.context.length > 32) {
      assert.equal(serialized.includes(record.context), false, "inventory must not copy raw recovered context");
    }
  }
}

const firstPartition = materializeVerifiedPantavionRecoveryPartition({
  index,
  partitionOrdinal: 1,
  verifiedBatches: verifiedBatchesForPartition(1),
});
const duplicatePartition = {
  ...firstPartition,
  records: [firstPartition.records[0], firstPartition.records[0]],
  recordCount: 2,
  endOrdinal: firstPartition.startOrdinal + 1,
};
assert.throws(
  () => analyzePantavionRecoveryPartitionInventory(duplicatePartition),
  /recovery_inventory_duplicate_record_id/,
);

assert.throws(
  () => analyzePantavionRecoveryPartitionInventory({
    ...firstPartition,
    authority: { ...firstPartition.authority, analysis: false },
  }),
  /recovery_inventory_partition_authority_invalid/,
  "inventory must not self-grant analysis authority",
);
assert.throws(
  () => analyzePantavionRecoveryPartitionInventory({
    ...firstPartition,
    endOrdinal: firstPartition.endOrdinal + 1,
  }),
  /recovery_inventory_partition_range_invalid/,
  "ordinal range drift must fail closed",
);

const firstEvidence = firstPartition.sourceEvidence[0];
assert.ok(firstEvidence);
assert.throws(
  () => analyzePantavionRecoveryPartitionInventory({
    ...firstPartition,
    sourceEvidence: [
      {
        ...firstEvidence,
        segmentStartOrdinal: firstEvidence.segmentStartOrdinal + 1,
        recordCount: firstEvidence.recordCount - 1,
      },
      ...firstPartition.sourceEvidence.slice(1),
    ],
  }),
  /recovery_inventory_source_evidence_(invalid|coverage_mismatch)/,
  "source-evidence gaps must fail closed",
);

const prototypeKeyPartition = {
  ...firstPartition,
  startOrdinal: 1,
  endOrdinal: 1,
  recordCount: 1,
  records: [
    {
      id: "prototype-key-record",
      provenance: { sourceFile: "fixture.json", sourceFamily: "__proto__" },
      classification: { module: "constructor" },
    },
  ],
  sourceEvidence: [
    {
      file: "fixture.json",
      fileSha256: "a".repeat(64),
      segmentStartOrdinal: 1,
      segmentEndOrdinal: 1,
      recordCount: 1,
    },
  ],
};
const prototypeKeyInventory = analyzePantavionRecoveryPartitionInventory(prototypeKeyPartition);
assert.equal(Object.getPrototypeOf(prototypeKeyInventory.sourceFamilies), null);
assert.equal(Object.getPrototypeOf(prototypeKeyInventory.seedModules), null);
assert.equal(prototypeKeyInventory.sourceFamilies.__proto__, 1);
assert.equal(prototypeKeyInventory.seedModules.constructor, 1);

console.log("Pantavion Recovery Partition Inventory contract: PASS");
console.log("First partition inventory: 500 records");
console.log("Last partition inventory: 413 records");
console.log("Raw recovered text/context copied into inventory: false");
console.log("Duplicate, authority, ordinal, evidence-gap and prototype-key rejection: PASS");
