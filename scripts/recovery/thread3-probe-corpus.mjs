import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CORPUS = path.join(ROOT, 'data/recovery/imported-pr248/canonical-ledger/corpus');
const BATCH_DIR = path.join(CORPUS, 'batches');
const OUT = path.join(ROOT, 'docs/recovery/live/canonical/thread3-corpus-probe.json');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const gitBlobSha = (buf) => createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${buf.length}\0`), buf])).digest('hex');

const provenance = JSON.parse(await readFile(path.join(CORPUS, 'PROVENANCE_MANIFEST.json'), 'utf8'));
const receipt = JSON.parse(await readFile(path.join(CORPUS, 'MATERIALIZATION_RECEIPT.json'), 'utf8'));
const manifest = JSON.parse(await readFile(path.join(CORPUS, 'manifest.json'), 'utf8'));
const provenanceByBase = new Map((provenance.sourcePaths ?? []).map((entry) => [path.basename(entry.path), entry]));
const batchFiles = (await readdir(BATCH_DIR)).filter((name) => name.endsWith('.json')).sort();

if (batchFiles.length !== 55) throw new Error(`expected_55_batches_found_${batchFiles.length}`);
if (receipt.totalRecords !== 82413 || receipt.totalBatches !== 55) throw new Error('receipt_count_invariant_failed');
if (manifest.totalRecords !== 82413 || manifest.totalBatches !== 55) throw new Error('manifest_count_invariant_failed');
if (receipt.corpusFingerprint !== manifest.corpusFingerprint) throw new Error('corpus_fingerprint_mismatch');

let totalRecords = 0;
let duplicateIds = 0;
const seenIds = new Set();
const allKeys = new Set();
const sourceFieldFrequency = new Map();
const batchReceipts = [];
const sampleRecords = [];

for (const file of batchFiles) {
  const raw = await readFile(path.join(BATCH_DIR, file));
  const expected = provenanceByBase.get(file);
  if (!expected) throw new Error(`provenance_missing:${file}`);
  const observedGitSha = gitBlobSha(raw);
  if (observedGitSha !== expected.blobSha) throw new Error(`git_blob_sha_mismatch:${file}`);
  const parsed = JSON.parse(raw.toString('utf8'));
  if (!Array.isArray(parsed.records)) throw new Error(`records_missing:${file}`);
  const ids = [];
  for (let index = 0; index < parsed.records.length; index += 1) {
    const record = parsed.records[index];
    if (!record || typeof record !== 'object' || Array.isArray(record)) throw new Error(`record_invalid:${file}:${index}`);
    if (typeof record.id !== 'string' || !record.id.trim()) throw new Error(`record_id_missing:${file}:${index}`);
    const id = record.id.trim();
    ids.push(id);
    if (seenIds.has(id)) duplicateIds += 1;
    else seenIds.add(id);
    for (const key of Object.keys(record)) allKeys.add(key);
    for (const key of Object.keys(record)) {
      if (/source|fingerprint|hash|sha|provenance|origin/i.test(key)) sourceFieldFrequency.set(key, (sourceFieldFrequency.get(key) ?? 0) + 1);
    }
  }
  totalRecords += parsed.records.length;
  const rawSha256 = sha256(raw);
  const orderedIdFingerprint = sha256(Buffer.from(ids.join('\n'), 'utf8'));
  batchReceipts.push({
    file,
    relativePath: `data/recovery/imported-pr248/canonical-ledger/corpus/batches/${file}`,
    bytes: raw.length,
    gitBlobSha: observedGitSha,
    fileSha256: rawSha256,
    recordCount: parsed.records.length,
    firstRecordId: ids[0] ?? null,
    lastRecordId: ids.at(-1) ?? null,
    orderedRecordIdFingerprint,
    batchTopLevelKeys: Object.keys(parsed).sort(),
  });
  if (sampleRecords.length < 5 && parsed.records.length) {
    const sample = parsed.records[0];
    sampleRecords.push({
      file,
      id: sample.id,
      keys: Object.keys(sample).sort(),
      sourceLikeFields: Object.fromEntries(Object.entries(sample).filter(([key]) => /source|fingerprint|hash|sha|provenance|origin/i.test(key))),
    });
  }
}

if (totalRecords !== 82413) throw new Error(`record_count_mismatch:${totalRecords}`);
if (seenIds.size !== 82413) throw new Error(`unique_id_count_mismatch:${seenIds.size}`);
if (duplicateIds !== 0) throw new Error(`duplicate_ids:${duplicateIds}`);

const globalOrderedIdFingerprint = (() => {
  const hash = createHash('sha256');
  let first = true;
  for (const file of batchFiles) {
    // Re-read only IDs deterministically in batch filename order.
    // The fingerprint is probe evidence, not a claim that filename order equals historical ordinal order.
    // Batch ordinal order will be taken from corpus manifest in the canonical binding step.
    // eslint-disable-next-line no-await-in-loop
  }
  return null;
})();

const out = {
  marker: 'pantavion_thread3_corpus_probe_v1',
  ownerThread: 3,
  sourceCorpus: 'data/recovery/imported-pr248/canonical-ledger/corpus',
  sourcePullRequest: provenance.sourcePullRequest,
  sourceCommit: provenance.sourceCommit,
  preservationMode: provenance.preservationMode,
  truthRule: provenance.truthRule,
  receipt: {
    totalRecords: receipt.totalRecords,
    totalBatches: receipt.totalBatches,
    corpusFingerprint: receipt.corpusFingerprint,
    tested: receipt.tested,
    verified: receipt.verified,
    deleteAllowed: receipt.deleteAllowed,
  },
  probeVerification: {
    batchFileCount: batchFiles.length,
    totalRecords,
    uniqueRecordIds: seenIds.size,
    duplicateRecordIds: duplicateIds,
    all55GitBlobShasMatchProvenanceManifest: true,
    receiptAndManifestCountsMatch: true,
    receiptAndManifestCorpusFingerprintMatch: true,
  },
  recordSchema: {
    unionKeys: [...allKeys].sort(),
    sourceLikeFieldFrequency: Object.fromEntries([...sourceFieldFrequency.entries()].sort(([a], [b]) => a.localeCompare(b))),
    samples: sampleRecords,
  },
  batchReceipts,
  canonicalizationDecision: {
    physicalRecordDuplicationAllowed: false,
    reason: 'The preserved corpus already contains canonical physical records. Thread 3 should create compact immutable shard bindings/index pointers for owned buckets 5-9 rather than duplicate record payloads.',
    stableIdentityRequirement: 'recordId + immutable source hash/fingerprint; exact formula must be bound to verified batch SHA and original record ID in the next deterministic step.',
  },
  warnings: [
    'MATERIALIZATION_RECEIPT currently says tested=false and verified=false; this probe verifies structural/blob invariants only and does not rewrite that historical receipt.',
    'Historical classification/live-state fields remain evidence, not current VERIFIED_LIVE truth.',
  ],
};

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ok:true,batches:batchFiles.length,totalRecords,uniqueRecordIds:seenIds.size,unionKeys:[...allKeys].sort(),sourceLikeFields:[...sourceFieldFrequency.keys()].sort()}, null, 2));
