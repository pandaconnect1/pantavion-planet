import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const corpusRoot = path.join(root, "data/recovery/imported-pr248/canonical-ledger/corpus");
const batchesRoot = path.join(corpusRoot, "batches");
const receiptPath = path.join(corpusRoot, "MATERIALIZATION_RECEIPT.json");
const contractPath = path.join(root, "data/recovery/recovery-runtime-fabric-v1.json");
const outPath = path.join(root, "data/recovery/source-batch-index-v1.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function requireEqual(label, actual, expected) {
  if (actual !== expected) {
    throw new Error(`${label}_mismatch:${String(actual)}!=${String(expected)}`);
  }
}

function requireRecordId(record, fileName, index) {
  const value = record?.id;
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`source_record_id_missing:${fileName}:${index}`);
  }
  return value.trim();
}

function updateOrderedHash(hash, value, ordinal) {
  if (ordinal > 1) hash.update("\n");
  hash.update(value);
}

function buildBatchSegments(batches, startOrdinal, endOrdinal) {
  const segments = [];
  for (const batch of batches) {
    if (batch.endOrdinal < startOrdinal) continue;
    if (batch.startOrdinal > endOrdinal) break;
    const segmentStartOrdinal = Math.max(startOrdinal, batch.startOrdinal);
    const segmentEndOrdinal = Math.min(endOrdinal, batch.endOrdinal);
    segments.push({
      file: batch.file,
      fileSha256: batch.fileSha256,
      batchStartOrdinal: batch.startOrdinal,
      batchEndOrdinal: batch.endOrdinal,
      segmentStartOrdinal,
      segmentEndOrdinal,
      startRecordIndex: segmentStartOrdinal - batch.startOrdinal,
      endRecordIndex: segmentEndOrdinal - batch.startOrdinal,
      recordCount: segmentEndOrdinal - segmentStartOrdinal + 1,
    });
  }
  return segments;
}

const receipt = readJson(receiptPath);
const contract = readJson(contractPath);
const expectedRecordCount = contract.corpus?.records;
const expectedBatchCount = contract.corpus?.batches;
const expectedSourceFingerprint = contract.corpus?.sourceFingerprint;
const expectedOrderedIdFingerprint = contract.corpus?.orderedIdFingerprint;
const batchSize = contract.workload?.batchSize;
const expectedPartitionCount = contract.workload?.partitionCount;

requireEqual("receipt_record_count", receipt.totalRecords, expectedRecordCount);
requireEqual("receipt_batch_count", receipt.totalBatches, expectedBatchCount);
requireEqual("receipt_source_fingerprint", receipt.corpusFingerprint, expectedSourceFingerprint);
if (typeof receipt.generatedAt !== "string" || !receipt.generatedAt.trim()) {
  throw new Error("receipt_generated_at_required");
}

const files = fs.readdirSync(batchesRoot).filter((name) => name.endsWith(".json")).sort();
requireEqual("committed_batch_count", files.length, expectedBatchCount);

const globalOrderedIdHash = createHash("sha256");
const seenIds = new Set();
const batches = [];
let globalOrdinal = 0;

for (const file of files) {
  const filePath = path.join(batchesRoot, file);
  const raw = fs.readFileSync(filePath);
  const parsed = JSON.parse(raw.toString("utf8"));
  if (!Array.isArray(parsed.records)) throw new Error(`source_batch_records_missing:${file}`);
  if (parsed.records.length === 0) throw new Error(`source_batch_empty:${file}`);

  const batchIdHash = createHash("sha256");
  const startOrdinal = globalOrdinal + 1;
  let firstRecordId = null;
  let lastRecordId = null;

  for (let index = 0; index < parsed.records.length; index += 1) {
    const recordId = requireRecordId(parsed.records[index], file, index);
    if (seenIds.has(recordId)) throw new Error(`source_record_duplicate:${recordId}`);
    seenIds.add(recordId);
    globalOrdinal += 1;
    updateOrderedHash(globalOrderedIdHash, recordId, globalOrdinal);
    if (index > 0) batchIdHash.update("\n");
    batchIdHash.update(recordId);
    firstRecordId ??= recordId;
    lastRecordId = recordId;
  }

  batches.push({
    ordinal: batches.length + 1,
    file,
    relativePath: path.posix.join("data/recovery/imported-pr248/canonical-ledger/corpus/batches", file),
    fileBytes: raw.length,
    fileSha256: createHash("sha256").update(raw).digest("hex"),
    recordCount: parsed.records.length,
    startOrdinal,
    endOrdinal: globalOrdinal,
    firstRecordId,
    lastRecordId,
    orderedRecordIdFingerprint: batchIdHash.digest("hex"),
  });
}

requireEqual("source_record_count", globalOrdinal, expectedRecordCount);
const orderedIdFingerprint = globalOrderedIdHash.digest("hex");
requireEqual("source_ordered_id_fingerprint", orderedIdFingerprint, expectedOrderedIdFingerprint);

const partitionCount = Math.ceil(globalOrdinal / batchSize);
requireEqual("source_partition_count", partitionCount, expectedPartitionCount);

const partitions = [];
for (let ordinal = 1; ordinal <= partitionCount; ordinal += 1) {
  const startOrdinal = (ordinal - 1) * batchSize + 1;
  const endOrdinal = Math.min(ordinal * batchSize, globalOrdinal);
  const segments = buildBatchSegments(batches, startOrdinal, endOrdinal);
  const coveredRecords = segments.reduce((sum, segment) => sum + segment.recordCount, 0);
  requireEqual(`partition_coverage_${ordinal}`, coveredRecords, endOrdinal - startOrdinal + 1);
  partitions.push({
    ordinal,
    startOrdinal,
    endOrdinal,
    recordCount: endOrdinal - startOrdinal + 1,
    segments,
  });
}

const index = {
  id: "pantavion_recovery_source_batch_index_v1",
  generatedAt: receipt.generatedAt,
  corpus: {
    recordCount: globalOrdinal,
    batchCount: batches.length,
    sourceFingerprint: expectedSourceFingerprint,
    orderedIdFingerprint,
  },
  partitionPlan: {
    batchSize,
    partitionCount,
  },
  sourceMode: "committed_pinned_batches_with_sha256_verification",
  authority: {
    codeMutation: false,
    productionWrite: false,
    merge: false,
    deployment: false,
    publicExposure: false,
    release: false,
  },
  batches,
  partitions,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(index, null, 2)}\n`);
console.log(JSON.stringify({
  id: index.id,
  generatedAt: index.generatedAt,
  recordCount: index.corpus.recordCount,
  batchCount: index.corpus.batchCount,
  partitionCount: index.partitionPlan.partitionCount,
  orderedIdFingerprint: index.corpus.orderedIdFingerprint,
  output: path.relative(root, outPath),
}, null, 2));
