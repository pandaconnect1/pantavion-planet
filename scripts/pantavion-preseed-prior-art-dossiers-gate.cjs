const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'preseed-research-shortlist', 'shortlist.json');
const dir = path.join(root, 'data', 'recovery', 'preseed-prior-art-dossiers');
const manifestPath = path.join(dir, 'manifest.json');
const dossiersPath = path.join(dir, 'dossiers.json');
const csvPath = path.join(dir, 'dossiers.csv');
const expectedShortlistFingerprint = '784202a49ab7fe27442021d2d66a8cd1dd4f792e255ea8376ceeb0f52db2d3d6';
const expectedCount = 150;
const expectedFamilies = ['PATENT','SCHOLARLY','STANDARDS','IMPLEMENTATION','RISK'];
const requiredEvidenceSlots = ['CLOSEST_PATENT','CLOSEST_SCHOLARLY_WORK','RELEVANT_STANDARD','KNOWN_IMPLEMENTATION','RISK_OR_LIMITATION','SOURCE_PROVENANCE','HUMAN_COMPARISON_NOTES','LEGAL_REVIEW'];

function fail(message) {
  console.error('PANTAVION PRESEED PRIOR ART DOSSIERS GATE: FAIL - ' + message);
  process.exit(1);
}
function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}
function clean(value, limit = 180) {
  return String(value || '').replace(/["“”]/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);
}
function buildQueries(item) {
  const mechanism = clean(item.atomicMechanism);
  const capability = clean(item.capabilityLabel, 80);
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
function csvRecordCount(value) {
  let quoted = false;
  let records = 0;
  for (let i = 0; i < value.length; i += 1) {
    if (value[i] === '"') {
      if (quoted && value[i + 1] === '"') i += 1;
      else quoted = !quoted;
    } else if (value[i] === '\n' && !quoted) records += 1;
  }
  if (quoted) fail('CSV unterminated quoted field');
  return records;
}

for (const file of [sourcePath, manifestPath, dossiersPath, csvPath]) {
  if (!fs.existsSync(file)) fail('required artifact missing: ' + path.relative(root, file));
}
const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const projection = JSON.parse(fs.readFileSync(dossiersPath, 'utf8'));
const csv = fs.readFileSync(csvPath, 'utf8');
if (!Array.isArray(source.shortlist) || !Array.isArray(projection.dossiers)) fail('required arrays missing');
if (manifest.id !== 'pantavion_preseed_prior_art_dossiers_v1') fail('manifest id mismatch');
if (JSON.stringify(manifest) !== JSON.stringify(projection.manifest)) fail('embedded manifest mismatch');
const actualShortlistFingerprint = hash(source.shortlist.map(item => [
  item.selectionOrdinal,
  item.capabilityId,
  item.rankWithinCapability,
  item.atomId,
  item.atomFingerprint,
  item.evidenceRefs.join('|'),
  item.sourceCandidateIds.join('|'),
  item.capabilityScore,
].join(':')).join('\n'));
if (source.shortlist.length !== expectedCount || actualShortlistFingerprint !== expectedShortlistFingerprint || source.manifest?.shortlistFingerprint !== expectedShortlistFingerprint) fail('exact #492 source drifted');
if (projection.dossiers.length !== expectedCount) fail('dossier count mismatch');

const seenDossiers = new Set();
const seenAtoms = new Set();
for (let index = 0; index < projection.dossiers.length; index += 1) {
  const sourceItem = source.shortlist[index];
  const dossier = projection.dossiers[index];
  if (dossier.dossierOrdinal !== index + 1 || dossier.dossierId !== 'preseed-dossier-' + String(index + 1).padStart(3, '0')) fail('dossier ordering mismatch');
  if (seenDossiers.has(dossier.dossierId) || seenAtoms.has(dossier.atomId)) fail('duplicate dossier identity');
  seenDossiers.add(dossier.dossierId);
  seenAtoms.add(dossier.atomId);
  for (const field of ['atomId','atomFingerprint','capabilityId','capabilityLabel','atomicMechanism','families','sourceCandidateIds','evidenceRefs','matchedTerms']) {
    if (JSON.stringify(dossier[field]) !== JSON.stringify(sourceItem[field])) fail('source evidence mismatch: ' + field + ' for ' + dossier.dossierId);
  }
  if (dossier.sourceShortlistFingerprint !== expectedShortlistFingerprint || dossier.sourceSelectionOrdinal !== sourceItem.selectionOrdinal) fail('source binding mismatch');
  const expectedTasks = buildQueries(sourceItem);
  if (JSON.stringify(dossier.researchTasks) !== JSON.stringify(expectedTasks)) fail('research task mismatch: ' + dossier.dossierId);
  if (JSON.stringify(dossier.requiredEvidenceSlots) !== JSON.stringify(requiredEvidenceSlots)) fail('evidence slots mismatch');
  const expectedDossierFingerprint = hash([
    sourceItem.selectionOrdinal,
    sourceItem.atomId,
    sourceItem.atomFingerprint,
    sourceItem.capabilityId,
    ...expectedTasks.map(task => task.queryFingerprint),
  ].join(':'));
  if (dossier.dossierFingerprint !== expectedDossierFingerprint) fail('dossier fingerprint mismatch');
  if (dossier.researchStatus !== 'RESEARCH_NOT_STARTED' || dossier.priorArtStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED' || dossier.maturityStatus !== 'UNASSESSED' || dossier.distinctnessStatus !== 'UNASSESSED' || dossier.noveltyStatus !== 'NO_CLAIM' || dossier.patentabilityStatus !== 'NO_CLAIM') fail('unsupported truth state');
  for (const field of ['humanReviewed','legalReviewed','ownerApproved','sourceDeletionAllowed','semanticMergeAllowed','executionAllowed']) {
    if (dossier[field] !== false) fail('unauthorized state: ' + field);
  }
  if (dossier.authorizationEffect !== 'none') fail('authorization effect must remain none');
}
const actualDossiersFingerprint = hash(projection.dossiers.map(dossier => dossier.dossierFingerprint).join('\n'));
if (manifest.dossiersFingerprint !== actualDossiersFingerprint) fail('dossiers fingerprint mismatch');
if (JSON.stringify(manifest.queryFamilies) !== JSON.stringify(expectedFamilies)) fail('query family manifest mismatch');
const totals = manifest.totals || {};
if (totals.sourceShortlistItems !== expectedCount || totals.dossiers !== expectedCount || totals.uniqueAtoms !== expectedCount || totals.queryFamilies !== 5 || totals.researchTasks !== 750) fail('coverage totals mismatch');
for (const field of ['searchesExecuted','resultsCaptured','humanReviewed','legalReviewed','priorArtCleared','noveltyClaims','patentabilityClaims','ownerApproved','semanticMergesAllowed','executionAuthorized']) {
  if (totals[field] !== 0) fail('forbidden non-zero total: ' + field);
}
if (csvRecordCount(csv) !== expectedCount + 1) fail('CSV logical record count mismatch');

console.log(JSON.stringify({
  gate: 'PANTAVION PRESEED PRIOR ART DOSSIERS',
  result: 'PASS',
  sourceShortlistItems: expectedCount,
  dossiers: projection.dossiers.length,
  uniqueAtoms: seenAtoms.size,
  queryFamilies: expectedFamilies.length,
  researchTasks: 750,
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
  dossiersFingerprint: manifest.dossiersFingerprint,
}, null, 2));
