const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const inputPath = path.join(root, 'data', 'recovery', 'innovation-semantic-atomization', 'semantic-atoms.json');
const outDir = path.join(root, 'data', 'recovery', 'innovation-capability-mapping');

function fail(message) {
  console.error(`PANTAVION INNOVATION CAPABILITY MAPPING: FAIL - ${message}`);
  process.exit(1);
}
function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function normalize(value) {
  return String(value || '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}
function csvEscape(value) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

const capabilities = [
  { id: 'CAP_INTENT_ORCHESTRATION', label: 'Intent and orchestration', terms: ['intent','orchestrat','workflow','plan','router','kernel','agent','task','goal'] },
  { id: 'CAP_AGENT_GOVERNANCE', label: 'Agent governance and budgets', terms: ['agent','capability','budget','grant','scope','admission','ephemeral','swarm'] },
  { id: 'CAP_OWNER_CONTROL', label: 'Owner control and approvals', terms: ['owner','founder','approval','approve','control plane','admin','authorize','consent'] },
  { id: 'CAP_SECURITY_TRUST', label: 'Security, trust and safety', terms: ['security','trust','guardian','firewall','moderation','abuse','verify','identity','authentication','permission'] },
  { id: 'CAP_EDGE_RESILIENCE', label: 'Disconnected, edge and resilience', terms: ['offline','edge','disconnected','satellite','mesh','fallback','failover','resilien','continuity','network isolation'] },
  { id: 'CAP_RECOVERY_PROVENANCE', label: 'Recovery, provenance and evidence', terms: ['recover','provenance','evidence','archive','source','audit','receipt','truth','determin'] },
  { id: 'CAP_TRANSLATION_LANGUAGE', label: 'Translation and language', terms: ['translat','interpreter','language','dialect','subtitle','speech','stt','tts'] },
  { id: 'CAP_COMMUNICATION', label: 'Communication and collaboration', terms: ['chat','message','email','voice','video','call','conversation','contact','notification'] },
  { id: 'CAP_PEOPLE_SOCIAL', label: 'People, social and relationships', terms: ['people','social','relationship','community','profile','dating','nearby','friend'] },
  { id: 'CAP_CRISIS_SOS', label: 'SOS, crisis and humanitarian response', terms: ['sos','emergency','crisis','danger','incident','humanitarian','trusted contact'] },
  { id: 'CAP_LEARNING_RESEARCH', label: 'Learning, research and knowledge', terms: ['learning','education','research','knowledge','library','prior art','benchmark','invention'] },
  { id: 'CAP_MARKET_BUSINESS', label: 'Marketplace, work and business', terms: ['marketplace','business','commerce','job','work','income','listing','ads'] },
  { id: 'CAP_MEDIA_CREATION', label: 'Media and creation', terms: ['music','media','image','audio','video','creator','studio','generation'] },
  { id: 'CAP_GEO_INFRASTRUCTURE', label: 'Maps and physical infrastructure', terms: ['map','gis','water','utility','dwg','location','geospatial','infrastructure','device'] },
  { id: 'CAP_POLICY_JURISDICTION', label: 'Policy, legal and jurisdiction', terms: ['legal','policy','jurisdiction','country','gdpr','dsa','minor','age','privacy','license'] },
];

function scoreCapability(text, capability) {
  let score = 0;
  const matchedTerms = [];
  for (const term of capability.terms) {
    if (text.includes(term)) {
      score += term.includes(' ') ? 3 : 1;
      matchedTerms.push(term);
    }
  }
  return { score, matchedTerms };
}

if (!fs.existsSync(inputPath)) fail('semantic-atoms.json missing; run innovations:verify-atomization first');
const projection = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(projection.atoms)) fail('source atoms array missing');

const mappings = [];
const capabilityCounts = Object.fromEntries(capabilities.map(capability => [capability.id, 0]));
let unmappedAtoms = 0;

for (const atom of [...projection.atoms].sort((a, b) => String(a.atomId).localeCompare(String(b.atomId)))) {
  const text = normalize(`${atom.atomicMechanism || ''} ${(atom.families || []).join(' ')}`);
  const candidates = capabilities
    .map(capability => ({ capabilityId: capability.id, ...scoreCapability(text, capability) }))
    .filter(candidate => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.capabilityId.localeCompare(b.capabilityId))
    .slice(0, 5);

  for (const candidate of candidates) capabilityCounts[candidate.capabilityId] += 1;
  if (!candidates.length) unmappedAtoms += 1;

  mappings.push({
    atomId: atom.atomId,
    atomFingerprint: atom.normalizedFingerprint,
    sourceCandidateIds: [...(atom.sourceCandidateIds || [])].sort(),
    candidateCapabilities: candidates,
    mappingStatus: candidates.length ? 'CANDIDATE_ONLY_REVIEW_REQUIRED' : 'UNMAPPED_REVIEW_REQUIRED',
    humanApproved: false,
    authorizationEffect: 'none',
    executionAllowed: false,
    noveltyStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
    noveltyClaimAllowed: false,
    nextAction: candidates.length
      ? 'Human adjudication must confirm, reject, or refine candidate capabilities before canonical assignment.'
      : 'Human review must identify a capability or preserve the atom as unresolved.',
  });
}

const sourceAtomFingerprint = hash(
  projection.atoms.map(atom => `${atom.atomId}:${atom.normalizedFingerprint}`).sort().join('\n')
);
const mappingFingerprint = hash(
  mappings.map(mapping => `${mapping.atomId}:${mapping.candidateCapabilities.map(c => `${c.capabilityId}=${c.score}`).join('|')}`).join('\n')
);
const manifest = {
  id: 'pantavion_innovation_capability_mapping_v1',
  lifecycleState: 'CODED',
  sourceAtomizationId: projection.manifest?.id || null,
  sourceAtomFingerprint,
  mappingFingerprint,
  method: 'Deterministic bounded lexical candidate scoring against a versioned canonical capability vocabulary.',
  truthRule: 'Mappings are review candidates only. No mapping is human-approved, canonical, semantically unique, novel, mature, executable, merged, deployed, or production-verified.',
  totals: {
    sourceAtoms: projection.atoms.length,
    mappedCandidateAtoms: projection.atoms.length - unmappedAtoms,
    unmappedAtoms,
    totalMappings: mappings.length,
    humanApprovedMappings: 0,
    executionAuthorizedMappings: 0,
    unsupportedNoveltyClaims: 0,
    capabilityCounts,
  },
  capabilityVocabulary: capabilities.map(({ id, label }) => ({ id, label })),
  requiredNextStages: [
    'HUMAN_CAPABILITY_ADJUDICATION',
    'SEMANTIC_DEDUPLICATION_WITH_HUMAN_ADJUDICATION',
    'MATURITY_EVIDENCE_REVIEW',
    'GLOBAL_PRIOR_ART_RESEARCH',
    'NOVELTY_SCORING',
    'PRESEED_SELECTION',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'capability-mappings.json'), JSON.stringify({ manifest, mappings }, null, 2) + '\n');
const rows = [['atom_id','mapping_status','candidate_capabilities','human_approved','execution_allowed','novelty_status']];
for (const mapping of mappings) rows.push([
  mapping.atomId,
  mapping.mappingStatus,
  mapping.candidateCapabilities.map(candidate => `${candidate.capabilityId}:${candidate.score}`).join('|'),
  mapping.humanApproved,
  mapping.executionAllowed,
  mapping.noveltyStatus,
]);
fs.writeFileSync(path.join(outDir, 'capability-mappings.csv'), rows.map(row => row.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
