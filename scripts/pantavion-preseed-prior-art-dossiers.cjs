const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'preseed-research-shortlist', 'shortlist.json');
const outDir = path.join(root, 'data', 'recovery', 'preseed-prior-art-dossiers');
const expectedShortlistFingerprint = '784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6';
const expectedCount = 150;
const queryFamilies = ['PATENT','SCHOLARLY','STANDARDS','IMPLEMENTATION','RISK'];

function fail(message) {
  console.error('PANTAVION PRESEED PRIOR ART DOSSIERS: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function clean(value, limit = 180) {
  return String(value || '').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);
}
function csvEscape(value) {
  return '"' + String(value ?? '').replace(/"/g, '""') + '"';
}
function buildQueries(item) {
  const mechanism = clean(item.atomicMechanism);
  const capability = clean(item.capabilityLabel, 80);
  if (!mechanism || !capability) fail('empty query source for ' + item.atomId);
  const quoted = '"' + mechanism + '"';
  return [
    { family:'PATENT', query:quoted + ' patent prior art ' + capability, sources:['EPO_ESPACENET','WIPO_PATENTSCOPE','GOOGLE_PATENTS'] },
    { family:'SCHOLARLY', query:quoted + ' research paper ' + capability, sources:['OPENALEX','CROSSREF','SEMANTIC_SCHOLAR'] },
    { family:'STANDARDS', query:quoted + ' standard specification protocol ' + capability, sources:['ISO','IEC','IETF'] },
    { family:'IMPLEMENTATION', query:quoted + ' product platform system implementation ' + capability, sources:['PRODUCT_DOCUMENTATION','OPEN_SOURCE_REPOSITORIES','TECHNICAL_REPORTS'] },
    { family:'RISK', query:quoted + ' security privacy safety failure mode ' + capability, sources:['NIST','ENISA','OWASP'] },
  ].map((task, index) => ({
    taskOrdinal: index + 1,
    ...task,
    queryFingerprint: hash(task.family + ':' + task.query + ':' + task.sources.join('|')),
    status: 'NOT_EXECUTED',
    resultsCaptured: 0,
    reviewedByHuman: false,
  }));
}

if (!fs.existsSync(sourcePath)) fail('missing exact #492 shortlist input');
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
if (!Array.isArray(source.shortlist)) fail('shortlist array missing');
if (source.manifest?.shortlistFingerprint !== expectedShortlistFingerprint) fail('shortlist fingerprint drifted');
if (source.shortlist.length !== expectedCount) fail('shortlist count drifted');

const seenAtoms = new Set();
const dossiers = source.shortlist.map((item, index) => {
  if (seenAtoms.has(item.atomId)) fail('duplicate source atom: ' + item.atomId);
  seenAtoms.add(item.atomId);
  if (item.selectionOrdinal !== index + 1) fail('source selection order drifted');
  if (item.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED' || item.humanReviewed !== false || item.ownerApproved !== false || item.executionAllowed !== false) {
    fail('unsafe source state for ' + item.atomId);
  }
  const researchTasks = buildQueries(item);
  if (new Set(researchTasks.map(task => task.family)).size !== queryFamilies.length) fail('query family duplication');
  const dossierFingerprint = hash([
    item.selectionOrdinal,
    item.atomId,
    item.atomFingerprint,
    item.capabilityId,
    ...researchTasks.map(task => task.queryFingerprint),
  ].join(':'));
  return {
    dossierOrdinal: index + 1,
    dossierId: 'preseed-dossier-' + String(index + 1).padStart(3, '0'),
    dossierFingerprint,
    sourceShortlistFingerprint: expectedShortlistFingerprint,
    sourceSelectionOrdinal: item.selectionOrdinal,
    atomId: item.atomId,
    atomFingerprint: item.atomFingerprint,
    capabilityId: item.capabilityId,
    capabilityLabel: item.capabilityLabel,
    atomicMechanism: item.atomicMechanism,
    families: item.families,
    sourceCandidateIds: item.sourceCandidateIds,
    evidenceRefs: item.evidenceRefs,
    matchedTerms: item.matchedTerms,
    researchTasks,
    requiredEvidenceSlots: ['CLOSEST_PATENT','CLOSEST_SCHOLARLY_WORK','RELEVANT_STANDARD','KNOWN_IMPLEMENTATION','RISK_OR_LIMITATION','SOURCE_PROVENANCE','HUMAN_COMPARISON_NOTES','LEGAL_REVIEW'],
    researchStatus: 'RESEARCH_NOT_STARTED',
    priorArtStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
    maturityStatus: 'UNASSESSED',
    distinctnessStatus: 'UNASSESSED',
    noveltyStatus: 'NO_CLAIM',
    patentabilityStatus: 'NO_CLAIM',
    humanReviewed: false,
    legalReviewed: false,
    ownerApproved: false,
    sourceDeletionAllowed: false,
    semanticMergeAllowed: false,
    executionAllowed: false,
    authorizationEffect: 'none',
  };
});

const dossiersFingerprint = hash(dossiers.map(dossier => dossier.dossierFingerprint).join('\n'));
const manifest = {
  id: 'pantavion_preseed_prior_art_dossiers_v1',
  lifecycleState: 'CODED',
  sourceShortlistFingerprint: expectedShortlistFingerprint,
  dossiersFingerprint,
  method: 'Deterministic evidence-bound preparation of five bounded research tasks per shortlisted mechanism.',
  truthRule: 'A dossier is an unexecuted research plan. It is not prior-art clearance, novelty, patentability, maturity, grant inclusion, owner approval or execution authority.',
  totals: {
    sourceShortlistItems: expectedCount,
    dossiers: dossiers.length,
    uniqueAtoms: seenAtoms.size,
    queryFamilies: queryFamilies.length,
    researchTasks: dossiers.reduce((sum, dossier) => sum + dossier.researchTasks.length, 0),
    searchesExecuted: 0,
    resultsCaptured: 0,
    humanReviewed: 0,
    legalReviewed: 0,
    priorArtCleared: 0,
    noveltyClaims: 0,
    patentabilityClaims: 0,
    ownerApproved: 0,
    semanticMergesAllowed: 0,
    executionAuthorized: 0,
  },
  queryFamilies,
  requiredNextStages: ['EXECUTE_BOUNDED_RESEARCH','CAPTURE_SOURCE_METADATA','HUMAN_COMPARISON','LEGAL_PATENTABILITY_REVIEW','FOUNDER_PRESEED_SELECTION'],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'dossiers.json'), JSON.stringify({ manifest, dossiers }, null, 2) + '\n');
const rows = [['dossier_id','ordinal','capability_id','atom_id','dossier_fingerprint','research_status','prior_art_status','atomic_mechanism']];
for (const dossier of dossiers) rows.push([
  dossier.dossierId,
  dossier.dossierOrdinal,
  dossier.capabilityId,
  dossier.atomId,
  dossier.dossierFingerprint,
  dossier.researchStatus,
  dossier.priorArtStatus,
  dossier.atomicMechanism,
]);
fs.writeFileSync(path.join(outDir, 'dossiers.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
