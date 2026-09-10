const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const mappingsPath = path.join(root, 'data', 'recovery', 'innovation-capability-mapping', 'capability-mappings.json');
const maturityPath = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review', 'maturity-review-queue.json');
const outDir = path.join(root, 'data', 'recovery', 'preseed-research-shortlist');
const expectedAtomCount = 38014;
const expectedAtomFingerprint = '95f5fa3cc66fbe5f60780652c76e6bd949bb6f6ee514b18b1c329b1d10decf02';
const expectedMaturityFingerprint = 'f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7';
const perCapabilityLimit = 10;

function fail(message) {
  console.error('PANTAVION PRESEED RESEARCH SHORTLIST: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function csvEscape(value) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}

for (const file of [atomsPath, mappingsPath, maturityPath]) {
  if (!fs.existsSync(file)) fail('missing exact-parent input: ' + path.relative(root, file));
}
const atomProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const mappingProjection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const maturityProjection = JSON.parse(fs.readFileSync(maturityPath, 'utf8'));
if (!Array.isArray(atomProjection.atoms) || !Array.isArray(mappingProjection.mappings) || !Array.isArray(maturityProjection.reviews)) {
  fail('required input arrays missing');
}
if (atomProjection.atoms.length !== expectedAtomCount) fail('exact atom count drifted');
const actualAtomFingerprint = hash(atomProjection.atoms.map(atom => atom.atomId + ':' + atom.normalizedFingerprint).sort().join('\n'));
if (actualAtomFingerprint !== expectedAtomFingerprint) fail('exact atom fingerprint drifted');
if (maturityProjection.manifest?.maturityQueueFingerprint !== expectedMaturityFingerprint) fail('exact maturity queue fingerprint drifted');

const atoms = new Map(atomProjection.atoms.map(atom => [atom.atomId, atom]));
const reviews = new Map(maturityProjection.reviews.map(review => [review.atomId, review]));
const mappings = new Map(mappingProjection.mappings.map(mapping => [mapping.atomId, mapping]));
if (atoms.size !== expectedAtomCount || reviews.size !== expectedAtomCount || mappings.size !== expectedAtomCount) {
  fail('source identities are incomplete or duplicated');
}
const vocabulary = [...(mappingProjection.manifest?.capabilityVocabulary || [])].sort((a, b) => a.id.localeCompare(b.id));
if (vocabulary.length !== 15) fail('expected 15 capability domains');

function compareCandidate(a, b) {
  return b.evidenceRefCount - a.evidenceRefCount ||
    b.sourceCandidateCount - a.sourceCandidateCount ||
    b.capabilityScore - a.capabilityScore ||
    b.familyCount - a.familyCount ||
    a.atomId.localeCompare(b.atomId);
}

const candidatePools = new Map();
for (const capability of vocabulary) {
  const pool = [];
  for (const mapping of mappingProjection.mappings) {
    const review = reviews.get(mapping.atomId);
    const atom = atoms.get(mapping.atomId);
    const candidate = (mapping.candidateCapabilities || []).find(item => item.capabilityId === capability.id);
    if (!review || !atom || !candidate) continue;
    if (review.reviewPriority !== 'P3_MATURITY_EVIDENCE_REVIEW') continue;
    if (review.sourceTraceStatus !== 'SOURCE_TRACE_PRESENT_UNVERIFIED') continue;
    if (review.overlapSuggestionCount !== 0) continue;
    pool.push({
      atomId: atom.atomId,
      atomFingerprint: atom.normalizedFingerprint,
      atomicMechanism: atom.atomicMechanism,
      families: [...(atom.families || [])].sort(),
      sourceCandidateIds: [...(atom.sourceCandidateIds || [])].sort(),
      evidenceRefs: [...(atom.evidenceRefs || [])].sort(),
      evidenceRefCount: (atom.evidenceRefs || []).length,
      sourceCandidateCount: (atom.sourceCandidateIds || []).length,
      familyCount: (atom.families || []).length,
      capabilityScore: candidate.score,
      matchedTerms: [...(candidate.matchedTerms || [])].sort(),
    });
  }
  pool.sort(compareCandidate);
  if (pool.length < perCapabilityLimit) fail('insufficient safe research candidates for ' + capability.id);
  candidatePools.set(capability.id, pool);
}

const selectedAtomIds = new Set();
const selectionsByCapability = new Map(vocabulary.map(capability => [capability.id, []]));
for (let rank = 1; rank <= perCapabilityLimit; rank += 1) {
  for (const capability of vocabulary) {
    const pool = candidatePools.get(capability.id);
    const candidate = pool.find(item => !selectedAtomIds.has(item.atomId));
    if (!candidate) fail('unable to preserve unique cross-domain selection for ' + capability.id);
    selectedAtomIds.add(candidate.atomId);
    selectionsByCapability.get(capability.id).push(candidate);
  }
}

const shortlist = [];
for (const capability of vocabulary) {
  const selections = selectionsByCapability.get(capability.id);
  for (let index = 0; index < selections.length; index += 1) {
    const candidate = selections[index];
    shortlist.push({
      selectionOrdinal: shortlist.length + 1,
      capabilityId: capability.id,
      capabilityLabel: capability.label,
      rankWithinCapability: index + 1,
      ...candidate,
      internalOverlapSuggestionCount: 0,
      sourceTraceStatus: 'SOURCE_TRACE_PRESENT_UNVERIFIED',
      maturityStatus: 'UNASSESSED',
      noveltyStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
      researchStatus: 'PRIOR_ART_AND_EVIDENCE_REVIEW_REQUIRED',
      selectionBasis: 'Deterministic evidence-density triage within one lexical capability domain; not an innovation, novelty, patentability or maturity finding.',
      humanReviewed: false,
      ownerApproved: false,
      noveltyClaimAllowed: false,
      patentabilityClaimAllowed: false,
      semanticMergeAllowed: false,
      executionAllowed: false,
      authorizationEffect: 'none',
    });
  }
}
const shortlistFingerprint = hash(shortlist.map(item => [
  item.selectionOrdinal,
  item.capabilityId,
  item.rankWithinCapability,
  item.atomId,
  item.atomFingerprint,
  item.evidenceRefs.join('|'),
  item.sourceCandidateIds.join('|'),
  item.capabilityScore,
].join(':')).join('\n'));
const manifest = {
  id: 'pantavion_preseed_research_shortlist_v1',
  lifecycleState: 'CODED',
  sourceAtomFingerprint: expectedAtomFingerprint,
  sourceMaturityQueueFingerprint: expectedMaturityFingerprint,
  shortlistFingerprint,
  method: 'Deterministic balanced triage: ten unique P3 source-traced, zero-internal-overlap atoms per capability domain, ranked by evidence density and bounded lexical capability score.',
  truthRule: 'Selection means research priority only. It is not human adjudication, semantic uniqueness, novelty, patentability, maturity, PRE-SEED inclusion, owner approval or execution authority.',
  totals: {
    sourceAtoms: expectedAtomCount,
    capabilityDomains: vocabulary.length,
    selectedAtoms: shortlist.length,
    uniqueSelectedAtoms: selectedAtomIds.size,
    selectedPerCapability: perCapabilityLimit,
    selectedWithSourceTrace: shortlist.length,
    selectedWithInternalOverlapSuggestions: 0,
    humanReviewed: 0,
    noveltyClaimsAllowed: 0,
    patentabilityClaimsAllowed: 0,
    ownerApproved: 0,
    semanticMergesAllowed: 0,
    executionAuthorized: 0,
    unsupportedNoveltyClaims: 0,
  },
  requiredNextStages: [
    'HUMAN_SOURCE_REVIEW',
    'GLOBAL_PRIOR_ART_SEARCH',
    'CLAIM_CHART_DRAFTING',
    'LEGAL_PATENTABILITY_REVIEW',
    'FOUNDER_PRESEED_SELECTION',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'shortlist.json'), JSON.stringify({ manifest, shortlist }, null, 2) + '\n');
const rows = [['ordinal','capability_id','rank','atom_id','evidence_ref_count','source_candidate_count','capability_score','novelty_status','research_status','atomic_mechanism']];
for (const item of shortlist) rows.push([
  item.selectionOrdinal,
  item.capabilityId,
  item.rankWithinCapability,
  item.atomId,
  item.evidenceRefCount,
  item.sourceCandidateCount,
  item.capabilityScore,
  item.noveltyStatus,
  item.researchStatus,
  item.atomicMechanism,
]);
fs.writeFileSync(path.join(outDir, 'shortlist.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
