import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const indexPath = path.join(root, "data/recovery/source-batch-index-v1.json");
const contractPath = path.join(root, "data/recovery/recovery-runtime-fabric-v1.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) fail(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
}

function digest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

const index = readJson(indexPath);
const contract = readJson(contractPath);

if (index.id !== "pantavion_recovery_source_batch_index_v1") fail("index_id_invalid");
if (index.sourceMode !== "committed_pinned_batches_with_sha256_verification") fail("source_mode_invalid");
if (!index.authority || Object.values(index.authority).some((value) => value !== false)) fail("authority_gate_open");

const expectedRecordCount = contract.corpus?.records;
const expectedBatchCount = contract.corpus?.batches;
const expectedPartitionCount = contract.workload?.partitionCount;
requireEqual("record_count", index.corpus?.recordCount, expectedRecordCount);
requireEqual("batch_count", index.corpus?.batchCount, expectedBatchCount);
requireEqual("partition_count", index.partitionPlan?.partitionCount, expectedPartitionCount);
requireEqual("batches_length", index.batches?.length, expectedBatchCount);
requireEqual("partitions_length", index.partitions?.length, expectedPartitionCount);

let expectedBatchOrdinal = 1;
let previousBatchEnd = 0;
for (const batch of index.batches) {
  requireEqual("batch_ordinal", batch.ordinal, expectedBatchOrdinal);
  requireEqual("batch_start_contiguous", batch.startOrdinal, previousBatchEnd + 1);
  if (batch.endOrdinal < batch.startOrdinal) fail(`batch_range_invalid:${batch.ordinal}`);
  if (batch.recordCount !== batch.endOrdinal - batch.startOrdinal + 1) fail(`batch_count_invalid:${batch.ordinal}`);
  if (typeof batch.fileSha256 !== "string" || batch.fileSha256.length !== 64) fail(`batch_hash_missing:${batch.ordinal}`);
  previousBatchEnd = batch.endOrdinal;
  expectedBatchOrdinal += 1;
}
requireEqual("batch_corpus_coverage", previousBatchEnd, expectedRecordCount);

let expectedPartitionOrdinal = 1;
let previousPartitionEnd = 0;
for (const partition of index.partitions) {
  requireEqual("partition_ordinal", partition.ordinal, expectedPartitionOrdinal);
  requireEqual("partition_start_contiguous", partition.startOrdinal, previousPartitionEnd + 1);
  if (partition.endOrdinal < partition.startOrdinal) fail(`partition_range_invalid:${partition.ordinal}`);
  if (partition.recordCount !== partition.endOrdinal - partition.startOrdinal + 1) fail(`partition_count_invalid:${partition.ordinal}`);
  const covered = (partition.segments || []).reduce((sum, segment) => sum + segment.recordCount, 0);
  requireEqual(`partition_coverage_${partition.ordinal}`, covered, partition.recordCount);
  previousPartitionEnd = partition.endOrdinal;
  expectedPartitionOrdinal += 1;
}
requireEqual("partition_corpus_coverage", previousPartitionEnd, expectedRecordCount);

const baselineDigest = digest(index);
const tampered = structuredClone(index);
tampered.partitions[0].recordCount += 1;
if (digest(tampered) === baselineDigest) fail("tamper_not_detected");

console.log(JSON.stringify({
  id: "pantavion_sovereign_recovery_index_integrity_v1",
  status: "pass",
  corpusRecordCount: index.corpus.recordCount,
  batchCount: index.corpus.batchCount,
  partitionCount: index.partitionPlan.partitionCount,
  deterministicDigest: baselineDigest,
  authority: index.authority,
}, null, 2));
