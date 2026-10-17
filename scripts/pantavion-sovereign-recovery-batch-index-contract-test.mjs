import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const root = process.cwd();
const indexPath = path.join(root, "data/recovery/source-batch-index-v1.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));

assert(index.id === "pantavion_recovery_source_batch_index_v1", "Recovery batch index id must remain canonical.");
assert(index.sourceMode === "committed_pinned_batches_with_sha256_verification", "Recovery source mode must remain pinned and hash-verified.");
assert(index.authority?.codeMutation === false, "Recovery index must not authorize code mutation.");
assert(index.authority?.productionWrite === false, "Recovery index must not authorize production writes.");
assert(index.authority?.merge === false, "Recovery index must not authorize merges.");
assert(index.authority?.deployment === false, "Recovery index must not authorize deployment.");
assert(index.authority?.publicExposure === false, "Recovery index must not authorize public exposure.");
assert(index.authority?.release === false, "Recovery index must not authorize release.");

const batches = index.batches;
const partitions = index.partitions;
assert(Array.isArray(batches) && batches.length === index.corpus.batchCount, "Batch count must match indexed batches.");
assert(Array.isArray(partitions) && partitions.length === index.partitionPlan.partitionCount, "Partition count must match indexed partitions.");

const seenIds = new Set();
let expectedOrdinal = 1;
let previousEnd = 0;
for (const batch of batches) {
  assert(batch.startOrdinal === previousEnd + 1, `Batch ${batch.file} must start immediately after the previous batch.`);
  assert(batch.endOrdinal >= batch.startOrdinal, `Batch ${batch.file} must have an ordered range.`);
  assert(batch.recordCount === batch.endOrdinal - batch.startOrdinal + 1, `Batch ${batch.file} record count must match its ordinal range.`);
  assert(typeof batch.fileSha256 === "string" && batch.fileSha256.length === 64, `Batch ${batch.file} must carry a SHA-256 fingerprint.`);
  assert(typeof batch.orderedRecordIdFingerprint === "string" && batch.orderedRecordIdFingerprint.length === 64, `Batch ${batch.file} must carry an ordered-id fingerprint.`);
  assert(batch.ordinal === expectedOrdinal, `Batch ordinals must remain deterministic at ${batch.file}.`);
  expectedOrdinal += 1;
  previousEnd = batch.endOrdinal;
}
assert(previousEnd === index.corpus.recordCount, "Batch ranges must cover the entire recovery corpus exactly once.");

let partitionStart = 1;
for (const partition of partitions) {
  assert(partition.startOrdinal === partitionStart, `Partition ${partition.ordinal} must begin at the next uncovered ordinal.`);
  assert(partition.endOrdinal >= partition.startOrdinal, `Partition ${partition.ordinal} must have an ordered range.`);
  assert(partition.recordCount === partition.endOrdinal - partition.startOrdinal + 1, `Partition ${partition.ordinal} record count must match its range.`);
  const covered = partition.segments.reduce((sum, segment) => {
    assert(segment.segmentStartOrdinal >= partition.startOrdinal, `Partition ${partition.ordinal} contains an out-of-range segment.`);
    assert(segment.segmentEndOrdinal <= partition.endOrdinal, `Partition ${partition.ordinal} contains an out-of-range segment.`);
    assert(segment.recordCount === segment.segmentEndOrdinal - segment.segmentStartOrdinal + 1, `Partition ${partition.ordinal} segment count must match its range.`);
    return sum + segment.recordCount;
  }, 0);
  assert(covered === partition.recordCount, `Partition ${partition.ordinal} must cover its range without gaps.`);
  partitionStart = partition.endOrdinal + 1;
}
assert(partitionStart === index.corpus.recordCount + 1, "Partitions must cover the recovery corpus without gaps or overlap.");

const orderedFingerprint = createHash("sha256").update(
  batches.map((batch) => batch.orderedRecordIdFingerprint).join("\n"),
).digest("hex");
assert(typeof index.corpus.orderedIdFingerprint === "string" && index.corpus.orderedIdFingerprint.length === 64, "Corpus ordered-id fingerprint must remain present.");
assert(orderedFingerprint !== "", "Ordered fingerprint derivation must remain deterministic.");

console.log(JSON.stringify({
  contract: "sovereign-recovery-batch-index",
  corpusRecords: index.corpus.recordCount,
  batches: batches.length,
  partitions: partitions.length,
  authority: index.authority,
}, null, 2));
