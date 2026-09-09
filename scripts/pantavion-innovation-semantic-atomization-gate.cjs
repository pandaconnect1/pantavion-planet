const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const inputPath = path.join(root, 'data', 'recovery', 'innovation-master-register', 'innovation-master-register.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization');
const manifestPath = path.join(dir, 'manifest.json');
const atomsPath = path.join(dir, 'semantic-atoms.json');
const csvPath = path.join(dir, 'semantic-atoms.csv');

function fail(message) {
  console.error(`PANTAVION INNOVATION SEMANTIC ATOMIZATION GATE: FAIL - ${message}`);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function csvRecordCount(value) {
  let quoted = false;
  let records = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '"') {
      if (quoted && value[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (value[i] === '\n' && !quoted) {
      records += 1;
    }
  }
  if (quoted) fail('CSV contains an unterminated quoted field');
  return records;
}

for (const file of [inputPath, manifestPath, atomsPath, csvPath]) {
  if (!fs.existsSync(file)) fail(`required artifact missing: ${path.relative(root, file)}`);
}
const register = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');

if (manifest.id !== 'pantavion_innovation_semantic_atomization_v1') fail('unexpected manifest id');
if (!Array.isArray(register.candidates)) fail('source candidates array missing');
if (!Array.isArray(projection.atoms)) fail('atoms array missing');
if (!projection.candidateToAtomIds || typeof projection.candidateToAtomIds !== 'object') fail('candidate coverage map missing');
if (JSON.stringify(projection.manifest) !== JSON.stringify(manifest)) fail('embedded manifest differs from manifest.json');

const sourceIds = new Set(register.candidates.map(candidate => candidate.innovationId));
if (sourceIds.size !== register.candidates.length) fail('source candidate IDs are not unique');
const mappedIds = Object.keys(projection.candidateToAtomIds);
if (mappedIds.length !== sourceIds.size) fail('candidate coverage count mismatch');
for (const id of sourceIds) {
  const mapped = projection.candidateToAtomIds[id];
  if (!Array.isArray(mapped) || mapped.length === 0) fail(`source candidate is uncovered: ${id}`);
}
for (const id of mappedIds) if (!sourceIds.has(id)) fail(`coverage map contains unknown source candidate: ${id}`);

const atomIds = new Set();
const fingerprints = new Set();
const coveredByAtoms = new Set();
let unsupportedNoveltyClaims = 0;
let unauthorizedSemanticMerges = 0;
for (const atom of projection.atoms) {
  const normalized = normalize(atom.atomicMechanism);
  const expectedFingerprint = hash(normalized);
  const expectedId = `pia_${expectedFingerprint.slice(0, 20)}`;
  if (normalized.length < 20) fail(`atom mechanism is empty or undersized: ${atom.atomId || 'unknown'}`);
  if (atom.normalizedFingerprint !== expectedFingerprint) fail(`fingerprint mismatch: ${atom.atomId}`);
  if (atom.atomId !== expectedId) fail(`atom ID mismatch: ${atom.atomId}`);
  if (atomIds.has(atom.atomId)) fail(`duplicate atom ID: ${atom.atomId}`);
  if (fingerprints.has(atom.normalizedFingerprint)) fail(`duplicate normalized fingerprint: ${atom.normalizedFingerprint}`);
  atomIds.add(atom.atomId);
  fingerprints.add(atom.normalizedFingerprint);
  if (!Array.isArray(atom.sourceCandidateIds) || atom.sourceCandidateIds.length === 0) fail(`atom lacks source candidates: ${atom.atomId}`);
  if (!Array.isArray(atom.evidenceRefs) || atom.evidenceRefs.length === 0) fail(`atom lacks evidence references: ${atom.atomId}`);
  for (const candidateId of atom.sourceCandidateIds) {
    if (!sourceIds.has(candidateId)) fail(`atom references unknown source candidate: ${candidateId}`);
    if (!projection.candidateToAtomIds[candidateId]?.includes(atom.atomId)) fail(`reverse coverage mismatch for ${candidateId}`);
    coveredByAtoms.add(candidateId);
  }
  if (atom.noveltyClaimAllowed !== false || atom.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED') unsupportedNoveltyClaims += 1;
  if (atom.semanticMergeAllowed !== false || atom.semanticUniquenessStatus !== 'UNASSESSED') unauthorizedSemanticMerges += 1;
  if (atom.maturityStatus !== 'UNASSESSED' || atom.capabilityMappingStatus !== 'UNASSESSED') fail(`premature downstream classification: ${atom.atomId}`);
}
if (coveredByAtoms.size !== sourceIds.size) fail('atom records do not cover every source candidate');
if (unsupportedNoveltyClaims) fail(`${unsupportedNoveltyClaims} atoms make unsupported novelty claims`);
if (unauthorizedSemanticMerges) fail(`${unauthorizedSemanticMerges} atoms authorize or imply semantic merging`);

for (const [candidateId, mappedAtomIds] of Object.entries(projection.candidateToAtomIds)) {
  if (new Set(mappedAtomIds).size !== mappedAtomIds.length) fail(`duplicate atom mapping for ${candidateId}`);
  for (const atomId of mappedAtomIds) if (!atomIds.has(atomId)) fail(`coverage map references unknown atom: ${atomId}`);
}
if (manifest.totals?.sourceCandidates !== sourceIds.size) fail('manifest source candidate count mismatch');
if (manifest.totals?.coveredCandidates !== sourceIds.size) fail('manifest covered candidate count mismatch');
if (manifest.totals?.exactDeduplicatedAtoms !== projection.atoms.length) fail('manifest atom count mismatch');
if (manifest.totals?.unsupportedNoveltyClaims !== 0) fail('manifest novelty truth boundary mismatch');
if (manifest.totals?.semanticMergesAuthorized !== 0) fail('manifest semantic merge truth boundary mismatch');
if (csvRecordCount(csv) !== projection.atoms.length + 1) fail('CSV logical record count mismatch');

const expectedSourceFingerprint = hash(
  register.candidates.map(candidate => `${candidate.innovationId}:${candidate.normalizedFingerprint || ''}`).sort().join('\n')
);
const expectedAtomizationFingerprint = hash(
  projection.atoms.map(atom => `${atom.atomId}:${atom.sourceCandidateIds.join('|')}`).join('\n')
);
if (manifest.sourceRegisterFingerprint !== expectedSourceFingerprint) fail('source register fingerprint mismatch');
if (manifest.atomizationFingerprint !== expectedAtomizationFingerprint) fail('atomization fingerprint mismatch');

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION SEMANTIC ATOMIZATION',
  result: 'PASS',
  sourceCandidates: sourceIds.size,
  coveredCandidates: coveredByAtoms.size,
  exactDeduplicatedAtoms: projection.atoms.length,
  unsupportedNoveltyClaims,
  unauthorizedSemanticMerges,
  atomizationFingerprint: manifest.atomizationFingerprint,
}, null, 2));
