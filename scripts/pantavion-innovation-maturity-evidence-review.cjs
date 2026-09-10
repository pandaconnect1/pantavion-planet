const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const mappingsPath = path.join(root, 'data', 'recovery', 'innovation-capability-mapping', 'capability-mappings.json');
const overlapsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-overlap-review', 'review-queue.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review');

function fail(message) {
  console.error('PANTAVION INNOVATION MATURITY EVIDENCE REVIEW: FAIL - ' + message);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function csvEscape(value) { return '"' + String(value ?? '').replace(/"/g, '""') + '"'; }

for (const file of [atomsPath, mappingsPath, overlapsPath]) {
  if (!fs.existsSync(file)) fail('missing input: ' + path.relative(root, file));
}
const atomsProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const mappingsProjection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const overlapsProjection = JSON.parse(fs.readFileSync(overlapsPath, 'utf8'));
if (!Array.isArray(atomsProjection.atoms) || !Array.isArray(mappingsProjection.mappings) || !Array.isArray(overlapsProjection.pairs)) {
  fail('required input arrays missing');
}

const mappingByAtom = new Map(mappingsProjection.mappings.map(mapping => [mapping.atomId, mapping]));
const overlapCounts = new Map();
for (const pair of overlapsProjection.pairs) {
  overlapCounts.set(pair.leftAtomId, (overlapCounts.get(pair.leftAtomId) || 0) + 1);
  overlapCounts.set(pair.rightAtomId, (overlapCounts.get(pair.rightAtomId) || 0) + 1);
}

function priorityFor(atom, overlapSuggestionCount) {
  if (!(atom.evidenceRefs || []).length) return 'P0_SOURCE_TRACE_MISSING_HOLD';
  if (overlapSuggestionCount > 0) return 'P1_OVERLAP_ADJUDICATION_REQUIRED';
  if ((atom.originStatuses || []).length > 0 && atom.originStatuses.every(status => status === 'EXTERNAL_SIGNAL_ONLY')) {
    return 'P2_EXTERNAL_ONLY_ORIGIN_REVIEW';
  }
  return 'P3_MATURITY_EVIDENCE_REVIEW';
}

const reviews = atomsProjection.atoms.map(atom => {
  const mapping = mappingByAtom.get(atom.atomId);
  if (!mapping) fail('capability mapping missing for ' + atom.atomId);
  const evidenceRefs = [...(atom.evidenceRefs || [])].sort();
  const sourceCandidateIds = [...(atom.sourceCandidateIds || [])].sort();
  const originStatuses = [...(atom.originStatuses || [])].sort();
  const candidateCapabilityIds = (mapping.candidateCapabilities || []).map(candidate => candidate.capabilityId);
  const overlapSuggestionCount = overlapCounts.get(atom.atomId) || 0;
  return {
    atomId: atom.atomId,
    atomFingerprint: atom.normalizedFingerprint,
    sourceCandidateIds,
    evidenceRefs,
    originStatuses,
    candidateCapabilityIds,
    overlapSuggestionCount,
    reviewPriority: priorityFor(atom, overlapSuggestionCount),
    sourceTraceStatus: evidenceRefs.length ? 'SOURCE_TRACE_PRESENT_UNVERIFIED' : 'SOURCE_TRACE_MISSING_HOLD',
    implementationEvidenceStatus: 'UNVERIFIED',
    benchmarkEvidenceStatus: 'UNVERIFIED',
    prototypeEvidenceStatus: 'UNVERIFIED',
    testEvidenceStatus: 'UNVERIFIED',
    deploymentEvidenceStatus: 'UNVERIFIED',
    verifiedLiveEvidenceStatus: 'UNVERIFIED',
    maturityStatus: 'UNASSESSED',
    maturityClaimAllowed: false,
    humanReviewed: false,
    ownerApproved: false,
    executionAllowed: false,
    authorizationEffect: 'none',
    decision: 'HOLD_EVIDENCE_REVIEW_REQUIRED',
    nextAction: 'A human reviewer must inspect source provenance and bind independent implementation, benchmark, prototype, test, deployment, and live evidence before any maturity transition.',
  };
}).sort((a, b) => a.reviewPriority.localeCompare(b.reviewPriority) || a.atomId.localeCompare(b.atomId));

const sourceAtomFingerprint = hash(
  atomsProjection.atoms.map(atom => atom.atomId + ':' + atom.normalizedFingerprint).sort().join('\n')
);
const sourceOverlapFingerprint = overlapsProjection.manifest?.reviewQueueFingerprint || null;
const maturityQueueFingerprint = hash(
  reviews.map(review => [
    review.atomId,
    review.reviewPriority,
    review.evidenceRefs.join('|'),
    review.candidateCapabilityIds.join('|'),
    review.overlapSuggestionCount,
  ].join(':')).join('\n')
);

const totals = {
  sourceAtoms: atomsProjection.atoms.length,
  queuedAtoms: reviews.length,
  atomsWithSourceTrace: reviews.filter(review => review.evidenceRefs.length > 0).length,
  atomsMissingSourceTrace: reviews.filter(review => review.evidenceRefs.length === 0).length,
  atomsWithOverlapSuggestions: reviews.filter(review => review.overlapSuggestionCount > 0).length,
  externalOnlyOriginAtoms: reviews.filter(review => review.originStatuses.length > 0 && review.originStatuses.every(status => status === 'EXTERNAL_SIGNAL_ONLY')).length,
  humanReviewedAtoms: 0,
  maturityAssessedAtoms: 0,
  maturityClaimsAllowed: 0,
  ownerApprovedAtoms: 0,
  executionAuthorizedAtoms: 0,
  unsupportedNoveltyClaims: 0,
};

const manifest = {
  id: 'pantavion_innovation_maturity_evidence_review_v1',
  lifecycleState: 'CODED',
  sourceAtomizationId: atomsProjection.manifest?.id || null,
  sourceCapabilityMappingId: mappingsProjection.manifest?.id || null,
  sourceOverlapReviewId: overlapsProjection.manifest?.id || null,
  sourceAtomFingerprint,
  sourceOverlapFingerprint,
  maturityQueueFingerprint,
  method: 'Deterministic loss-preserving evidence inventory and human-review prioritization; no maturity inference is performed.',
  truthRule: 'Queue position and source-trace presence are not maturity evidence. Every atom remains unassessed and held until human review binds independent evidence.',
  totals,
  requiredEvidenceDimensions: ['IMPLEMENTATION', 'BENCHMARK', 'PROTOTYPE', 'TEST', 'DEPLOYMENT', 'VERIFIED_LIVE'],
  requiredNextStages: ['HUMAN_MATURITY_EVIDENCE_REVIEW', 'GLOBAL_PRIOR_ART_RESEARCH', 'NOVELTY_SCORING', 'PRESEED_SELECTION'],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'maturity-review-queue.json'), JSON.stringify({ manifest, reviews }, null, 2) + '\n');
const rows = [['atom_id','review_priority','source_trace_status','evidence_ref_count','candidate_capabilities','overlap_suggestion_count','maturity_status','decision','human_reviewed','owner_approved','execution_allowed']];
for (const review of reviews) rows.push([
  review.atomId,
  review.reviewPriority,
  review.sourceTraceStatus,
  review.evidenceRefs.length,
  review.candidateCapabilityIds.join('|'),
  review.overlapSuggestionCount,
  review.maturityStatus,
  review.decision,
  review.humanReviewed,
  review.ownerApproved,
  review.executionAllowed,
]);
fs.writeFileSync(path.join(outDir, 'maturity-review-queue.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
