import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CORPUS_REL = 'data/recovery/imported-pr248/canonical-ledger/corpus';
const CORPUS = path.join(ROOT, CORPUS_REL);
const CONTRACT_REL = 'docs/recovery/live/canonical/CANONICAL_SHARDING_CONTRACT_V1.json';
const OUT_MAP_REL = 'docs/recovery/live/canonical/thread3-corpus-shard-map.json';
const OUT_RECEIPT_REL = 'docs/recovery/live/canonical/thread3-corpus-shard-receipt.json';
const OUT_CHECKPOINT_REL = 'docs/recovery/live/shards/thread3-canonical-corpus.json';
const OUT_HANDOFF_REL = 'docs/recovery/live/handoffs/thread3-to-thread4-corpus.json';
const OWNED = new Set([5, 6, 7, 8, 9]);
const SEP = '\u001f';

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const gitBlobSha = (buf) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');
function hashKey(stableRecordKey) {
  const digest = createHash('sha256').update(stableRecordKey, 'utf8').digest();
  return {
    sha256: digest.toString('hex'),
    bucket: Number(digest.readBigUInt64BE(0) % 10n),
  };
}
function writeHashLine(hash, value, state) {
  if (!state.first) hash.update('\n');
  hash.update(value, 'utf8');
  state.first = false;
}
function sourceFingerprint(record) {
  const provenance = record?.provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) throw new Error(`provenance_required:${record?.id ?? 'unknown'}`);
  if (typeof provenance.sourceFamily !== 'string' || !provenance.sourceFamily) throw new Error(`source_family_required:${record?.id ?? 'unknown'}`);
  if (typeof provenance.sourceFile !== 'string' || !provenance.sourceFile) throw new Error(`source_file_required:${record?.id ?? 'unknown'}`);
  if (!Number.isInteger(provenance.sourceLine) || provenance.sourceLine < 1) throw new Error(`source_line_required:${record?.id ?? 'unknown'}`);
  if (typeof record.context !== 'string') throw new Error(`context_required:${record?.id ?? 'unknown'}`);
  return sha256([provenance.sourceFamily, provenance.sourceFile, provenance.sourceLine, record.context].join(SEP));
}

const contract = JSON.parse(await readFile(path.join(ROOT, CONTRACT_REL), 'utf8'));
if (contract.contract !== 'PANTAVION_CANONICAL_SHARDING_V1') throw new Error('wrong_sharding_contract');
if (contract.stableRecordKey?.pantavionCorpus !== 'recordId:sourceFingerprint') throw new Error('wrong_corpus_stable_key_contract');
if (contract.hash?.algorithm !== 'SHA-256') throw new Error('wrong_hash_algorithm');
if (JSON.stringify(contract.ownership?.thread3) !== JSON.stringify([5,6,7,8,9])) throw new Error('wrong_thread3_ownership');
for (const vector of contract.testVectors ?? []) {
  const got = hashKey(vector.stableRecordKey);
  if (got.sha256 !== vector.sha256 || got.bucket !== vector.bucket) throw new Error(`contract_vector_failed:${vector.stableRecordKey}`);
}

const provenanceManifest = JSON.parse(await readFile(path.join(CORPUS, 'PROVENANCE_MANIFEST.json'), 'utf8'));
const materializationReceipt = JSON.parse(await readFile(path.join(CORPUS, 'MATERIALIZATION_RECEIPT.json'), 'utf8'));
const corpusManifest = JSON.parse(await readFile(path.join(CORPUS, 'manifest.json'), 'utf8'));
const provenanceByBase = new Map((provenanceManifest.sourcePaths ?? []).map((entry) => [path.basename(entry.path), entry]));

if (materializationReceipt.totalRecords !== 82413 || materializationReceipt.totalBatches !== 55) throw new Error('materialization_receipt_count_mismatch');
if (corpusManifest.totalRecords !== 82413 || corpusManifest.totalBatches !== 55) throw new Error('corpus_manifest_count_mismatch');
if (!Array.isArray(corpusManifest.batches) || corpusManifest.batches.length !== 55) throw new Error('corpus_manifest_batches_invalid');
if (materializationReceipt.corpusFingerprint !== corpusManifest.corpusFingerprint) throw new Error('corpus_fingerprint_mismatch');

const globalIds = new Set();
const globalStableKeys = new Set();
const globalBucketCounts = Object.fromEntries(Array.from({length:10}, (_, i) => [String(i), 0]));
const ownedBucketCounts = Object.fromEntries([...OWNED].map((b) => [String(b), 0]));
const ownedSourceFamilyCounts = {};
const bucketStableKeyHashes = new Map([...OWNED].map((b) => [b, { hash: createHash('sha256'), state: { first: true } }]));
const bucketRecordIdHashes = new Map([...OWNED].map((b) => [b, { hash: createHash('sha256'), state: { first: true } }]));
const bucketPointerHashes = new Map([...OWNED].map((b) => [b, { hash: createHash('sha256'), state: { first: true } }]));
const shardBatches = [];
let totalRecords = 0;
let ownedRecords = 0;
let sourceIdMismatchCount = 0;
let duplicateIdCount = 0;
let duplicateStableKeyCount = 0;

for (const manifestBatch of corpusManifest.batches) {
  const file = `${manifestBatch.batchId}.json`;
  const relativePath = `${CORPUS_REL}/batches/${file}`;
  const raw = await readFile(path.join(CORPUS, 'batches', file));
  const expectedProvenance = provenanceByBase.get(file);
  if (!expectedProvenance) throw new Error(`provenance_missing:${file}`);
  if (gitBlobSha(raw) !== expectedProvenance.blobSha) throw new Error(`git_blob_sha_mismatch:${file}`);
  const fileSha256 = sha256(raw);
  const parsed = JSON.parse(raw.toString('utf8'));
  if (!Array.isArray(parsed.records)) throw new Error(`records_missing:${file}`);
  if (parsed.records.length !== manifestBatch.recordCount) throw new Error(`batch_count_mismatch:${file}`);
  if (parsed.checkpoint?.batchId && parsed.checkpoint.batchId !== manifestBatch.batchId) throw new Error(`batch_checkpoint_id_mismatch:${file}`);
  if (parsed.records[0]?.ordinal !== manifestBatch.startOrdinal || parsed.records.at(-1)?.ordinal !== manifestBatch.endOrdinal) throw new Error(`batch_ordinal_boundary_mismatch:${file}`);

  const ownedIndexes = Object.fromEntries([...OWNED].map((b) => [String(b), []]));
  let batchOwnedCount = 0;

  for (let index = 0; index < parsed.records.length; index += 1) {
    const record = parsed.records[index];
    totalRecords += 1;
    const expectedOrdinal = manifestBatch.startOrdinal + index;
    if (record.ordinal !== expectedOrdinal) throw new Error(`record_ordinal_mismatch:${file}:${index}`);
    if (typeof record.id !== 'string' || !record.id) throw new Error(`record_id_required:${file}:${index}`);

    const fingerprint = sourceFingerprint(record);
    const expectedId = `pk_${fingerprint.slice(0,24)}`;
    if (record.id !== expectedId) {
      sourceIdMismatchCount += 1;
      throw new Error(`record_source_fingerprint_id_mismatch:${file}:${index}:${record.id}`);
    }
    if (globalIds.has(record.id)) duplicateIdCount += 1;
    else globalIds.add(record.id);

    const stableRecordKey = `${record.id}:${fingerprint}`;
    if (globalStableKeys.has(stableRecordKey)) duplicateStableKeyCount += 1;
    else globalStableKeys.add(stableRecordKey);
    const hashed = hashKey(stableRecordKey);
    globalBucketCounts[String(hashed.bucket)] += 1;

    if (!OWNED.has(hashed.bucket)) continue;
    ownedRecords += 1;
    batchOwnedCount += 1;
    ownedBucketCounts[String(hashed.bucket)] += 1;
    ownedIndexes[String(hashed.bucket)].push(index);
    const family = record.provenance.sourceFamily;
    ownedSourceFamilyCounts[family] = (ownedSourceFamilyCounts[family] ?? 0) + 1;

    const stableHasher = bucketStableKeyHashes.get(hashed.bucket);
    writeHashLine(stableHasher.hash, stableRecordKey, stableHasher.state);
    const idHasher = bucketRecordIdHashes.get(hashed.bucket);
    writeHashLine(idHasher.hash, record.id, idHasher.state);
    const pointerHasher = bucketPointerHashes.get(hashed.bucket);
    writeHashLine(pointerHasher.hash, `${relativePath}:${index}:${fileSha256}:${record.id}:${fingerprint}`, pointerHasher.state);
  }

  shardBatches.push({
    batchId: manifestBatch.batchId,
    file,
    relativePath,
    gitBlobSha: expectedProvenance.blobSha,
    fileSha256,
    sourceRecordCount: parsed.records.length,
    startOrdinal: manifestBatch.startOrdinal,
    endOrdinal: manifestBatch.endOrdinal,
    thread3OwnedRecordCount: batchOwnedCount,
    ownedRecordIndexesByBucket: ownedIndexes,
  });
}

if (totalRecords !== 82413) throw new Error(`global_record_count_mismatch:${totalRecords}`);
if (globalIds.size !== 82413 || duplicateIdCount !== 0) throw new Error(`global_id_uniqueness_failed:${globalIds.size}:${duplicateIdCount}`);
if (globalStableKeys.size !== 82413 || duplicateStableKeyCount !== 0) throw new Error(`global_stable_key_uniqueness_failed:${globalStableKeys.size}:${duplicateStableKeyCount}`);
if (sourceIdMismatchCount !== 0) throw new Error(`source_id_mismatches:${sourceIdMismatchCount}`);
if (Object.values(globalBucketCounts).reduce((a,b) => a+b, 0) !== 82413) throw new Error('bucket_conservation_failed');
if (Object.values(ownedBucketCounts).reduce((a,b) => a+b, 0) !== ownedRecords) throw new Error('owned_bucket_conservation_failed');

const ownedBucketFingerprints = {};
for (const bucket of [...OWNED]) {
  ownedBucketFingerprints[String(bucket)] = {
    recordCount: ownedBucketCounts[String(bucket)],
    stableRecordKeyFingerprint: bucketStableKeyHashes.get(bucket).hash.digest('hex'),
    recordIdFingerprint: bucketRecordIdHashes.get(bucket).hash.digest('hex'),
    sourcePointerFingerprint: bucketPointerHashes.get(bucket).hash.digest('hex'),
  };
}

const stableKeyDerivation = {
  version: 'PANTAVION_CORPUS_SOURCE_FINGERPRINT_V1',
  sourceFingerprint: "SHA256([provenance.sourceFamily, provenance.sourceFile, provenance.sourceLine, context].join('\\u001f'))",
  sourceIdInvariant: 'record.id === `pk_${sourceFingerprint.slice(0,24)}`',
  stableRecordKey: 'record.id + ":" + sourceFingerprint',
  shardingContract: contract.contract,
  rationale: 'This reproduces the exact stableId input used by scripts/pantavion-canonical-knowledge-excavation-v2.cjs, preserving the original canonical identity derivation while retaining the full SHA-256 source fingerprint.',
};

const map = {
  marker: 'pantavion_thread3_corpus_shard_map_v1',
  ownerThread: 3,
  ownedBuckets: [5,6,7,8,9],
  sourceCorpus: CORPUS_REL,
  sourceCommit: provenanceManifest.sourceCommit,
  corpusFingerprint: corpusManifest.corpusFingerprint,
  stableKeyDerivation,
  compactPointerSemantics: 'Each listed integer is the zero-based record index inside the immutable batch file for a record owned by that bucket. Record payloads and IDs are not duplicated here.',
  sourceBatchCount: shardBatches.length,
  sourceRecordCount: totalRecords,
  thread3OwnedRecordCount: ownedRecords,
  batches: shardBatches,
};

const receipt = {
  marker: 'pantavion_thread3_corpus_shard_receipt_v1',
  ownerThread: 3,
  status: 'EXISTING_CANONICAL_CORPUS_SHARD_BOUND',
  sourceCorpus: CORPUS_REL,
  sourcePhysicalCanonicalRecordCount: totalRecords,
  sourcePhysicalRecordsDuplicatedByThread3: 0,
  sourcePullRequest: provenanceManifest.sourcePullRequest,
  sourceCommit: provenanceManifest.sourceCommit,
  corpusFingerprint: corpusManifest.corpusFingerprint,
  historicalMaterializationReceiptState: {
    tested: materializationReceipt.tested,
    verified: materializationReceipt.verified,
    deleteAllowed: materializationReceipt.deleteAllowed,
  },
  structuralVerificationPerformedNow: {
    allProvenanceGitBlobShasMatched: true,
    allRecordOrdinalsMatchedManifest: true,
    all82413RecordIdsReproducedFromOriginalSourceFingerprintFormula: true,
    uniqueRecordIds: globalIds.size,
    uniqueStableRecordKeys: globalStableKeys.size,
    duplicateRecordIds: duplicateIdCount,
    duplicateStableRecordKeys: duplicateStableKeyCount,
    sourceIdMismatchCount,
  },
  stableKeyDerivation,
  globalBucketCounts,
  thread3OwnedBuckets: [5,6,7,8,9],
  thread3OwnedRecordCount: ownedRecords,
  thread3OwnedBucketCounts: ownedBucketCounts,
  thread3OwnedBucketFingerprints: ownedBucketFingerprints,
  thread3OwnedSourceFamilyCounts: ownedSourceFamilyCounts,
  compactShardMap: OUT_MAP_REL,
  semantics: [
    'The 82,413 source records were already durably materialized canonical records before this Thread 3 run; they are not added again to global physical record counts.',
    'Thread 3 binds only buckets 5-9 and duplicates zero source payloads.',
    'Structural/source-identity verification does not promote historical semantic classifications or live states to current VERIFIED_LIVE truth.',
    'Thread 4 may consume the compact shard map and immutable source corpus for semantic classification; source evidence must remain unchanged.',
    'Thread 7 remains responsible for global reconciliation/audit conclusions.',
  ],
};

const checkpoint = {
  thread: 3,
  scope: 'CANONICAL_WORKERS_F06_F10',
  status: 'CORPUS_EXISTING_CANONICAL_SHARD_BOUND',
  contract: contract.contract,
  sourceCorpus: CORPUS_REL,
  sourcePhysicalCanonicalRecordCount: totalRecords,
  newPhysicalCanonicalRecordsWrittenForCorpus: 0,
  thread3ExistingCanonicalRecordsBound: ownedRecords,
  bucketCounts: ownedBucketCounts,
  shardMap: OUT_MAP_REL,
  receipt: OUT_RECEIPT_REL,
  downstream: {
    classificationOwner: 'THREAD_4',
    reconciliationOwner: 'THREAD_7',
    durabilityOwner: 'THREAD_8',
  },
};

const handoff = {
  fromThread: 3,
  toThread: 4,
  handoffType: 'EXISTING_CANONICAL_CORPUS_SHARD_READY_FOR_CLASSIFICATION',
  sourceCorpus: CORPUS_REL,
  ownedBuckets: [5,6,7,8,9],
  ownedRecordCount: ownedRecords,
  shardMap: OUT_MAP_REL,
  receipt: OUT_RECEIPT_REL,
  stableKeyDerivation,
  constraints: [
    'Read payloads from immutable corpus batches using ownedRecordIndexesByBucket; do not copy or rewrite source records.',
    'Historical keyword classification is evidence only; preserve REVIEW_REQUIRED whenever current semantic evidence is insufficient.',
    'Do not infer VERIFIED_LIVE from any historical liveState/deployment marker.',
  ],
};

for (const [rel, value] of [
  [OUT_MAP_REL, map],
  [OUT_RECEIPT_REL, receipt],
  [OUT_CHECKPOINT_REL, checkpoint],
  [OUT_HANDOFF_REL, handoff],
]) {
  const abs = path.join(ROOT, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

console.log(JSON.stringify({
  ok: true,
  sourcePhysicalCanonicalRecordCount: totalRecords,
  sourcePhysicalRecordsDuplicatedByThread3: 0,
  thread3ExistingCanonicalRecordsBound: ownedRecords,
  ownedBucketCounts,
  globalBucketCounts,
  ownedSourceFamilyCounts,
}, null, 2));
