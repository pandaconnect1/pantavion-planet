const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const dir = path.join(root, 'data', 'recovery', 'innovation-semantic-overlap-review');
const manifestPath = path.join(dir, 'manifest.json');
const queuePath = path.join(dir, 'review-queue.json');
const csvPath = path.join(dir, 'review-queue.csv');

function fail(message) {
  console.error(`PANTAVION INNOVATION SEMANTIC OVERLAP GATE: FAIL - ${message}`);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
const stopwords = new Set([
  'that','this','with','from','into','then','than','when','where','which','would','should','could','will','shall',
  'have','has','had','are','was','were','been','being','for','and','the','not','all','any','each','per','via',
  'και','των','την','της','στο','στη','στις','στα','που','για','από','ένα','μια','είναι','θα','να','με','σε',
]);
function tokenSet(value) {
  return new Set(normalize(value).split(' ').filter(token => token.length >= 3 && !stopwords.has(token)));
}
function jaccardPpm(left, right) {
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  const union = left.size + right.size - intersection;
  return { intersection, ppm: union ? Math.round(intersection * 1000000 / union) : 0 };
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

for (const file of [atomsPath, manifestPath, queuePath, csvPath]) {
  if (!fs.existsSync(file)) fail(`required artifact missing: ${path.relative(root, file)}`);
}
const atomsProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');

if (manifest.id !== 'pantavion_innovation_semantic_overlap_review_v1') fail('unexpected manifest id');
if (!Array.isArray(atomsProjection.atoms) || !Array.isArray(queue.pairs)) fail('required arrays missing');
if (JSON.stringify(queue.manifest) !== JSON.stringify(manifest)) fail('embedded manifest differs from manifest.json');

const atoms = new Map(atomsProjection.atoms.map(atom => [atom.atomId, atom]));
if (atoms.size !== atomsProjection.atoms.length) fail('source atom IDs are not unique');
const pairIds = new Set();
const atomsWithSuggestions = new Set();
let humanAdjudicatedPairs = 0;
let semanticMergesAuthorized = 0;
let unsupportedNoveltyClaims = 0;

for (const pair of queue.pairs) {
  if (pairIds.has(pair.pairId)) fail(`duplicate pair ID: ${pair.pairId}`);
  pairIds.add(pair.pairId);
  if (!atoms.has(pair.leftAtomId) || !atoms.has(pair.rightAtomId)) fail(`pair references unknown source atom: ${pair.pairId}`);
  if (pair.leftAtomId >= pair.rightAtomId) fail(`pair ordering is not canonical: ${pair.pairId}`);
  const expectedId = `pis_${hash(`${pair.leftAtomId}|${pair.rightAtomId}`).slice(0, 20)}`;
  if (pair.pairId !== expectedId) fail(`pair ID mismatch: ${pair.pairId}`);
  const similarity = jaccardPpm(tokenSet(atoms.get(pair.leftAtomId).atomicMechanism), tokenSet(atoms.get(pair.rightAtomId).atomicMechanism));
  if (pair.lexicalJaccardPpm !== similarity.ppm || pair.sharedTokenCount !== similarity.intersection) fail(`similarity evidence mismatch: ${pair.pairId}`);
  if (similarity.ppm < manifest.method.thresholdPpm || similarity.intersection < manifest.method.minimumSharedTokens) fail(`pair is below review threshold: ${pair.pairId}`);
  if (pair.decision !== 'POSSIBLE_SEMANTIC_OVERLAP_REVIEW_REQUIRED') fail(`invalid pair decision: ${pair.pairId}`);
  if (pair.sourceAtomsPreserved !== true) fail(`source preservation not asserted: ${pair.pairId}`);
  if (pair.humanAdjudicated !== false || pair.semanticEquivalent !== null) humanAdjudicatedPairs += 1;
  if (pair.semanticMergeAllowed !== false) semanticMergesAuthorized += 1;
  if (pair.noveltyClaimAllowed !== false || pair.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED') unsupportedNoveltyClaims += 1;
  atomsWithSuggestions.add(pair.leftAtomId);
  atomsWithSuggestions.add(pair.rightAtomId);
}

const expectedSourceFingerprint = hash(
  atomsProjection.atoms.map(atom => `${atom.atomId}:${atom.normalizedFingerprint}`).sort().join('\n')
);
const expectedQueueFingerprint = hash(
  queue.pairs.map(pair => `${pair.pairId}:${pair.lexicalJaccardPpm}:${pair.sharedTokenCount}`).join('\n')
);
if (manifest.sourceAtomFingerprint !== expectedSourceFingerprint) fail('source atom fingerprint mismatch');
if (manifest.reviewQueueFingerprint !== expectedQueueFingerprint) fail('review queue fingerprint mismatch');
if (manifest.totals?.sourceAtoms !== atoms.size || manifest.totals?.sourceAtomsPreserved !== atoms.size) fail('source atom preservation totals mismatch');
if (manifest.totals?.oversizedBucketsSkipped !== 0) fail('an oversized candidate bucket was skipped');
if ((manifest.totals?.oversizedBucketsPartitioned || 0) > 0 && (manifest.totals?.boundedPartitionsCreated || 0) === 0) fail('oversized buckets were not materialized into bounded partitions');
if (manifest.totals?.reviewPairs !== pairIds.size || manifest.totals?.atomsWithSuggestions !== atomsWithSuggestions.size) fail('review queue totals mismatch');
if (manifest.totals?.atomsWithoutSuggestionsPreserved !== atoms.size - atomsWithSuggestions.size) fail('unpaired atom preservation mismatch');
if (humanAdjudicatedPairs || manifest.totals?.humanAdjudicatedPairs !== 0) fail('human adjudication claimed without review');
if (semanticMergesAuthorized || manifest.totals?.semanticMergesAuthorized !== 0) fail('semantic merge was authorized');
if (unsupportedNoveltyClaims || manifest.totals?.unsupportedNoveltyClaims !== 0) fail('unsupported novelty claim detected');
if (csvRecordCount(csv) !== queue.pairs.length + 1) fail('CSV logical record count mismatch');

console.log(JSON.stringify({
  gate: 'PANTAVION INNOVATION SEMANTIC OVERLAP REVIEW',
  result: 'PASS',
  sourceAtoms: atoms.size,
  sourceAtomsPreserved: atoms.size,
  reviewPairs: pairIds.size,
  atomsWithSuggestions: atomsWithSuggestions.size,
  atomsWithoutSuggestionsPreserved: atoms.size - atomsWithSuggestions.size,
  oversizedBucketsPartitioned: manifest.totals.oversizedBucketsPartitioned,
  boundedPartitionsCreated: manifest.totals.boundedPartitionsCreated,
  oversizedBucketsSkipped: manifest.totals.oversizedBucketsSkipped,
  humanAdjudicatedPairs,
  semanticMergesAuthorized,
  unsupportedNoveltyClaims,
  reviewQueueFingerprint: manifest.reviewQueueFingerprint,
}, null, 2));
