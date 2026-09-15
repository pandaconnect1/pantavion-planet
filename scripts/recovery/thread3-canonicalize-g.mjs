import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BATCH_DIR = path.join(ROOT, 'docs/recovery/live/batches');
const CANON_DIR = path.join(ROOT, 'docs/recovery/live/canonical');
const SHARD_DIR = path.join(ROOT, 'docs/recovery/live/shards');
const HANDOFF_DIR = path.join(ROOT, 'docs/recovery/live/handoffs');
const CONTRACT_PATH = path.join(CANON_DIR, 'CANONICAL_SHARDING_CONTRACT_V1.json');
const OWNED = new Set([5, 6, 7, 8, 9]);
const BATCH_RE = /^lane-g-20260915-(\d+)-(\d+)-rehydrated\.json$/;

const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
const stableJson = (value) => JSON.stringify(value, Object.keys(value).sort());

function hashKey(stableRecordKey) {
  const digest = createHash('sha256').update(stableRecordKey, 'utf8').digest();
  const hex = digest.toString('hex');
  const projection = digest.readBigUInt64BE(0);
  const bucket = Number(projection % 10n);
  return { hex, bucket };
}

function sourcePayload(record) {
  return {
    deploymentId: record.deploymentId,
    created: record.created ?? null,
    state: record.state ?? null,
    target: record.target ?? null,
    url: record.url ?? null,
    gitRef: record.gitRef ?? null,
    gitSha: record.gitSha ?? null,
    gitMessage: record.gitMessage ?? null,
  };
}

const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));
if (contract.contract !== 'PANTAVION_CANONICAL_SHARDING_V1') throw new Error('Unexpected sharding contract');
if (contract.hash?.algorithm !== 'SHA-256') throw new Error('Unexpected hash algorithm');
for (const vector of contract.testVectors ?? []) {
  const got = hashKey(vector.stableRecordKey);
  if (got.hex !== vector.sha256 || got.bucket !== vector.bucket) {
    throw new Error(`Sharding contract test vector failed for ${vector.stableRecordKey}`);
  }
}

const batchNames = (await readdir(BATCH_DIR))
  .map((name) => ({ name, match: name.match(BATCH_RE) }))
  .filter((x) => x.match)
  .sort((a, b) => Number(a.match[1]) - Number(b.match[1]));

if (batchNames.length !== 20) throw new Error(`Expected 20 rehydrated G batches, found ${batchNames.length}`);

const inputs = [];
const records = new Map();
const duplicateStableKeys = [];
const payloadConflicts = [];
let sourceRecordCount = 0;

for (const { name, match } of batchNames) {
  const sourcePath = `docs/recovery/live/batches/${name}`;
  const raw = await readFile(path.join(BATCH_DIR, name), 'utf8');
  const batch = JSON.parse(raw);
  const expectedStart = Number(match[1]);
  const expectedEnd = Number(match[2]);
  if (batch.lane !== 'G' || batch.projectId !== 'prj_BxhpnjvAs1seyfBU1UYFU8nDykwh') {
    throw new Error(`Unexpected provenance in ${name}`);
  }
  if (batch.recordRange?.[0] !== expectedStart || batch.recordRange?.[1] !== expectedEnd) {
    throw new Error(`Range mismatch in ${name}`);
  }
  if (!Array.isArray(batch.records) || batch.records.length !== batch.recordCount) {
    throw new Error(`Record count mismatch in ${name}`);
  }
  sourceRecordCount += batch.records.length;
  inputs.push({
    path: sourcePath,
    sha256: sha256Hex(raw),
    recordRange: batch.recordRange,
    recordCount: batch.recordCount,
    capturedAt: batch.capturedAt,
  });

  for (const record of batch.records) {
    const stableRecordKey = `${batch.projectId}:${record.deploymentId}`;
    const payload = sourcePayload(record);
    const payloadFingerprint = sha256Hex(JSON.stringify(payload));
    const existing = records.get(stableRecordKey);
    if (existing) {
      duplicateStableKeys.push(stableRecordKey);
      if (existing.payloadFingerprint !== payloadFingerprint) payloadConflicts.push(stableRecordKey);
      existing.sourceEvidence.push(sourcePath);
      continue;
    }
    const hashed = hashKey(stableRecordKey);
    records.set(stableRecordKey, {
      stableRecordKey,
      stableRecordHash: hashed.hex,
      bucket: hashed.bucket,
      payloadFingerprint,
      sourceEvidence: [sourcePath],
      source: {
        lane: 'G',
        surface: batch.source,
        project: batch.project,
        projectId: batch.projectId,
        privacy: batch.privacy,
        recoveryTruth: batch.recoveryTruth,
      },
      payload,
    });
  }
}

if (sourceRecordCount !== 400) throw new Error(`Expected source record count 400, found ${sourceRecordCount}`);
if (records.size !== 400) throw new Error(`Expected 400 unique stable keys, found ${records.size}`);
if (duplicateStableKeys.length !== 0) throw new Error(`Unexpected duplicate stable keys: ${duplicateStableKeys.length}`);
if (payloadConflicts.length !== 0) throw new Error(`Payload conflicts: ${payloadConflicts.length}`);

await mkdir(CANON_DIR, { recursive: true });
await mkdir(SHARD_DIR, { recursive: true });
await mkdir(HANDOFF_DIR, { recursive: true });

const inputFingerprint = sha256Hex(inputs.map((x) => `${x.path}:${x.sha256}`).join('\n'));
const bucketCounts = {};
const canonicalFiles = [];
let thread3RecordCount = 0;
const allThread3Keys = new Set();

for (const bucket of [...OWNED].sort((a, b) => a - b)) {
  const owned = [...records.values()]
    .filter((record) => record.bucket === bucket)
    .sort((a, b) => a.stableRecordKey.localeCompare(b.stableRecordKey))
    .map((record) => {
      if (allThread3Keys.has(record.stableRecordKey)) throw new Error(`Thread 3 duplicate ${record.stableRecordKey}`);
      allThread3Keys.add(record.stableRecordKey);
      return {
        canonicalRecordId: `vercel-deployment:${record.stableRecordKey}`,
        stableRecordKey: record.stableRecordKey,
        stableRecordHash: record.stableRecordHash,
        shardBucket: record.bucket,
        canonicalType: 'VERCEL_DEPLOYMENT_EVIDENCE',
        canonicalState: 'CANONICALIZED',
        liveTruth: 'HISTORICAL_ONLY',
        classificationState: 'PENDING_THREAD_4',
        payloadFingerprint: record.payloadFingerprint,
        immutableProvenance: {
          sourceLane: record.source.lane,
          sourceSurface: record.source.surface,
          project: record.source.project,
          projectId: record.source.projectId,
          sourceEvidence: [...record.sourceEvidence].sort(),
          privacy: record.source.privacy,
          recoveryTruth: record.source.recoveryTruth,
        },
        deployment: {
          deploymentId: record.payload.deploymentId,
          created: record.payload.created,
          state: record.payload.state,
          target: record.payload.target,
          url: record.payload.url,
          gitRef: record.payload.gitRef,
          gitSha: record.payload.gitSha,
          gitMessage: record.payload.gitMessage,
        },
      };
    });

  for (const record of owned) {
    const check = hashKey(record.stableRecordKey);
    if (check.bucket !== bucket || !OWNED.has(check.bucket)) throw new Error(`Bucket ownership violation for ${record.stableRecordKey}`);
  }

  bucketCounts[bucket] = owned.length;
  thread3RecordCount += owned.length;
  const rel = `docs/recovery/live/canonical/thread3-g-bucket-${bucket}.json`;
  canonicalFiles.push(rel);
  const body = {
    contract: contract.contract,
    ownerThread: 3,
    ownedBucket: bucket,
    sourceLane: 'G',
    sourceRange: [201, 600],
    inputFingerprint,
    recordCount: owned.length,
    records: owned,
  };
  await writeFile(path.join(ROOT, rel), `${JSON.stringify(body, null, 2)}\n`, 'utf8');
}

if (thread3RecordCount !== allThread3Keys.size) throw new Error('Thread 3 count/uniqueness mismatch');
if (thread3RecordCount < 1 || thread3RecordCount >= 400) throw new Error(`Implausible Thread 3 ownership count ${thread3RecordCount}`);

const manifest = {
  contract: contract.contract,
  ownerThread: 3,
  scope: 'G_REHYDRATED_RECORDS_BUCKETS_5_9',
  sourceLane: 'G',
  sourceRange: [201, 600],
  sourceBatchCount: inputs.length,
  sourceRecordCount,
  sourceUniqueStableKeyCount: records.size,
  sourceInputFingerprint: inputFingerprint,
  duplicateStableKeyCount: duplicateStableKeys.length,
  payloadConflictCount: payloadConflicts.length,
  thread3CanonicalRecordCount: thread3RecordCount,
  bucketCounts,
  canonicalFiles,
  provenanceInputs: inputs,
  rules: [
    'Source evidence remains unchanged.',
    'Only buckets 5-9 are owned by Thread 3.',
    'No classification or module routing is asserted here.',
    'READY/production remains historical evidence only until separately VERIFIED_LIVE.',
    'Canonical count is valid only after these files are durably committed to GitHub.'
  ],
  downstream: {
    classificationOwner: 'THREAD_4',
    auditOwner: 'THREAD_7',
    durabilityOwner: 'THREAD_8'
  }
};
await writeFile(path.join(CANON_DIR, 'thread3-g-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const checkpoint = {
  thread: 3,
  status: 'G_CANONICAL_ARTIFACTS_GENERATED',
  contract: contract.contract,
  source: 'docs/recovery/live/shards/lane-g-20260915-rehydrated-terminal.json',
  sourceInputFingerprint: inputFingerprint,
  sourceRecordCount,
  canonicalRecordCount: thread3RecordCount,
  bucketCounts,
  canonicalManifest: 'docs/recovery/live/canonical/thread3-g-manifest.json',
  canonicalFiles,
  overlapWithThread2: 0,
  unresolvedConflicts: 0,
  next: [
    'Thread 4 may classify these canonical records without modifying source evidence.',
    'Thread 7 may reconcile global duplicates and source/canonical count integrity.',
    'Continue Thread 3 with eligible B/C/D/Pantavion intake only after ownership-safe source selection.'
  ]
};
await writeFile(path.join(SHARD_DIR, 'thread3-canonical-g.json'), `${JSON.stringify(checkpoint, null, 2)}\n`, 'utf8');

const handoff = {
  fromThread: 3,
  toThread: 4,
  handoffType: 'CANONICAL_RECORDS_READY_FOR_CLASSIFICATION',
  sourceLane: 'G',
  canonicalManifest: 'docs/recovery/live/canonical/thread3-g-manifest.json',
  canonicalFiles,
  canonicalRecordCount: thread3RecordCount,
  sourceInputFingerprint: inputFingerprint,
  constraints: [
    'Do not rewrite immutable source evidence.',
    'Use REVIEW_REQUIRED for uncertain semantic classification.',
    'Do not infer VERIFIED_LIVE from READY/production historical deployment state.'
  ]
};
await writeFile(path.join(HANDOFF_DIR, 'thread3-to-thread4-g.json'), `${JSON.stringify(handoff, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  ok: true,
  contract: contract.contract,
  sourceBatchCount: inputs.length,
  sourceRecordCount,
  thread3CanonicalRecordCount: thread3RecordCount,
  bucketCounts,
  inputFingerprint,
  canonicalFiles,
}, null, 2));
