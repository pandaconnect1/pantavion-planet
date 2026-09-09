const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const inputPath = path.join(root, 'data', 'recovery', 'innovation-master-register', 'innovation-master-register.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization');

function fail(message) {
  console.error(`PANTAVION INNOVATION SEMANTIC ATOMIZATION: FAIL - ${message}`);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function atomSegments(value) {
  const text = String(value || '').replace(/\r/g, '').trim();
  if (!text) return [];
  const parts = text
    .split(/\n+|\s+[;•·]\s+|(?<=[.!?])\s+(?=[\p{Lu}\p{N}])/u)
    .map(part => part.replace(/^[-*•·\d.)\s]+/u, '').trim())
    .filter(part => normalize(part).length >= 20);
  return parts.length ? parts : [text];
}
function evidenceKey(evidence) {
  return [
    evidence.sourceKind || 'unknown',
    evidence.sourceId || 'unknown',
    evidence.sourceFile || '',
    Number.isInteger(evidence.sourceLine) ? evidence.sourceLine : '',
  ].join(':');
}
function csvEscape(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

if (!fs.existsSync(inputPath)) fail('innovation-master-register.json missing; run innovations:verify first');
const register = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(register.candidates)) fail('input candidates array missing');

const atomsByFingerprint = new Map();
const candidateToAtomIds = {};
let rawSegments = 0;

for (const candidate of [...register.candidates].sort((a, b) => String(a.innovationId).localeCompare(String(b.innovationId)))) {
  if (!candidate.innovationId) fail('source candidate without innovationId');
  const segments = atomSegments(candidate.atomicMechanism);
  if (!segments.length) fail(`source candidate ${candidate.innovationId} has no atomizable mechanism`);
  const atomIds = new Set();

  for (const mechanism of segments) {
    const normalized = normalize(mechanism);
    if (normalized.length < 20) continue;
    rawSegments += 1;
    const fingerprint = hash(normalized);
    const atomId = `pia_${fingerprint.slice(0, 20)}`;
    atomIds.add(atomId);
    if (!atomsByFingerprint.has(fingerprint)) {
      atomsByFingerprint.set(fingerprint, {
        atomId,
        normalizedFingerprint: fingerprint,
        atomicMechanism: mechanism.slice(0, 700),
        families: new Set(),
        sourceCandidateIds: new Set(),
        evidenceRefs: new Set(),
        originStatuses: new Set(),
      });
    }
    const atom = atomsByFingerprint.get(fingerprint);
    for (const family of candidate.families || []) atom.families.add(family);
    atom.sourceCandidateIds.add(candidate.innovationId);
    atom.originStatuses.add(candidate.originStatus || 'UNKNOWN');
    for (const evidence of candidate.evidence || []) atom.evidenceRefs.add(evidenceKey(evidence));
  }

  if (!atomIds.size) fail(`source candidate ${candidate.innovationId} produced no bounded atom`);
  candidateToAtomIds[candidate.innovationId] = [...atomIds].sort();
}

const atoms = [...atomsByFingerprint.values()].map(atom => ({
  atomId: atom.atomId,
  normalizedFingerprint: atom.normalizedFingerprint,
  atomicMechanism: atom.atomicMechanism,
  families: [...atom.families].sort(),
  sourceCandidateIds: [...atom.sourceCandidateIds].sort(),
  evidenceRefs: [...atom.evidenceRefs].sort(),
  originStatuses: [...atom.originStatuses].sort(),
  noveltyStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
  noveltyClaimAllowed: false,
  semanticUniquenessStatus: 'UNASSESSED',
  semanticMergeAllowed: false,
  maturityStatus: 'UNASSESSED',
  capabilityMappingStatus: 'UNASSESSED',
  nextAction: 'Run semantic similarity clustering, human adjudication, capability mapping, maturity evidence review, and global prior-art research.',
})).sort((a, b) => a.atomId.localeCompare(b.atomId));

const sourceCandidateIds = register.candidates.map(c => c.innovationId).sort();
const sourceRegisterFingerprint = hash(
  register.candidates
    .map(c => `${c.innovationId}:${c.normalizedFingerprint || ''}`)
    .sort()
    .join('\n')
);
const atomizationFingerprint = hash(
  atoms.map(atom => `${atom.atomId}:${atom.sourceCandidateIds.join('|')}`).join('\n')
);
const manifest = {
  id: 'pantavion_innovation_semantic_atomization_v1',
  lifecycleState: 'CODED',
  sourceRegisterId: register.manifest?.id || null,
  sourceRegisterFingerprint,
  atomizationFingerprint,
  method: 'Conservative deterministic lexical/mechanism segmentation with exact normalized-text deduplication only.',
  truthRule: 'Atoms are bounded research units, not proven inventions. This stage makes no semantic-equivalence, semantic-uniqueness, novelty, patentability, maturity, deployment, or execution claim.',
  totals: {
    sourceCandidates: sourceCandidateIds.length,
    coveredCandidates: Object.keys(candidateToAtomIds).length,
    rawSegments,
    exactDeduplicatedAtoms: atoms.length,
    unsupportedNoveltyClaims: 0,
    semanticMergesAuthorized: 0,
  },
  requiredNextStages: [
    'SEMANTIC_DEDUPLICATION_WITH_HUMAN_ADJUDICATION',
    'CAPABILITY_MAPPING',
    'MATURITY_EVIDENCE_REVIEW',
    'GLOBAL_PRIOR_ART_RESEARCH',
    'NOVELTY_SCORING',
    'PRESEED_SELECTION',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(
  path.join(outDir, 'semantic-atoms.json'),
  JSON.stringify({ manifest, candidateToAtomIds, atoms }, null, 2) + '\n'
);
const rows = [['atom_id','families','source_candidate_count','evidence_ref_count','novelty_status','semantic_uniqueness_status','atomic_mechanism']];
for (const atom of atoms) rows.push([
  atom.atomId,
  atom.families.join('|'),
  atom.sourceCandidateIds.length,
  atom.evidenceRefs.length,
  atom.noveltyStatus,
  atom.semanticUniquenessStatus,
  atom.atomicMechanism,
]);
fs.writeFileSync(
  path.join(outDir, 'semantic-atoms.csv'),
  rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n'
);
console.log(JSON.stringify(manifest, null, 2));
