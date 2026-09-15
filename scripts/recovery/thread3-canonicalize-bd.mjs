import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const CANON_DIR = path.join(ROOT, 'docs/recovery/live/canonical');
const SHARD_DIR = path.join(ROOT, 'docs/recovery/live/shards');
const HANDOFF_DIR = path.join(ROOT, 'docs/recovery/live/handoffs');
const CONTRACT_PATH = path.join(CANON_DIR, 'CANONICAL_SHARDING_CONTRACT_V1.json');
const B_PATH = 'docs/recovery/live/batches/lane-b-20260915T1356Z-incremental-dedupe.json';
const D_PATH = 'docs/recovery/live/shards/lane-d-legacy-b.json';
const OWNED = new Set([5, 6, 7, 8, 9]);

const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
function hashKey(key) {
  const digest = createHash('sha256').update(key, 'utf8').digest();
  return { hex: digest.toString('hex'), bucket: Number(digest.readBigUInt64BE(0) % 10n) };
}

const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));
if (contract.contract !== 'PANTAVION_CANONICAL_SHARDING_V1' || contract.hash?.algorithm !== 'SHA-256') {
  throw new Error('Unexpected canonical sharding contract');
}
for (const vector of contract.testVectors ?? []) {
  const got = hashKey(vector.stableRecordKey);
  if (got.hex !== vector.sha256 || got.bucket !== vector.bucket) throw new Error('Sharding test vector failure');
}

const bRaw = await readFile(path.join(ROOT, B_PATH), 'utf8');
const dRaw = await readFile(path.join(ROOT, D_PATH), 'utf8');
const b = JSON.parse(bRaw);
const d = JSON.parse(dRaw);
if (b.lane !== 'B' || b.projectId !== 'prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU') throw new Error('Unexpected Lane B provenance');
if (d.lane !== 'D' || d.secret_values_recorded !== false) throw new Error('Unexpected Lane D provenance/privacy');

const sourceRecords = [];
const tuple = b.tupleSchema;
if (!Array.isArray(tuple)) throw new Error('Lane B tuple schema missing');
for (let i = 0; i < b.records.length; i += 1) {
  const row = b.records[i];
  const record = Object.fromEntries(tuple.map((name, idx) => [name, row[idx]]));
  sourceRecords.push({
    sourceLane: 'B',
    sourcePath: B_PATH,
    sourceIndex: i,
    project: b.project,
    projectId: b.projectId,
    deploymentId: record.deploymentId,
    deployment: {
      deploymentId: record.deploymentId,
      created: record.created ?? null,
      state: record.state ?? null,
      target: record.target ?? null,
      url: null,
      gitRef: record.gitRef ?? null,
      gitSha: record.gitSha ?? null,
      gitMessage: record.gitMessage ?? null,
    },
    sourceClassification: record.classification ?? null,
    countsTowardRecoveredSourceFloor: record.countsTowardRecoveredSourceFloor === true,
    floorAccountingAssertedBySource: true,
    privacy: b.sanitized ? 'PUBLIC_SAFE_SANITIZED' : 'UNKNOWN',
  });
}

for (const project of d.projects ?? []) {
  for (let i = 0; i < (project.deployments ?? []).length; i += 1) {
    const record = project.deployments[i];
    sourceRecords.push({
      sourceLane: 'D',
      sourcePath: D_PATH,
      sourceIndex: i,
      project: project.project,
      projectId: project.project_id,
      deploymentId: record.deployment_id,
      deployment: {
        deploymentId: record.deployment_id,
        created: record.created_at ?? null,
        state: record.state ?? null,
        target: record.target ?? null,
        url: null,
        gitRef: record.git_ref ?? null,
        gitSha: record.git_sha ?? null,
        gitMessage: record.git_message ?? null,
        gitRepo: record.git_repo ?? null,
      },
      sourceClassification: record.uniqueness ?? null,
      countsTowardRecoveredSourceFloor: null,
      floorAccountingAssertedBySource: false,
      privacy: record.privacy ?? 'PUBLIC_SAFE',
      originalRescueState: record.rescue_state ?? 'CAPTURED',
    });
  }
}

if (d.summary?.deployment_records_preserved !== 12) throw new Error('Lane D expected 12 preserved deployment records');
const dObserved = sourceRecords.filter((x) => x.sourceLane === 'D').length;
if (dObserved !== 12) throw new Error(`Lane D observed ${dObserved}, expected 12`);

const merged = new Map();
let duplicateObservationCount = 0;
let conflictingObservationCount = 0;
for (const item of sourceRecords) {
  const stableRecordKey = `${item.projectId}:${item.deploymentId}`;
  const payloadFingerprint = sha256Hex(JSON.stringify(item.deployment));
  const observation = {
    sourcePath: item.sourcePath,
    sourceIndex: item.sourceIndex,
    payloadFingerprint,
    deployment: item.deployment,
    sourceClassification: item.sourceClassification,
    countsTowardRecoveredSourceFloor: item.countsTowardRecoveredSourceFloor,
    floorAccountingAssertedBySource: item.floorAccountingAssertedBySource,
  };
  const existing = merged.get(stableRecordKey);
  if (!existing) {
    const hashed = hashKey(stableRecordKey);
    merged.set(stableRecordKey, {
      stableRecordKey,
      stableRecordHash: hashed.hex,
      bucket: hashed.bucket,
      sourceLane: item.sourceLane,
      project: item.project,
      projectId: item.projectId,
      deploymentId: item.deploymentId,
      privacy: item.privacy,
      originalRescueState: item.originalRescueState ?? null,
      observations: [observation],
    });
    continue;
  }
  duplicateObservationCount += 1;
  if (!existing.observations.some((x) => x.payloadFingerprint === payloadFingerprint)) conflictingObservationCount += 1;
  existing.observations.push(observation);
}

if (merged.size !== 60) throw new Error(`Expected 60 unique B+D deployment keys (48 B + 12 D), found ${merged.size}`);

const inputs = [
  { path: B_PATH, sha256: sha256Hex(bRaw), observedRows: b.records.length, uniqueDeclared: b.dedupe?.uniqueNewDeploymentIds },
  { path: D_PATH, sha256: sha256Hex(dRaw), observedRows: dObserved, uniqueDeclared: d.summary?.deployment_records_preserved },
];
const inputFingerprint = sha256Hex(inputs.map((x) => `${x.path}:${x.sha256}`).join('\n'));

await mkdir(CANON_DIR, { recursive: true });
await mkdir(SHARD_DIR, { recursive: true });
await mkdir(HANDOFF_DIR, { recursive: true });

const bucketCounts = {};
const laneCounts = { B: 0, D: 0 };
const canonicalFiles = [];
let thread3CanonicalRecordCount = 0;
let thread3RecoveredSourceFloorContribution = 0;
const seen = new Set();

for (const bucket of [...OWNED].sort((a, b2) => a - b2)) {
  const records = [...merged.values()]
    .filter((record) => record.bucket === bucket)
    .sort((a, b2) => a.stableRecordKey.localeCompare(b2.stableRecordKey))
    .map((record) => {
      if (seen.has(record.stableRecordKey)) throw new Error(`Duplicate canonical key ${record.stableRecordKey}`);
      seen.add(record.stableRecordKey);
      laneCounts[record.sourceLane] += 1;
      const uniquePayloads = [...new Map(record.observations.map((x) => [x.payloadFingerprint, x])).values()];
      const selected = uniquePayloads[uniquePayloads.length - 1];
      const floorValues = record.observations
        .filter((x) => x.floorAccountingAssertedBySource)
        .map((x) => x.countsTowardRecoveredSourceFloor);
      const floorContribution = floorValues.length ? floorValues.some(Boolean) : null;
      if (floorContribution === true) thread3RecoveredSourceFloorContribution += 1;
      return {
        canonicalRecordId: `vercel-deployment:${record.stableRecordKey}`,
        stableRecordKey: record.stableRecordKey,
        stableRecordHash: record.stableRecordHash,
        shardBucket: record.bucket,
        canonicalType: 'VERCEL_DEPLOYMENT_EVIDENCE',
        canonicalState: 'CANONICALIZED',
        liveTruth: 'HISTORICAL_ONLY',
        classificationState: 'PENDING_THREAD_4',
        reconciliationState: uniquePayloads.length > 1 ? 'REVIEW_REQUIRED' : 'CONSISTENT',
        immutableProvenance: {
          sourceLane: record.sourceLane,
          project: record.project,
          projectId: record.projectId,
          sourceEvidence: [...new Set(record.observations.map((x) => x.sourcePath))].sort(),
          observationCount: record.observations.length,
          distinctPayloadCount: uniquePayloads.length,
          observationFingerprints: uniquePayloads.map((x) => x.payloadFingerprint).sort(),
          privacy: record.privacy,
          originalRescueState: record.originalRescueState,
        },
        sourceAccounting: {
          sourceClassification: selected.sourceClassification,
          countsTowardRecoveredSourceFloor: floorContribution,
          assertedBySource: floorContribution !== null,
        },
        deployment: selected.deployment,
      };
    });

  for (const record of records) {
    const check = hashKey(record.stableRecordKey);
    if (check.bucket !== bucket || !OWNED.has(check.bucket)) throw new Error(`Bucket ownership violation ${record.stableRecordKey}`);
  }
  bucketCounts[bucket] = records.length;
  thread3CanonicalRecordCount += records.length;
  const rel = `docs/recovery/live/canonical/thread3-bd-bucket-${bucket}.json`;
  canonicalFiles.push(rel);
  await writeFile(path.join(ROOT, rel), `${JSON.stringify({
    contract: contract.contract,
    ownerThread: 3,
    ownedBucket: bucket,
    sourceLanes: ['B', 'D'],
    inputFingerprint,
    recordCount: records.length,
    records,
  }, null, 2)}\n`, 'utf8');
}

if (thread3CanonicalRecordCount !== seen.size) throw new Error('Thread 3 B/D count mismatch');
const manifest = {
  contract: contract.contract,
  ownerThread: 3,
  scope: 'LANES_B_D_BUCKETS_5_9',
  sourceInputFingerprint: inputFingerprint,
  inputs,
  sourceObservedRows: sourceRecords.length,
  sourceUniqueStableKeyCount: merged.size,
  duplicateObservationCount,
  conflictingObservationCount,
  thread3CanonicalRecordCount,
  thread3LaneCounts: laneCounts,
  bucketCounts,
  thread3RecoveredSourceFloorContribution,
  canonicalFiles,
  rules: [
    'Lane B RECOVERY_OPERATIONAL deployments are preserved as provenance but do not increase recovered-source floor.',
    'Lane D recovered-source-floor contribution is not asserted where source evidence does not explicitly define it.',
    'Only buckets 5-9 are owned by Thread 3.',
    'Source evidence is never modified.',
    'Distinct observations of one stable key are merged; conflicting payloads become REVIEW_REQUIRED rather than duplicate canonical identities.',
    'No semantic module classification or live-runtime verification is asserted here.'
  ],
  downstream: { classificationOwner: 'THREAD_4', auditOwner: 'THREAD_7', durabilityOwner: 'THREAD_8' }
};
await writeFile(path.join(CANON_DIR, 'thread3-bd-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

await writeFile(path.join(SHARD_DIR, 'thread3-canonical-bd.json'), `${JSON.stringify({
  thread: 3,
  status: 'B_D_CANONICAL_ARTIFACTS_GENERATED',
  contract: contract.contract,
  sourceInputFingerprint: inputFingerprint,
  sourceUniqueStableKeyCount: merged.size,
  canonicalRecordCount: thread3CanonicalRecordCount,
  bucketCounts,
  laneCounts,
  recoveredSourceFloorContribution: thread3RecoveredSourceFloorContribution,
  conflictingObservationCount,
  canonicalManifest: 'docs/recovery/live/canonical/thread3-bd-manifest.json',
  canonicalFiles,
  overlapWithThread2: 0,
  next: ['Thread 4 classification', 'Thread 7 global reconciliation', 'Thread 8 durability binding']
}, null, 2)}\n`, 'utf8');

await writeFile(path.join(HANDOFF_DIR, 'thread3-to-thread4-bd.json'), `${JSON.stringify({
  fromThread: 3,
  toThread: 4,
  handoffType: 'CANONICAL_RECORDS_READY_FOR_CLASSIFICATION',
  sourceLanes: ['B', 'D'],
  canonicalManifest: 'docs/recovery/live/canonical/thread3-bd-manifest.json',
  canonicalFiles,
  canonicalRecordCount: thread3CanonicalRecordCount,
  sourceInputFingerprint: inputFingerprint,
  constraints: ['Do not rewrite source evidence.', 'Use REVIEW_REQUIRED when semantic classification is uncertain.', 'Do not convert historical READY state into VERIFIED_LIVE.']
}, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  ok: true,
  sourceObservedRows: sourceRecords.length,
  sourceUniqueStableKeyCount: merged.size,
  duplicateObservationCount,
  conflictingObservationCount,
  thread3CanonicalRecordCount,
  laneCounts,
  bucketCounts,
  thread3RecoveredSourceFloorContribution,
  inputFingerprint,
}, null, 2));
