import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

const root = process.cwd();
const indexPath = path.join(root, "data/recovery/source-batch-index-v1.json");
const receiptPath = path.join(root, "data/recovery/imported-pr248/canonical-ledger/corpus/MATERIALIZATION_RECEIPT.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const receipt = JSON.parse(fs.readFileSync(receiptPath, "utf8"));

assert.equal(index.id, "pantavion_recovery_source_batch_index_v1");
assert.equal(index.generatedAt, receipt.generatedAt);
assert.equal(index.corpus.recordCount, 82_413);
assert.equal(index.corpus.batchCount, 55);
assert.equal(index.partitionPlan.batchSize, 500);
assert.equal(index.partitionPlan.partitionCount, 165);
assert.equal(index.batches.length, 55);
assert.equal(index.partitions.length, 165);
assert.equal(index.sourceMode, "committed_pinned_batches_with_sha256_verification");
assert.equal(Object.values(index.authority).some(Boolean), false);

let expectedBatchStart = 1;
let batchRecords = 0;
for (const batch of index.batches) {
  assert.equal(batch.startOrdinal, expectedBatchStart);
  assert.equal(batch.endOrdinal - batch.startOrdinal + 1, batch.recordCount);
  assert.match(batch.fileSha256, /^[a-f0-9]{64}$/);
  assert.match(batch.orderedRecordIdFingerprint, /^[a-f0-9]{64}$/);
  assert.equal(typeof batch.firstRecordId, "string");
  assert.equal(typeof batch.lastRecordId, "string");
  expectedBatchStart = batch.endOrdinal + 1;
  batchRecords += batch.recordCount;
}
assert.equal(batchRecords, 82_413);
assert.equal(expectedBatchStart, 82_414);

let expectedPartitionStart = 1;
let partitionRecords = 0;
for (const partition of index.partitions) {
  assert.equal(partition.startOrdinal, expectedPartitionStart);
  assert.equal(partition.endOrdinal - partition.startOrdinal + 1, partition.recordCount);
  const covered = partition.segments.reduce((sum, segment) => {
    assert.ok(segment.segmentStartOrdinal >= partition.startOrdinal);
    assert.ok(segment.segmentEndOrdinal <= partition.endOrdinal);
    assert.equal(segment.segmentEndOrdinal - segment.segmentStartOrdinal + 1, segment.recordCount);
    assert.equal(segment.endRecordIndex - segment.startRecordIndex + 1, segment.recordCount);
    assert.match(segment.fileSha256, /^[a-f0-9]{64}$/);
    return sum + segment.recordCount;
  }, 0);
  assert.equal(covered, partition.recordCount);
  expectedPartitionStart = partition.endOrdinal + 1;
  partitionRecords += partition.recordCount;
}
assert.equal(partitionRecords, 82_413);
assert.equal(expectedPartitionStart, 82_414);
assert.equal(index.partitions[0].startOrdinal, 1);
assert.equal(index.partitions[0].endOrdinal, 500);
assert.equal(index.partitions.at(-1).startOrdinal, 82_001);
assert.equal(index.partitions.at(-1).endOrdinal, 82_413);
assert.equal(index.partitions.at(-1).recordCount, 413);

console.log("Pantavion Recovery Source Batch Index contract: PASS");
console.log("Batches: 55");
console.log("Partitions: 165");
console.log("Records: 82413");
console.log("Deterministic generatedAt: PASS");
