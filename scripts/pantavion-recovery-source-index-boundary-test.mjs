import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const contractPath = path.join(root, "data/recovery/recovery-runtime-fabric-v1.json");
const receiptPath = path.join(root, "data/recovery/imported-pr248/canonical-ledger/corpus/MATERIALIZATION_RECEIPT.json");
const indexPath = path.join(root, "data/recovery/source-batch-index-v1.json");

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

execFileSync(process.execPath, ["scripts/pantavion-recovery-source-batch-index.mjs"], {
  cwd: root,
  stdio: "pipe",
});

const contract = readJson(contractPath);
const receipt = readJson(receiptPath);
const index = readJson(indexPath);

assert(index.id === "pantavion_recovery_source_batch_index_v1", "Index identity must remain canonical.");
assert(index.corpus.recordCount === contract.corpus.records, "Indexed record count must match the recovery contract.");
assert(index.corpus.recordCount === receipt.totalRecords, "Indexed record count must match the materialization receipt.");
assert(index.corpus.batchCount === contract.corpus.batches, "Indexed batch count must match the recovery contract.");
assert(index.corpus.batchCount === receipt.totalBatches, "Indexed batch count must match the materialization receipt.");
assert(index.partitionPlan.partitionCount === contract.workload.partitionCount, "Partition count must remain deterministic.");
assert(index.batches.length === index.corpus.batchCount, "Every committed source batch must have one index entry.");
assert(index.partitions.length === index.partitionPlan.partitionCount, "Every partition must have one partition entry.");

let coveredRecords = 0;
for (const partition of index.partitions) {
  const expected = partition.endOrdinal - partition.startOrdinal + 1;
  const actual = partition.segments.reduce((sum, segment) => sum + segment.recordCount, 0);
  assert(actual === expected, `Partition ${partition.ordinal} coverage must be exact.`);
  coveredRecords += actual;
}
assert(coveredRecords === index.corpus.recordCount, "All indexed records must be covered exactly once by partitions.");

for (const batch of index.batches) {
  assert(batch.recordCount > 0, `Batch ${batch.file} must not be empty.`);
  assert(batch.fileSha256.length === 64, `Batch ${batch.file} must carry a SHA-256 digest.`);
  assert(batch.orderedRecordIdFingerprint.length === 64, `Batch ${batch.file} must carry an ordered-ID fingerprint.`);
}

assert(index.authority.codeMutation === false, "Index generation must remain code-mutation free.");
assert(index.authority.productionWrite === false, "Index generation must remain production-write free.");
assert(index.authority.merge === false, "Index generation must not imply merge authority.");
assert(index.authority.deployment === false, "Index generation must not imply deployment authority.");
assert(index.authority.publicExposure === false, "Index generation must not imply public-exposure authority.");
assert(index.authority.release === false, "Index generation must not imply release authority.");

console.log(JSON.stringify({
  ok: true,
  recordCount: index.corpus.recordCount,
  batchCount: index.corpus.batchCount,
  partitionCount: index.partitionPlan.partitionCount,
  authority: index.authority,
}, null, 2));
