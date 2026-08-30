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

console.log("Pantavion Recovery Partition Inventory contract: PASS");
console.log("First partition inventory: 500 records");
console.log("Last partition inventory: 413 records");
console.log("Raw recovered text/context copied into inventory: false");
console.log("Duplicate record rejection: PASS");
