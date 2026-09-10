const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const mappingsPath = path.join(root, 'data', 'recovery', 'innovation-capability-mapping', 'capability-mappings.json');
const overlapsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-overlap-review', 'review-queue.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review');
const manifestPath = path.join(dir, 'manifest.json');
const queuePath = path.join(dir, 'maturity-review-queue.json');
const csvPath = path.join(dir, 'maturity-review-queue.csv');
const expectedParentAtomCount = 38014;
const expectedParentAtomFingerprint = '95f5fa3cc66fbe5f60780652c76e6bd949bb6f6ee514b18b1c329b1d10decf02';
const expectedParentOverlapFingerprint = '63ac318e83901cfff998e50f9d02cd10fdfe1efecf049c5ab1f94a3eae399783';

function fail(message) {
  console.error('PANTAVION INNOVATION MATURITY EVIDENCE GATE: FAIL - ' + message);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function csvRecordCount(value) {
  let quoted = false;
  let records = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '"') {
      if (quoted && value[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (value[i] === '\n' && !quoted) records += 1;
  }
  if (quoted) fail('CSV contains an unterminated quoted field');
  return records;
}

for (const file of [atomsPath, mappingsPath, overlapsPath, manifestPath, queuePath, csvPath]) {
  if (!fs.existsSync(file)) fail('required artifact missing: ' + path.relative(root, file));
}
const atomsProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const mappingsProjection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const overlapsProjection = JSON.parse(fs.readFileSync(overlapsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');

if (manifest.id !== 'pantavion_innovation_maturity_evidence_review_v1') fail('unexpected manifest id');
if (!Array.isArray(atomsProjection.atoms) || !Array.isArray(mappingsProjection.mappings) || !Array.isArray(overlapsProjection.pairs) || !Array.isArray(queue.reviews)) fail('required arrays missing');
if (JSON.stringify(queue.manifest) !== JSON.stringify(manifest)) fail('embedded manifest differs from manifest.json');

const atoms = new Map(atomsProjection.atoms.map(atom => [atom.atomId, atom]));
const mappings = new Map(mappingsProjection.mappings.map(mapping => [mapping.atomId, mapping]));
const overlapCounts = new Map();
for (const pair of overlapsProjection.pairs) {
  overlapCounts.set(pair.leftAtomId, (overlapCounts.get(pair.leftAtomId) || 0) + 1);
  overlapCounts.set(pair.rightAtomId, (overlapCounts.get(pair.rightAtomId) || 0) + 1);
}
if (atoms.size !== atomsProjection.atoms.length || mappings.size !== mappingsProjection.mappings.length) fail('source IDs are not unique');

const seen = new Set();
let atomsWithSourceTrace = 0;
let atomsMissingSourceTrace = 0;
let atomsWithOverlapSuggestions = 0;
let externalOnlyOriginAtoms = 0;
let previousKey = '';

for (const review of queue.reviews) {
  if (seen.has(review.atomId)) fail('duplicate review atom: ' + review.atomId);
  seen.add(review.atomId);
  const atom = atoms.get(review.atomId);
  const mapping = mappings.get(review.atomId);
  if (!atom || !mapping) fail('review references unknown atom or mapping: ' + review.atomId);
  const expectedEvidenceRefs = [...(atom.evidenceRefs || [])].sort();
  const expectedSourceCandidateIds = [...(atom.sourceCandidateIds || [])].sort();
  const expectedOriginStatuses = [...(atom.originStatuses || [])].sort();
  const expectedCapabilities = (mapping.candidateCapabilities || []).map(candidate => candidate.capabilityId);
  const expectedOverlapCount = overlapCounts.get(review.atomId) || 0;
  const expectedPriority = !expectedEvidenceRefs.length
    ? 'P0_SOURCE_TRACE_MISSING_HOLD'
    : expectedOverlapCount > 0
      ? 'P1_OVERLAP_ADJUDICATION_REQUIRED'
      : expectedOriginStatuses.length > 0 && expectedOriginStatuses.every(status => status === 'EXTERNAL_SIGNAL_ONLY')
        ? 'P2_EXTERNAL_ONLY_ORIGIN_REVIEW'
        : 'P3_MATURITY_EVIDENCE_REVIEW';
  if (review.atomFingerprint !== atom.normalizedFingerprint) fail('atom fingerprint mismatch: ' + review.atomId);
  if (JSON.stringify(review.evidenceRefs) !== JSON.stringify(expectedEvidenceRefs)) fail('evidence refs mismatch: ' + review.atomId);
  if (JSON.stringify(review.sourceCandidateIds) !== JSON.stringify(expectedSourceCandidateIds)) fail('source candidates mismatch: ' + review.atomId);
  if (JSON.stringify(review.originStatuses) !== JSON.stringify(expectedOriginStatuses)) fail('origin statuses mismatch: ' + review.atomId);
  if (JSON.stringify(review.candidateCapabilityIds) !== JSON.stringify(expectedCapabilities)) fail('candidate capabilities mismatch: ' + review.atomId);
  if (review.overlapSuggestionCount !== expectedOverlapCount || review.reviewPriority !== expectedPriority) fail('review priority evidence mismatch: ' + review.atomId);
  const key = review.reviewPriority + ':' + review.atomId;
  if (previousKey && key.localeCompare(previousKey) < 0) fail('review queue ordering is not canonical: ' + review.atomId);
  previousKey = key;
  if (review.sourceTraceStatus !== (expectedEvidenceRefs.length ? 'SOURCE_TRACE_PRESENT_UNVERIFIED' : 'SOURCE_TRACE_MISSING_HOLD')) fail('source trace status mismatch: ' + review.atomId);
  for (const field of ['implementationEvidenceStatus','benchmarkEvidenceStatus','prototypeEvidenceStatus','testEvidenceStatus','deploymentEvidenceStatus','verifiedLiveEvidenceStatus']) {
    if (review[field] !== 'UNVERIFIED') fail('unsupported evidence state: ' + field + ' for ' + review.atomId);
  }
  if (review.maturityStatus !== 'UNASSESSED' || review.maturityClaimAllowed !== false) fail('unsupported maturity claim: ' + review.atomId);
  if (review.humanReviewed !== false || review.ownerApproved !== false || review.executionAllowed !== false || review.authorizationEffect !== 'none') fail('unauthorized state: ' + review.atomId);
  if (review.decision !== 'HOLD_EVIDENCE_REVIEW_REQUIRED') fail('invalid review decision: ' + review.atomId);
  if (expectedEvidenceRefs.length) atomsWithSourceTrace += 1; else atomsMissingSourceTrace += 1;
  if (expectedOverlapCount > 0) atomsWithOverlapSuggestions += 1;
  if (expectedOriginStatuses.length > 0 && expectedOriginStatuses.every(status => status === 'EXTERNAL_SIGNAL_ONLY')) externalOnlyOriginAtoms += 1;
}

if (seen.size !== atoms.size || queue.reviews.length !== atoms.size) fail('not all source atoms are represented exactly once');
for (const atomId of atoms.keys()) if (!seen.has(atomId)) fail('source atom omitted: ' + atomId);
const expectedSourceAtomFingerprint = hash(atomsProjection.atoms.map(atom => atom.atomId + ':' + atom.normalizedFingerprint).sort().join('\n'));
const expectedQueueFingerprint = hash(queue.reviews.map(review => [
  review.atomId,
  review.reviewPriority,
  review.evidenceRefs.join('|'),
  review.candidateCapabilityIds.join('|'),
  review.overlapSuggestionCount,
].join(':')).join('\n'));
if (atoms.size !== expectedParentAtomCount) fail('exact parent atom count drifted: expected ' + expectedParentAtomCount + ', received ' + atoms.size);
if (expectedSourceAtomFingerprint !== expectedParentAtomFingerprint) fail('exact parent atom fingerprint drifted');
if (overlapsProjection.manifest?.reviewQueueFingerprint !== expectedParentOverlapFingerprint) fail('exact parent overlap fingerprint drifted');
if (manifest.sourceAtomFingerprint !== expectedSourceAtomFingerprint) fail('source atom fingerprint mismatch');
if (manifest.sourceOverlapFingerprint !== overlapsProjection.manifest?.reviewQueueFingerprint) fail('source overlap fingerprint mismatch');
if (manifest.maturityQueueFingerprint !== expectedQueueFingerprint) fail('maturity queue fingerprint mismatch');
const totals = manifest.totals || {};
if (totals.sourceAtoms !== atoms.size || totals.queuedAtoms !== atoms.size) fail('coverage totals mismatch');
if (totals.atomsWithSourceTrace !== atomsWithSourceTrace || totals.atomsMissingSourceTrace !== atomsMissingSourceTrace) fail('source trace totals mismatch');
if (totals.atomsWithOverlapSuggestions !== atomsWithOverlapSuggestions || totals.externalOnlyOriginAtoms !== externalOnlyOriginAtoms) fail('review signal totals mismatch');
for (const field of ['humanReviewedAtoms','maturityAssessedAtoms','maturityClaimsAllowed','ownerApprovedAtoms','executionAuthorizedAtoms','unsupportedNoveltyClaims']) {
  if (totals[field] !== 0) fail('non-zero forbidden total: ' + field);
}
if (csvRecordCount(csv) !== queue.reviews.length + 1) fail('CSV logical record count mismatch');

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION MATURITY EVIDENCE REVIEW',
  result: 'PASS',
  sourceAtoms: atoms.size,
  queuedAtoms: queue.reviews.length,
  atomsWithSourceTrace,
  atomsMissingSourceTrace,
  atomsWithOverlapSuggestions,
  externalOnlyOriginAtoms,
  humanReviewedAtoms: 0,
  maturityAssessedAtoms: 0,
  maturityClaimsAllowed: 0,
  executionAuthorizedAtoms: 0,
  unsupportedNoveltyClaims: 0,
  maturityQueueFingerprint: manifest.maturityQueueFingerprint,
}, null, 2));
