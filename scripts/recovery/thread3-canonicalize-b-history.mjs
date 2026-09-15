import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const BATCH_DIR = path.join(ROOT, 'docs/recovery/live/batches');
const CANON_DIR = path.join(ROOT, 'docs/recovery/live/canonical');
const SHARD_DIR = path.join(ROOT, 'docs/recovery/live/shards');
const HANDOFF_DIR = path.join(ROOT, 'docs/recovery/live/handoffs');
const CONTRACT_PATH = path.join(CANON_DIR, 'CANONICAL_SHARDING_CONTRACT_V1.json');
const B_HEAD_PATH = 'docs/recovery/live/batches/lane-b-20260915T1316Z-vmxx-head.json';
const MIRROR_PROJECT = 'pantavion-planet-vmxx';
const MIRROR_PROJECT_ID = 'prj_YsZ25kIBmTByMYfT3WqpfrE9mFPU';
const OWNED = new Set([5, 6, 7, 8, 9]);
const CONTINUATION_RE = /^vercel-continuation-.*\.json$/;

const sha256Hex = (text) => createHash('sha256').update(text, 'utf8').digest('hex');
function hashKey(key) {
  const digest = createHash('sha256').update(key, 'utf8').digest();
  return { hex: digest.toString('hex'), bucket: Number(digest.readBigUInt64BE(0) % 10n) };
}
function rowObject(schema, row) {
  if (!Array.isArray(schema) || !Array.isArray(row)) return null;
  return Object.fromEntries(schema.map((name, index) => [name, row[index]]));
}
function normalizeDeployment(schema, row) {
  const obj = rowObject(schema, row);
  if (!obj) return null;
  const deploymentId = obj.deploymentId ?? obj.deployment_id ?? null;
  if (!deploymentId) return null;
  return {
    deploymentId,
    created: obj.created ?? obj.created_at ?? null,
    state: obj.state ?? null,
    target: obj.target ?? null,
    url: obj.url ?? null,
    gitRef: obj.gitRef ?? obj.githubRef ?? obj.git_ref ?? null,
    gitSha: obj.gitSha ?? obj.githubCommitSha ?? obj.git_sha ?? null,
    gitMessage: obj.gitMessage ?? obj.git_message ?? null,
  };
}

const contract = JSON.parse(await readFile(CONTRACT_PATH, 'utf8'));
if (contract.contract !== 'PANTAVION_CANONICAL_SHARDING_V1' || contract.hash?.algorithm !== 'SHA-256') throw new Error('Unexpected canonical sharding contract');
for (const vector of contract.testVectors ?? []) {
  const got = hashKey(vector.stableRecordKey);
  if (got.hex !== vector.sha256 || got.bucket !== vector.bucket) throw new Error('Sharding test vector failure');
}

const existingCanonical = new Map();
for (const bucket of [...OWNED]) {
  const rel = `docs/recovery/live/canonical/thread3-bd-bucket-${bucket}.json`;
  const body = JSON.parse(await readFile(path.join(ROOT, rel), 'utf8'));
  for (const record of body.records ?? []) existingCanonical.set(record.stableRecordKey, { canonicalRecordId: record.canonicalRecordId, source: rel });
}

const observations = [];
const sourceFiles = [];
let ignoredContinuationFilesWithoutMirrorPayload = 0;
let rejectedUnexpectedMirrorProject = 0;

{
  const raw = await readFile(path.join(ROOT, B_HEAD_PATH), 'utf8');
  const doc = JSON.parse(raw);
  if (doc.lane !== 'B' || doc.project !== MIRROR_PROJECT || doc.projectId !== MIRROR_PROJECT_ID) throw new Error('Unexpected Lane B head provenance');
  let accepted = 0;
  for (let index = 0; index < (doc.records ?? []).length; index += 1) {
    const deployment = normalizeDeployment(doc.tupleSchema, doc.records[index]);
    if (!deployment) continue;
    observations.push({ stableRecordKey: `${MIRROR_PROJECT_ID}:${deployment.deploymentId}`, sourcePath: B_HEAD_PATH, sourceKind: 'LANE_B_HEAD', sourceIndex: index, sourceFingerprint: sha256Hex(JSON.stringify(deployment)), deployment, sourceSemantic: 'RECOVERY_OPERATIONAL_MIRROR_CANDIDATE', countsTowardRecoveredSourceFloor: false, floorAccountingReason: 'Lane B self-generated recovery deployments are operational provenance and excluded from recovered-source-floor counts.' });
    accepted += 1;
  }
  sourceFiles.push({ path: B_HEAD_PATH, sha256: sha256Hex(raw), acceptedObservations: accepted });
}

const continuationNames = (await readdir(BATCH_DIR)).filter((name) => CONTINUATION_RE.test(name)).sort();
for (const name of continuationNames) {
  const rel = `docs/recovery/live/batches/${name}`;
  const raw = await readFile(path.join(BATCH_DIR, name), 'utf8');
  const doc = JSON.parse(raw);
  const mirror = doc.mirror;
  if (!mirror || typeof mirror !== 'object') { ignoredContinuationFilesWithoutMirrorPayload += 1; continue; }
  if (mirror.project && mirror.project !== MIRROR_PROJECT) { rejectedUnexpectedMirrorProject += 1; continue; }
  const rows = Array.isArray(mirror.deployments) ? mirror.deployments : Array.isArray(mirror.records) ? mirror.records : [];
  if (rows.length === 0) { sourceFiles.push({ path: rel, sha256: sha256Hex(raw), acceptedObservations: 0, terminalEvidenceOnly: mirror.terminal === true }); continue; }
  if (!Array.isArray(doc.tupleSchema)) throw new Error(`Mirror payload lacks tupleSchema: ${name}`);
  let accepted = 0;
  for (let index = 0; index < rows.length; index += 1) {
    const deployment = normalizeDeployment(doc.tupleSchema, rows[index]);
    if (!deployment) throw new Error(`Malformed mirror deployment row ${index} in ${name}`);
    observations.push({ stableRecordKey: `${MIRROR_PROJECT_ID}:${deployment.deploymentId}`, sourcePath: rel, sourceKind: 'VERCEL_CONTINUATION_MIRROR', sourceIndex: index, sourceFingerprint: sha256Hex(JSON.stringify(deployment)), deployment, sourceSemantic: 'MIRROR_EVIDENCE', countsTowardRecoveredSourceFloor: false, floorAccountingReason: 'Lane B mirror evidence is preserved canonically but excluded from recovered-source-floor inflation; semantic equivalence is audited separately.' });
    accepted += 1;
  }
  sourceFiles.push({ path: rel, sha256: sha256Hex(raw), acceptedObservations: accepted, terminalEvidenceOnly: false });
}

if (observations.length === 0) throw new Error('No Lane B history observations found');
const grouped = new Map();
for (const observation of observations) {
  const current = grouped.get(observation.stableRecordKey);
  if (current) current.push(observation); else grouped.set(observation.stableRecordKey, [observation]);
}

const duplicateObservationCount = observations.length - grouped.size;
let conflictingObservationCount = 0;
let alreadyCanonicalKeyCount = 0;
const existingCanonicalProvenance = [];
const newRecords = [];
for (const [stableRecordKey, group] of [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  const distinct = [...new Map(group.map((x) => [x.sourceFingerprint, x])).values()];
  if (distinct.length > 1) conflictingObservationCount += 1;
  const existing = existingCanonical.get(stableRecordKey);
  if (existing) {
    alreadyCanonicalKeyCount += 1;
    existingCanonicalProvenance.push({ stableRecordKey, canonicalRecordId: existing.canonicalRecordId, existingCanonicalFile: existing.source, additionalSourceEvidence: [...new Set(group.map((x) => x.sourcePath))].sort(), additionalObservationFingerprints: distinct.map((x) => x.sourceFingerprint).sort(), conflict: distinct.length > 1 });
    continue;
  }
  const hashed = hashKey(stableRecordKey);
  const selected = distinct[distinct.length - 1];
  newRecords.push({ canonicalRecordId: `vercel-deployment:${stableRecordKey}`, stableRecordKey, stableRecordHash: hashed.hex, shardBucket: hashed.bucket, canonicalType: 'VERCEL_DEPLOYMENT_EVIDENCE', canonicalState: 'CANONICALIZED', liveTruth: 'HISTORICAL_ONLY', classificationState: 'PENDING_THREAD_4', reconciliationState: distinct.length > 1 ? 'REVIEW_REQUIRED' : 'CONSISTENT', immutableProvenance: { sourceLane: 'B', project: MIRROR_PROJECT, projectId: MIRROR_PROJECT_ID, sourceEvidence: [...new Set(group.map((x) => x.sourcePath))].sort(), observationCount: group.length, distinctPayloadCount: distinct.length, observationFingerprints: distinct.map((x) => x.sourceFingerprint).sort(), privacy: 'PUBLIC_SAFE_SANITIZED', sourceKinds: [...new Set(group.map((x) => x.sourceKind))].sort() }, sourceAccounting: { sourceSemantic: selected.sourceSemantic, countsTowardRecoveredSourceFloor: false, assertedByRecoveryPolicy: true, reason: selected.floorAccountingReason }, deployment: selected.deployment });
}

await mkdir(CANON_DIR, { recursive: true }); await mkdir(SHARD_DIR, { recursive: true }); await mkdir(HANDOFF_DIR, { recursive: true });
const sourceInputFingerprint = sha256Hex(sourceFiles.map((x) => `${x.path}:${x.sha256}:${x.acceptedObservations}`).join('\n'));
const bucketCounts = {}; const canonicalFiles = []; let thread3CanonicalRecordCount = 0; const seenOwned = new Set();
for (const bucket of [...OWNED].sort((a, b) => a - b)) {
  const owned = newRecords.filter((record) => record.shardBucket === bucket).sort((a, b) => a.stableRecordKey.localeCompare(b.stableRecordKey));
  for (const record of owned) { if (seenOwned.has(record.stableRecordKey)) throw new Error(`Duplicate Thread 3 output key ${record.stableRecordKey}`); seenOwned.add(record.stableRecordKey); const check = hashKey(record.stableRecordKey); if (check.bucket !== bucket || !OWNED.has(check.bucket)) throw new Error(`Bucket ownership violation ${record.stableRecordKey}`); }
  bucketCounts[bucket] = owned.length; thread3CanonicalRecordCount += owned.length;
  const rel = `docs/recovery/live/canonical/thread3-b-history-bucket-${bucket}.json`; canonicalFiles.push(rel);
  await writeFile(path.join(ROOT, rel), `${JSON.stringify({ contract: contract.contract, ownerThread: 3, ownedBucket: bucket, sourceLane: 'B', sourceProject: MIRROR_PROJECT, sourceProjectId: MIRROR_PROJECT_ID, sourceInputFingerprint, recordCount: owned.length, records: owned }, null, 2)}\n`, 'utf8');
}
const allNewOwnedCount = newRecords.filter((record) => OWNED.has(record.shardBucket)).length;
if (thread3CanonicalRecordCount !== allNewOwnedCount || thread3CanonicalRecordCount !== seenOwned.size) throw new Error('Thread 3 B history count mismatch');

const manifest = { contract: contract.contract, ownerThread: 3, scope: 'LANE_B_MIRROR_HISTORY_BUCKETS_5_9', sourceProject: MIRROR_PROJECT, sourceProjectId: MIRROR_PROJECT_ID, sourceInputFingerprint, sourceFileCount: sourceFiles.length, sourceFiles, observedRowCount: observations.length, uniqueStableKeyCount: grouped.size, duplicateObservationCount, conflictingObservationCount, alreadyCanonicalKeyCount, existingCanonicalProvenance, newUniqueStableKeyCount: newRecords.length, thread3CanonicalRecordCount, bucketCounts, recoveredSourceFloorContribution: 0, ignoredContinuationFilesWithoutMirrorPayload, rejectedUnexpectedMirrorProject, canonicalFiles, rules: ['Only explicit Lane B head rows and explicit continuation mirror payload rows are consumed.', 'Summary-only ranges are never materialized as records.', 'Stable identity is projectId:deploymentId.', 'Keys already present in Thread 3 B/D canonical files are not emitted again; their additional source provenance is recorded in this manifest.', 'Mirror/recovery-operational evidence is preserved but does not inflate recovered-source-floor counts.', 'Only buckets 5-9 are emitted by Thread 3.', 'No classification, module routing, production readiness, or VERIFIED_LIVE status is inferred.'], downstream: { classificationOwner: 'THREAD_4', auditOwner: 'THREAD_7', durabilityOwner: 'THREAD_8' } };
await writeFile(path.join(CANON_DIR, 'thread3-b-history-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
const checkpoint = { thread: 3, status: 'B_HISTORY_CANONICAL_ARTIFACTS_GENERATED', contract: contract.contract, sourceInputFingerprint, observedRowCount: observations.length, uniqueStableKeyCount: grouped.size, alreadyCanonicalKeyCount, canonicalRecordCount: thread3CanonicalRecordCount, bucketCounts, recoveredSourceFloorContribution: 0, conflictingObservationCount, canonicalManifest: 'docs/recovery/live/canonical/thread3-b-history-manifest.json', canonicalFiles, overlapWithThread2: 0, next: ['Thread 4 classification', 'Thread 7 semantic-mirror/global reconciliation', 'Thread 8 durability binding'] };
await writeFile(path.join(SHARD_DIR, 'thread3-canonical-b-history.json'), `${JSON.stringify(checkpoint, null, 2)}\n`, 'utf8');
await writeFile(path.join(HANDOFF_DIR, 'thread3-to-thread4-b-history.json'), `${JSON.stringify({ fromThread: 3, toThread: 4, handoffType: 'CANONICAL_RECORDS_READY_FOR_CLASSIFICATION', sourceLane: 'B', canonicalManifest: 'docs/recovery/live/canonical/thread3-b-history-manifest.json', canonicalFiles, canonicalRecordCount: thread3CanonicalRecordCount, sourceInputFingerprint, constraints: ['Do not rewrite source evidence.', 'Preserve mirror/recovery operational semantics as provenance.', 'Use REVIEW_REQUIRED when semantic classification is uncertain.', 'Do not infer VERIFIED_LIVE from historical deployment state.'] }, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ ok: true, sourceFileCount: sourceFiles.length, observedRowCount: observations.length, uniqueStableKeyCount: grouped.size, duplicateObservationCount, conflictingObservationCount, alreadyCanonicalKeyCount, newUniqueStableKeyCount: newRecords.length, thread3CanonicalRecordCount, bucketCounts, recoveredSourceFloorContribution: 0, ignoredContinuationFilesWithoutMirrorPayload, rejectedUnexpectedMirrorProject, sourceInputFingerprint }, null, 2));
