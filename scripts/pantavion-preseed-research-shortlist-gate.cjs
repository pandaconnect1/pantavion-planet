const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const mappingsPath = path.join(root, 'data', 'recovery', 'innovation-capability-mapping', 'capability-mappings.json');
const maturityPath = path.join(root, 'data', 'recovery', 'innovation-maturity-evidence-review', 'maturity-review-queue.json');
const dir = path.join(root, 'data', 'recovery', 'preseed-research-shortlist');
const manifestPath = path.join(dir, 'manifest.json');
const shortlistPath = path.join(dir, 'shortlist.json');
const csvPath = path.join(dir, 'shortlist.csv');
const expectedAtomCount = 38014;
const expectedCapabilityCount = 15;
const expectedPerCapability = 10;
const expectedSelectionCount = 150;
const expectedAtomFingerprint = '95f5fa3cc66fbe5f60780652c76e6bd949bb6f6ee514b18b1c329b1d10decf02';
const expectedMaturityFingerprint = 'f9149725957a173c9dc02c16858503c766744165ddb6f9ebc92191f7182afcb7';

function fail(message) {
  console.error('PANTAVION PRESEED RESEARCH SHORTLIST GATE: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
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
function compareCandidate(a, b) {
  return b.evidenceRefCount - a.evidenceRefCount ||
    b.sourceCandidateCount - a.sourceCandidateCount ||
    b.capabilityScore - a.capabilityScore ||
    b.familyCount - a.familyCount ||
    a.atomId.localeCompare(b.atomId);
}
function candidateShape(atom, candidate) {
  return {
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
  };
}

for (const file of [atomsPath, mappingsPath, maturityPath, manifestPath, shortlistPath, csvPath]) {
  if (!fs.existsSync(file)) fail('required artifact missing: ' + path.relative(root, file));
}
const atomProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const mappingProjection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const maturityProjection = JSON.parse(fs.readFileSync(maturityPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(shortlistPath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');

if (!Array.isArray(atomProjection.atoms) || !Array.isArray(mappingProjection.mappings) || !Array.isArray(maturityProjection.reviews) || !Array.isArray(projection.shortlist)) fail('required arrays missing');
if (manifest.id !== 'pantavion_preseed_research_shortlist_v1') fail('unexpected manifest id');
if (JSON.stringify(projection.manifest) !== JSON.stringify(manifest)) fail('embedded manifest mismatch');
const actualAtomFingerprint = hash(atomProjection.atoms.map(atom => atom.atomId + ':' + atom.normalizedFingerprint).sort().join('\n'));
if (atomProjection.atoms.length !== expectedAtomCount || actualAtomFingerprint !== expectedAtomFingerprint) fail('exact atom parent drifted');
if (maturityProjection.reviews.length !== expectedAtomCount || maturityProjection.manifest?.maturityQueueFingerprint !== expectedMaturityFingerprint) fail('exact maturity parent drifted');
if (manifest.sourceAtomFingerprint !== expectedAtomFingerprint || manifest.sourceMaturityQueueFingerprint !== expectedMaturityFingerprint) fail('manifest parent binding mismatch');

const atoms = new Map(atomProjection.atoms.map(atom => [atom.atomId, atom]));
const reviews = new Map(maturityProjection.reviews.map(review => [review.atomId, review]));
const mappings = new Map(mappingProjection.mappings.map(mapping => [mapping.atomId, mapping]));
if (atoms.size !== expectedAtomCount || reviews.size !== expectedAtomCount || mappings.size !== expectedAtomCount) fail('source identities incomplete or duplicated');
const vocabulary = [...(mappingProjection.manifest?.capabilityVocabulary || [])].sort((a, b) => a.id.localeCompare(b.id));
if (vocabulary.length !== expectedCapabilityCount) fail('capability vocabulary drifted');

const pools = new Map();
for (const capability of vocabulary) {
  const pool = [];
  for (const mapping of mappingProjection.mappings) {
    const review = reviews.get(mapping.atomId);
    const atom = atoms.get(mapping.atomId);
    const candidate = (mapping.candidateCapabilities || []).find(item => item.capabilityId === capability.id);
    if (!review || !atom || !candidate) continue;
    if (review.reviewPriority !== 'P3_MATURITY_EVIDENCE_REVIEW') continue;
    if (review.sourceTraceStatus !== 'SOURCE_TRACE_PRESENT_UNVERIFIED' || review.overlapSuggestionCount !== 0) continue;
    pool.push(candidateShape(atom, candidate));
  }
  pool.sort(compareCandidate);
  pools.set(capability.id, pool);
}

const expected = [];
const selected = new Set();
const perCapability = new Map(vocabulary.map(capability => [capability.id, []]));
for (let rank = 1; rank <= expectedPerCapability; rank += 1) {
  for (const capability of vocabulary) {
    const candidate = pools.get(capability.id).find(item => !selected.has(item.atomId));
    if (!candidate) fail('independent selection could not fill ' + capability.id);
    selected.add(candidate.atomId);
    perCapability.get(capability.id).push(candidate);
  }
}
for (const capability of vocabulary) {
  const candidates = perCapability.get(capability.id);
  for (let index = 0; index < candidates.length; index += 1) {
    expected.push({ capability, rank: index + 1, candidate: candidates[index] });
  }
}
if (projection.shortlist.length !== expectedSelectionCount) fail('shortlist count mismatch');
const seen = new Set();
for (let index = 0; index < projection.shortlist.length; index += 1) {
  const item = projection.shortlist[index];
  const wanted = expected[index];
  if (item.selectionOrdinal !== index + 1) fail('selection ordinal mismatch');
  if (item.capabilityId !== wanted.capability.id || item.capabilityLabel !== wanted.capability.label || item.rankWithinCapability !== wanted.rank) fail('balanced capability order mismatch');
  for (const [key, value] of Object.entries(wanted.candidate)) {
    if (JSON.stringify(item[key]) !== JSON.stringify(value)) fail('candidate evidence mismatch: ' + key + ' for ' + item.atomId);
  }
  if (seen.has(item.atomId)) fail('duplicate shortlisted atom: ' + item.atomId);
  seen.add(item.atomId);
  if (item.internalOverlapSuggestionCount !== 0 || item.sourceTraceStatus !== 'SOURCE_TRACE_PRESENT_UNVERIFIED') fail('unsafe research candidate: ' + item.atomId);
  if (item.maturityStatus !== 'UNASSESSED' || item.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED' || item.researchStatus !== 'PRIOR_ART_AND_EVIDENCE_REVIEW_REQUIRED') fail('unsupported truth state: ' + item.atomId);
  for (const field of ['humanReviewed','ownerApproved','noveltyClaimAllowed','patentabilityClaimAllowed','semanticMergeAllowed','executionAllowed']) {
    if (item[field] !== false) fail('unauthorized shortlist state: ' + field + ' for ' + item.atomId);
  }
  if (item.authorizationEffect !== 'none') fail('authorization effect must remain none: ' + item.atomId);
}
if (seen.size !== expectedSelectionCount) fail('shortlist identities are not unique');
const expectedFingerprint = hash(projection.shortlist.map(item => [
  item.selectionOrdinal,
  item.capabilityId,
  item.rankWithinCapability,
  item.atomId,
  item.atomFingerprint,
  item.evidenceRefs.join('|'),
  item.sourceCandidateIds.join('|'),
  item.capabilityScore,
].join(':')).join('\n'));
if (manifest.shortlistFingerprint !== expectedFingerprint) fail('shortlist fingerprint mismatch');
if (csvRecordCount(csv) !== expectedSelectionCount + 1) fail('CSV logical record count mismatch');
const totals = manifest.totals || {};
if (totals.sourceAtoms !== expectedAtomCount || totals.capabilityDomains !== expectedCapabilityCount || totals.selectedAtoms !== expectedSelectionCount || totals.uniqueSelectedAtoms !== expectedSelectionCount || totals.selectedPerCapability !== expectedPerCapability) fail('coverage totals mismatch');
for (const field of ['selectedWithInternalOverlapSuggestions','humanReviewed','noveltyClaimsAllowed','patentabilityClaimsAllowed','ownerApproved','semanticMergesAllowed','executionAuthorized','unsupportedNoveltyClaims']) {
  if (totals[field] !== 0) fail('non-zero forbidden total: ' + field);
}

console.log(JSON.stringify({
  gate: 'PANTAVION PRESEED RESEARCH SHORTLIST',
  result: 'PASS',
  sourceAtoms: expectedAtomCount,
  capabilityDomains: expectedCapabilityCount,
  selectedAtoms: projection.shortlist.length,
  uniqueSelectedAtoms: seen.size,
  selectedPerCapability: expectedPerCapability,
  selectedWithSourceTrace: projection.shortlist.length,
  selectedWithInternalOverlapSuggestions: 0,
  humanReviewed: 0,
  noveltyClaimsAllowed: 0,
  patentabilityClaimsAllowed: 0,
  ownerApproved: 0,
  semanticMergesAllowed: 0,
  executionAuthorized: 0,
  unsupportedNoveltyClaims: 0,
  shortlistFingerprint: manifest.shortlistFingerprint,
}, null, 2));
