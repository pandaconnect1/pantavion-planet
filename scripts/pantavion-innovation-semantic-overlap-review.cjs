const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const atomsPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const mappingsPath = path.join(root, 'data', 'recovery', 'innovation-capability-mapping', 'capability-mappings.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-semantic-overlap-review');
const thresholdPpm = 650000;
const maxBucketSize = 128;
const signatureWidth = 6;

function fail(message) {
  console.error(`PANTAVION INNOVATION SEMANTIC OVERLAP: FAIL - ${message}`);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function csvEscape(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

const stopwords = new Set([
  'that','this','with','from','into','then','than','when','where','which','would','should','could','will','shall',
  'have','has','had','are','was','were','been','being','for','and','the','not','all','any','each','per','via',
  'και','των','την','της','στο','στη','στις','στα','που','για','από','ένα','μια','είναι','θα','να','με','σε',
]);
function tokens(value) {
  return normalize(value).split(' ').filter(token => token.length >= 3 && !stopwords.has(token));
}
function shingles(value) {
  const t = tokens(value);
  const values = [];
  if (t.length < 2) return t;
  for (let i = 0; i < t.length - 1; i += 1) values.push(`${t[i]} ${t[i + 1]}`);
  return values;
}
function jaccardPpm(left, right) {
  let intersection = 0;
  for (const token of left) if (right.has(token)) intersection += 1;
  const union = left.size + right.size - intersection;
  return { intersection, ppm: union ? Math.round(intersection * 1000000 / union) : 0 };
}

for (const file of [atomsPath, mappingsPath]) if (!fs.existsSync(file)) fail(`missing input: ${path.relative(root, file)}`);
const atomsProjection = JSON.parse(fs.readFileSync(atomsPath, 'utf8'));
const mappingProjection = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));
if (!Array.isArray(atomsProjection.atoms) || !Array.isArray(mappingProjection.mappings)) fail('input arrays missing');

const mappingByAtom = new Map(mappingProjection.mappings.map(mapping => [mapping.atomId, mapping]));
const atomById = new Map();
const tokenSets = new Map();
const buckets = new Map();

for (const atom of [...atomsProjection.atoms].sort((a, b) => a.atomId.localeCompare(b.atomId))) {
  const mapping = mappingByAtom.get(atom.atomId);
  if (!mapping) fail(`capability mapping missing for ${atom.atomId}`);
  atomById.set(atom.atomId, atom);
  tokenSets.set(atom.atomId, new Set(tokens(atom.atomicMechanism)));
  const primaryCapability = mapping.candidateCapabilities?.[0]?.capabilityId || 'UNMAPPED';
  const signature = [...new Set(shingles(atom.atomicMechanism).map(value => hash(value)))].sort().slice(0, signatureWidth);
  for (const sig of signature) {
    const key = `${primaryCapability}:${sig}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(atom.atomId);
  }
}

const candidatePairs = new Set();
let oversizedBucketsSkipped = 0;
for (const ids of buckets.values()) {
  const unique = [...new Set(ids)].sort();
  if (unique.length > maxBucketSize) {
    oversizedBucketsSkipped += 1;
    continue;
  }
  for (let i = 0; i < unique.length; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) candidatePairs.add(`${unique[i]}|${unique[j]}`);
  }
}

const pairs = [];
const atomsWithSuggestions = new Set();
for (const key of [...candidatePairs].sort()) {
  const [leftAtomId, rightAtomId] = key.split('|');
  const similarity = jaccardPpm(tokenSets.get(leftAtomId), tokenSets.get(rightAtomId));
  if (similarity.intersection < 3 || similarity.ppm < thresholdPpm) continue;
  const pairId = `pis_${hash(key).slice(0, 20)}`;
  atomsWithSuggestions.add(leftAtomId);
  atomsWithSuggestions.add(rightAtomId);
  pairs.push({
    pairId,
    leftAtomId,
    rightAtomId,
    lexicalJaccardPpm: similarity.ppm,
    sharedTokenCount: similarity.intersection,
    decision: 'POSSIBLE_SEMANTIC_OVERLAP_REVIEW_REQUIRED',
    humanAdjudicated: false,
    semanticEquivalent: null,
    semanticMergeAllowed: false,
    sourceAtomsPreserved: true,
    noveltyStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
    noveltyClaimAllowed: false,
    nextAction: 'Human reviewer must compare mechanism, scope, constraints and provenance before any semantic-equivalence decision.',
  });
}
pairs.sort((a, b) => a.pairId.localeCompare(b.pairId));

const sourceAtomFingerprint = hash(
  atomsProjection.atoms.map(atom => `${atom.atomId}:${atom.normalizedFingerprint}`).sort().join('\n')
);
const reviewQueueFingerprint = hash(
  pairs.map(pair => `${pair.pairId}:${pair.lexicalJaccardPpm}:${pair.sharedTokenCount}`).join('\n')
);
const manifest = {
  id: 'pantavion_innovation_semantic_overlap_review_v1',
  lifecycleState: 'CODED',
  sourceAtomizationId: atomsProjection.manifest?.id || null,
  sourceCapabilityMappingId: mappingProjection.manifest?.id || null,
  sourceAtomFingerprint,
  reviewQueueFingerprint,
  method: {
    description: 'Deterministic capability-bounded minhash-style candidate generation followed by exact token-set Jaccard scoring.',
    signatureWidth,
    maxBucketSize,
    thresholdPpm,
    minimumSharedTokens: 3,
  },
  truthRule: 'Pairs are review suggestions only. Similarity is lexical evidence, not semantic equivalence. No atom is removed or merged and no uniqueness, novelty, patentability, maturity, deployment, or execution claim is made.',
  totals: {
    sourceAtoms: atomsProjection.atoms.length,
    sourceAtomsPreserved: atomsProjection.atoms.length,
    candidatePairsEvaluated: candidatePairs.size,
    reviewPairs: pairs.length,
    atomsWithSuggestions: atomsWithSuggestions.size,
    atomsWithoutSuggestionsPreserved: atomsProjection.atoms.length - atomsWithSuggestions.size,
    oversizedBucketsSkipped,
    humanAdjudicatedPairs: 0,
    semanticMergesAuthorized: 0,
    unsupportedNoveltyClaims: 0,
  },
  requiredNextStages: [
    'HUMAN_SEMANTIC_ADJUDICATION',
    'MATURITY_EVIDENCE_REVIEW',
    'GLOBAL_PRIOR_ART_RESEARCH',
    'NOVELTY_SCORING',
    'PRESEED_SELECTION',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'review-queue.json'), JSON.stringify({ manifest, pairs }, null, 2) + '\n');
const rows = [['pair_id','left_atom_id','right_atom_id','lexical_jaccard_ppm','shared_token_count','decision','human_adjudicated','semantic_merge_allowed']];
for (const pair of pairs) rows.push([pair.pairId,pair.leftAtomId,pair.rightAtomId,pair.lexicalJaccardPpm,pair.sharedTokenCount,pair.decision,pair.humanAdjudicated,pair.semanticMergeAllowed]);
fs.writeFileSync(path.join(outDir, 'review-queue.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
