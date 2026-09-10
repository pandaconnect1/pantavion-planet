const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const inputPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-capability-mapping');
const manifestPath = path.join(dir, 'manifest.json');
const mappingsPath = path.join(dir, 'capability-mappings.json');
const csvPath = path.join(dir, 'capability-mappings.csv');

function fail(message) {
  console.error(`PANTAVION INNOVATION CAPABILITY MAPPING GATE: FAIL - ${message}`);
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

for (const file of [inputPath, manifestPath, mappingsPath, csvPath]) {
  if (!fs.existsSync(file)) fail(`required artifact missing: ${path.relative(root, file)}`);
}
const atomsProjection = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');

if (manifest.id !== 'pantavion_innovation_capability_mapping_v1') fail('unexpected manifest id');
if (!Array.isArray(atomsProjection.atoms)) fail('source atoms array missing');
if (!Array.isArray(projection.mappings)) fail('mappings array missing');
if (JSON.stringify(projection.manifest) !== JSON.stringify(manifest)) fail('embedded manifest differs from manifest.json');
if (projection.mappings.length !== atomsProjection.atoms.length) fail('source atom coverage count mismatch');

const vocabulary = new Set((manifest.capabilityVocabulary || []).map(capability => capability.id));
if (!vocabulary.size) fail('capability vocabulary is empty');
const sourceAtoms = new Map(atomsProjection.atoms.map(atom => [atom.atomId, atom]));
if (sourceAtoms.size !== atomsProjection.atoms.length) fail('source atom IDs are not unique');

const seen = new Set();
let mappedCandidateAtoms = 0;
let unmappedAtoms = 0;
let humanApprovedMappings = 0;
let executionAuthorizedMappings = 0;
let unsupportedNoveltyClaims = 0;

for (const mapping of projection.mappings) {
  if (seen.has(mapping.atomId)) fail(`duplicate mapping: ${mapping.atomId}`);
  seen.add(mapping.atomId);
  const source = sourceAtoms.get(mapping.atomId);
  if (!source) fail(`mapping references unknown atom: ${mapping.atomId}`);
  if (mapping.atomFingerprint !== source.normalizedFingerprint) fail(`source fingerprint mismatch: ${mapping.atomId}`);
  if (JSON.stringify(mapping.sourceCandidateIds) !== JSON.stringify([...(source.sourceCandidateIds || [])].sort())) fail(`source provenance mismatch: ${mapping.atomId}`);
  if (!Array.isArray(mapping.candidateCapabilities) || mapping.candidateCapabilities.length > 5) fail(`invalid bounded candidate list: ${mapping.atomId}`);

  if (mapping.candidateCapabilities.length) {
    mappedCandidateAtoms += 1;
    if (mapping.mappingStatus !== 'CANDIDATE_ONLY_REVIEW_REQUIRED') fail(`mapped atom has invalid review status: ${mapping.atomId}`);
  } else {
    unmappedAtoms += 1;
    if (mapping.mappingStatus !== 'UNMAPPED_REVIEW_REQUIRED') fail(`unmapped atom has invalid review status: ${mapping.atomId}`);
  }

  let previous = Infinity;
  const localIds = new Set();
  for (const candidate of mapping.candidateCapabilities) {
    if (!vocabulary.has(candidate.capabilityId)) fail(`unknown capability: ${candidate.capabilityId}`);
    if (localIds.has(candidate.capabilityId)) fail(`duplicate capability candidate: ${mapping.atomId}`);
    localIds.add(candidate.capabilityId);
    if (!Number.isInteger(candidate.score) || candidate.score <= 0 || candidate.score > previous) fail(`invalid candidate score ordering: ${mapping.atomId}`);
    if (!Array.isArray(candidate.matchedTerms) || candidate.matchedTerms.length === 0) fail(`candidate lacks matched terms: ${mapping.atomId}`);
    previous = candidate.score;
  }

  if (mapping.humanApproved !== false) humanApprovedMappings += 1;
  if (mapping.executionAllowed !== false || mapping.authorizationEffect !== 'none') executionAuthorizedMappings += 1;
  if (mapping.noveltyClaimAllowed !== false || mapping.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED') unsupportedNoveltyClaims += 1;
}
for (const atomId of sourceAtoms.keys()) if (!seen.has(atomId)) fail(`source atom is uncovered: ${atomId}`);

const expectedSourceFingerprint = hash(
  atomsProjection.atoms.map(atom => `${atom.atomId}:${atom.normalizedFingerprint}`).sort().join('\n')
);
const expectedMappingFingerprint = hash(
  projection.mappings.map(mapping => `${mapping.atomId}:${mapping.candidateCapabilities.map(c => `${c.capabilityId}=${c.score}`).join('|')}`).join('\n')
);
if (manifest.sourceAtomFingerprint !== expectedSourceFingerprint) fail('source atom fingerprint mismatch');
if (manifest.mappingFingerprint !== expectedMappingFingerprint) fail('mapping fingerprint mismatch');
if (manifest.totals?.sourceAtoms !== sourceAtoms.size || manifest.totals?.totalMappings !== seen.size) fail('manifest coverage totals mismatch');
if (manifest.totals?.mappedCandidateAtoms !== mappedCandidateAtoms || manifest.totals?.unmappedAtoms !== unmappedAtoms) fail('manifest mapping totals mismatch');
if (humanApprovedMappings || manifest.totals?.humanApprovedMappings !== 0) fail('human approval was claimed without adjudication');
if (executionAuthorizedMappings || manifest.totals?.executionAuthorizedMappings !== 0) fail('execution authority was granted');
if (unsupportedNoveltyClaims || manifest.totals?.unsupportedNoveltyClaims !== 0) fail('unsupported novelty claim detected');
if (csvRecordCount(csv) !== projection.mappings.length + 1) fail('CSV logical record count mismatch');

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION CAPABILITY MAPPING',
  result: 'PASS',
  sourceAtoms: sourceAtoms.size,
  totalMappings: seen.size,
  mappedCandidateAtoms,
  unmappedAtoms,
  humanApprovedMappings,
  executionAuthorizedMappings,
  unsupportedNoveltyClaims,
  mappingFingerprint: manifest.mappingFingerprint,
}, null, 2));
