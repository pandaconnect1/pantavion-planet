const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const generatedInputPath = path.join(root, 'data/recovery/canonical-knowledge-v2/full-corpus.json');
const committedCorpusRoot = path.join(root, 'data/recovery/imported-pr248/canonical-ledger/corpus');
const outRoot = path.join(root, 'data/recovery/canonical-semantic-v3');
const productionTruthPath = path.join(root, 'data/recovery/production-truth/supabase-repository-evidence-20260826.json');

const ontology = {
  'Personal AI / PantaAI': { memory: ['memory','remember','context','personal context','preference','goal'], orchestration: ['agent','router','tool call','workflow','planner','assistant'], personalization: ['personalized','adaptive','communication style','accessibility'] },
  People: { profile: ['profile','bio','avatar','identity'], discovery: ['discover','nearby','search people','contact match'], relationships: ['relationship','friend','follow','connection','block'] },
  Chat: { messaging: ['message','send','inbox','delivery','read receipt'], conversations: ['conversation','thread','participant'], realtime: ['realtime','presence','typing','subscription'], privacy: ['secret chat','encryption','recipient privacy'] },
  'Interpreter / Translation': { translation: ['translate','translation','translator','language pair'], speech: ['stt','tts','speech-to-text','text-to-speech'], interpretation: ['interpreter','two-device','subtitle','dialect'] },
  'Voice / Video': { calling: ['call','webrtc','voice call','video call'], media: ['microphone','camera','audio stream','video stream'] },
  'Social / Pulse / Communities': { publishing: ['post','publish','feed','timeline'], engagement: ['comment','reaction','like','share'], communities: ['community','group','membership'], pulse: ['pulse','news','trend'] },
  'Safety / Trust / Minors': { moderation: ['moderation','report','abuse','review queue'], minors: ['minor','child','teen','guardian','age band'], trust: ['trust','verification','risk','suspicious'], blocking: ['block','blocked','isolation'] },
  'SOS / Crisis': { emergency: ['sos','emergency','panic'], incident: ['incident','crisis','humanitarian'], response: ['responder','trusted contact','dispatch'] },
  'Maps / World / Water': { mapping: ['map','gis','geospatial','gps','location'], water: ['water','utility','pipe','network','dwg'], city: ['city intelligence','infrastructure'] },
  'Marketplace / Work / Business': { marketplace: ['marketplace','listing','seller','buyer'], work: ['job','work','career','employment'], business: ['business','commerce','income'], advertising: ['ads center','campaign','advertising'] },
  'Learning / Knowledge': { learning: ['learning','lesson','mastery','curriculum','pantalearn'], knowledge: ['knowledge','research','library'], assessment: ['quiz','assessment','scan-to-learn'] },
  'Music / Media / Creation': { music: ['music','song','lyrics'], creation: ['creator','generation','studio'], media: ['image','audio','video','media'] },
  'Kernel / Guardian / Runtime': { orchestration: ['kernel','orchestration','router','control plane'], guardian: ['guardian','supervisor','policy gate'], execution: ['durable execution','checkpoint','worker','runtime'], providers: ['provider routing','capability registry'] },
  'Identity / Auth / Consent': { authentication: ['auth','authentication','login','passkey','aal2','mfa'], authorization: ['permission','role','entitlement','access gate'], consent: ['consent','privacy choice'], identity: ['identity','registration','account'] },
  'Resilience / Offline / Infrastructure': { offline: ['offline','sms','mms','mesh'], continuity: ['failover','continuity','redundancy','resilience'], infrastructure: ['infrastructure','satellite','deployment'] }
};

const capabilities = {
  create: ['create','insert','register','publish','send','enqueue','start'], read: ['read','list','fetch','search','discover','view','select'], update: ['update','edit','change','accept','approve','reject','decide'], delete: ['delete','remove','revoke','leave'], synchronize: ['sync','import','export','hydrate'], protect: ['secure','privacy','rls','policy','guard','block','moderation'], translate: ['translate','translation','interpreter'], execute: ['execute','worker','runtime','job','workflow','agent'], observe: ['audit','monitor','report','metrics','log','evidence']
};

const sourcePathAnchors = [
  { module:'Maps / World / Water', subsystem:'water', patterns:[/(^|\/)app\/professional\/infrastructure\/water(\/|$)/,/(^|\/)core\/(infrastructure\/)?water(\/|$)/,/(^|\/)scripts\/water[-/]/] },
  { module:'Interpreter / Translation', subsystem:'translation', patterns:[/(^|\/)app\/translate(\/|$)/,/(^|\/)core\/translation(\/|$)/,/(^|\/)services\/translation(\/|[-.])/] },
  { module:'SOS / Crisis', subsystem:'emergency', patterns:[/(^|\/)app\/(sos|emergency|crisis)(\/|$)/,/(^|\/)core\/(sos|emergency|crisis)(\/|$)/] },
  { module:'Safety / Trust / Minors', subsystem:'moderation', patterns:[/(^|\/)app\/admin\/moderation(\/|$)/,/(^|\/)core\/(safety|moderation|trust|minors)(\/|$)/,/(^|\/)scripts\/[^/]*(safety|moderation)[^/]*$/] },
  { module:'Identity / Auth / Consent', subsystem:'authentication', patterns:[/(^|\/)app\/(auth|login|register)(\/|$)/,/(^|\/)core\/(auth|identity|consent)(\/|$)/,/(^|\/)lib\/[^/]*(auth|identity)[^/]*$/] },
  { module:'Kernel / Guardian / Runtime', subsystem:'orchestration', patterns:[/(^|\/)app\/kernel(\/|$)/,/(^|\/)core\/(kernel|runtime|guardian)(\/|$)/,/(^|\/)core\/[^/]*kernel[^/]*$/,/(^|\/)scripts\/[^/]*(kernel|guardian|runtime)[^/]*$/] },
  { module:'Personal AI / PantaAI', subsystem:'memory', patterns:[/(^|\/)core\/memory(\/|$)/,/(^|\/)app\/(panta-ai|personal-ai)(\/|$)/,/(^|\/)core\/(panta-ai|personal-ai)(\/|$)/] },
  { module:'People', subsystem:'profile', patterns:[/(^|\/)app\/(people|profile|contacts)(\/|$)/,/(^|\/)core\/(people|profile|contacts)(\/|$)/] },
  { module:'Social / Pulse / Communities', subsystem:'publishing', patterns:[/(^|\/)app\/(social|pulse|communities)(\/|$)/,/(^|\/)core\/(social|pulse|communities)(\/|$)/] },
  { module:'Chat', subsystem:'messaging', patterns:[/(^|\/)app\/(chat|messages|messaging)(\/|$)/,/(^|\/)core\/(chat|messages|messaging)(\/|$)/] },
  { module:'Learning / Knowledge', subsystem:'learning', patterns:[/(^|\/)app\/(learning|pantalearn)(\/|$)/,/(^|\/)core\/(learning|knowledge)(\/|$)/] },
  { module:'Marketplace / Work / Business', subsystem:'marketplace', patterns:[/(^|\/)app\/(marketplace|business|work)(\/|$)/,/(^|\/)core\/(marketplace|business|work)(\/|$)/] },
  { module:'Music / Media / Creation', subsystem:'media', patterns:[/(^|\/)app\/(music|media|creation)(\/|$)/,/(^|\/)core\/(music|media|creation)(\/|$)/] },
  { module:'Resilience / Offline / Infrastructure', subsystem:'continuity', patterns:[/(^|\/)app\/(offline|resilience)(\/|$)/,/(^|\/)core\/(offline|resilience)(\/|$)/] },
  { module:'Voice / Video', subsystem:'calling', patterns:[/(^|\/)app\/(voice|video|calls)(\/|$)/,/(^|\/)core\/(voice|video|calls)(\/|$)/] }
];

function sourcePathAnchor(file) {
  const sourcePath = String(file || '').toLowerCase().replace(/\\/g,'/');
  if (!sourcePath || sourcePath.startsWith('data/runtime-reports/')) return null;
  const matches = sourcePathAnchors.filter(anchor => anchor.patterns.some(pattern => pattern.test(sourcePath)));
  return matches.length === 1 ? { ...matches[0], sourcePath } : null;
}

function anchoredRank(groups, text, anchor) {
  const ranked = rank(groups, text);
  if (!anchor || !groups[anchor.subsystem]) return ranked;
  const existing = ranked.find(item => item.name === anchor.subsystem);
  if (existing) {
    existing.score += 8;
    existing.evidence = [...new Set([...existing.evidence,'source-path:'+anchor.sourcePath])];
  } else {
    ranked.push({ name:anchor.subsystem, score:8, evidence:['source-path:'+anchor.sourcePath] });
  }
  return ranked.sort((a,b) => b.score-a.score || a.name.localeCompare(b.name));
}

function evidenceModules(value) {
  const text = normalize(value);
  const modules = [];
  const add = name => { if (!modules.includes(name)) modules.push(name); };
  if (/identity|auth|registration|profile|consent|aal2|account/.test(text)) add('Identity / Auth / Consent');
  if (/trust|safety|minor|privacy|protected|moderation|block|guardian/.test(text)) add('Safety / Trust / Minors');
  if (/durable execution|scheduled worker|owner decision|kernel|runtime/.test(text)) add('Kernel / Guardian / Runtime');
  if (/people|contact|nearby|relationship/.test(text)) add('People');
  if (/social|communit|post|reaction|notification|personal media|media item|media source/.test(text)) add('Social / Pulse / Communities');
  if (/chat|messag|conversation|receipt/.test(text)) add('Chat');
  if (/interpreter|translat|speech|language/.test(text)) add('Interpreter / Translation');
  if (/personal ai|memory|panta ai/.test(text)) add('Personal AI / PantaAI');
  if (/emergency|sos|crisis/.test(text)) add('SOS / Crisis');
  if (/listing|billing|entitlement|revenue|promotion|marketplace/.test(text)) add('Marketplace / Work / Business');
  if (/voice|video|call/.test(text)) add('Voice / Video');
  if (/water|dwg|geospatial|map system/.test(text)) add('Maps / World / Water');
  if (/continuity|offline|resilience/.test(text)) add('Resilience / Offline / Infrastructure');
  if (/learning|curriculum|mastery/.test(text)) add('Learning / Knowledge');
  return modules;
}

function loadProductionTruthEvidence() {
  if (!fs.existsSync(productionTruthPath)) return null;
  const evidence = JSON.parse(fs.readFileSync(productionTruthPath,'utf8'));
  const repoMigrations = evidence.repository && evidence.repository.migrationFiles;
  const appliedMigrations = evidence.supabase && evidence.supabase.appliedMigrations;
  if (!repoMigrations || repoMigrations.count !== repoMigrations.items.length) throw new Error('Repository migration evidence count mismatch');
  if (!appliedMigrations || appliedMigrations.count !== appliedMigrations.items.length) throw new Error('Applied migration evidence count mismatch');
  const objectEvidence = evidence.reconciliation && evidence.reconciliation.objectLevelProductionEvidence;
  if (!objectEvidence || objectEvidence.examinedRepositoryMigrations !== objectEvidence.items.length) throw new Error('Object-level migration evidence count mismatch');
  if (objectEvidence.examinedRepositoryMigrations !== evidence.reconciliation.repositoryMigrationsWithoutExactAppliedName.count) throw new Error('Object-level migration evidence does not cover every non-exact repository migration');
  if (objectEvidence.equivalenceDecision !== 'HOLD_NON_EXACT' || objectEvidence.items.some(item => item.equivalenceDecision !== 'HOLD_NON_EXACT')) throw new Error('Object-level evidence must not assert migration equivalence');
  return evidence;
}

function normalize(value) { return String(value || '').toLowerCase().replace(/[_/.-]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function hasTerm(text, term) { const t = normalize(term); return t.includes(' ') ? text.includes(t) : text.split(/\W+/).includes(t); }
function rank(groups, text) { return Object.entries(groups).map(([name,terms]) => ({ name, score: terms.reduce((n,t) => n + (hasTerm(text,t) ? (normalize(t).includes(' ') ? 3 : 1) : 0), 0), evidence: terms.filter(t => hasTerm(text,t)) })).filter(x => x.score > 0).sort((a,b) => b.score-a.score || a.name.localeCompare(b.name)); }
function artifactType(file, text) {
  const f = normalize(file);
  if (/(__tests__|\.test\.|\.spec\.)/.test(file)) return 'test';
  if (f.includes('migration') || /create table|alter table|create policy/.test(text)) return 'database-migration';
  if (f.startsWith('app api ') || f.includes(' route ts')) return 'api';
  if (f.startsWith('app ') && /component|page|screen|button/.test(text)) return 'user-interface';
  if (f.startsWith('services ')) return 'service';
  if (f.startsWith('scripts ') || f.startsWith('github ')) return 'automation';
  if (f.startsWith('docs ') || file.endsWith('.md')) return 'requirement-document';
  if (f.startsWith('data runtime reports ')) return 'runtime-evidence';
  if (f.startsWith('data ')) return 'data-artifact';
  return 'implementation';
}
function isRecursiveLedgerArtifact(record) {
  const sourceFile = normalize(record.provenance && record.provenance.sourceFile);
  return sourceFile.startsWith('data recovery canonical ledger corpus batches ');
}
function classify(record) {
  const seedModule = record.classification && record.classification.module;
  if (isRecursiveLedgerArtifact(record)) {
    const sourceFile = (record.provenance && record.provenance.sourceFile) || 'unknown';
    return {
      ...record,
      classification: {
        ...record.classification,
        semanticDomain: 'Recovery / Provenance',
        subsystem: 'recursive-ledger',
        capability: 'preserve',
        feature: 'recursive-ledger.preserve.recovery-wrapper',
        artifactType: 'recovery-ledger-wrapper',
        canonicalTarget: 'canonical/recovery/quarantine/' + path.basename(sourceFile,'.json'),
        classificationMethod: 'semantic-v3-recursive-ledger-quarantine',
        classificationEvidence: { sourcePath: sourceFile, rule: 'source-is-canonical-ledger-batch' }
      },
      reviewStatus: 'PRESERVED_RECURSIVE_ARTIFACT',
      semanticDecision: 'PRESERVE_QUARANTINE',
      semanticReviewReasons: ['recursive_ledger_artifact']
    };
  }
  const sourceFile = (record.provenance && record.provenance.sourceFile) || '';
  const pathAnchor = sourcePathAnchor(sourceFile);
  const module = pathAnchor ? pathAnchor.module : seedModule;
  const text = normalize([sourceFile, record.text, record.context].join('\n'));
  const subsystems = ontology[module] ? anchoredRank(ontology[module], text, pathAnchor) : [];
  const capabilityRanks = rank(capabilities, text);
  const subsystem = subsystems[0] ? subsystems[0].name : null;
  const capability = capabilityRanks[0] ? capabilityRanks[0].name : null;
  const artifact = artifactType((record.provenance && record.provenance.sourceFile) || '', text);
  const subsystemConflict = subsystems.length > 1 && subsystems[0].score === subsystems[1].score;
  const capabilityConflict = capabilityRanks.length > 1 && capabilityRanks[0].score === capabilityRanks[1].score;
  const competingModules = Object.entries(ontology).map(([name,groups]) => {
    const rankedSubsystems = name === module ? subsystems : rank(groups, text);
    const pathScore = pathAnchor && name === pathAnchor.module ? 12 : 0;
    return {
      name,
      score: rankedSubsystems.reduce((sum,item) => sum + item.score, 0) + pathScore,
      strongestSubsystemScore: rankedSubsystems[0] ? rankedSubsystems[0].score : 0,
      evidence: [...(pathAnchor && name === pathAnchor.module ? ['source-path:'+pathAnchor.sourcePath] : []),...rankedSubsystems.flatMap(item => item.evidence)].slice(0,12)
    };
  }).filter(x => x.score > 0).sort((a,b) => b.score-a.score || b.strongestSubsystemScore-a.strongestSubsystemScore || a.name.localeCompare(b.name));
  const topModule = competingModules[0] || null;
  const secondModule = competingModules[1] || null;
  const moduleMatches = Boolean(module && topModule && topModule.name === module);
  const moduleEvidenceStrong = Boolean(topModule && topModule.score >= 3 && topModule.strongestSubsystemScore >= 2);
  const moduleMarginStrong = Boolean(topModule && (!secondModule || topModule.score - secondModule.score >= 2));
  const subsystemEvidenceStrong = Boolean(subsystems[0] && subsystems[0].score >= 2);
  const moduleConflict = Boolean(module && topModule && topModule.name !== module);
  const deterministic = Boolean(module && subsystem && capability && moduleMatches && moduleEvidenceStrong && moduleMarginStrong && subsystemEvidenceStrong && !subsystemConflict && !capabilityConflict && !moduleConflict);
  const reasons = [];
  if (!module) reasons.push('module_missing');
  if (!subsystem) reasons.push('subsystem_missing');
  if (!capability) reasons.push('capability_missing');
  if (!moduleMatches) reasons.push('module_not_confirmed');
  if (!moduleEvidenceStrong) reasons.push('module_evidence_weak');
  if (!moduleMarginStrong) reasons.push('module_margin_ambiguous');
  if (!subsystemEvidenceStrong) reasons.push('subsystem_evidence_weak');
  if (subsystemConflict) reasons.push('subsystem_conflict');
  if (capabilityConflict) reasons.push('capability_conflict');
  if (moduleConflict) reasons.push('module_conflict:' + module + '->' + topModule.name);
  return { ...record, classification: { ...record.classification, module, subsystem, capability, feature: subsystem && capability ? subsystem + '.' + capability + '.' + artifact : null, artifactType: artifact, canonicalTarget: deterministic ? 'canonical/' + module + '/' + subsystem + '/' + capability : null, classificationMethod: pathAnchor ? 'semantic-v3-source-path-anchored-ontology' : 'semantic-v3-strict-evidence-ontology', classificationEvidence: { seedModule, pathAnchor:pathAnchor ? { module:pathAnchor.module, subsystem:pathAnchor.subsystem, sourcePath:pathAnchor.sourcePath } : null, subsystem: subsystems.slice(0,3), capability: capabilityRanks.slice(0,3), competingModules: competingModules.slice(0,3) } }, reviewStatus: deterministic ? 'SEMANTICALLY_CLASSIFIED' : 'REVIEW_REQUIRED', semanticDecision: deterministic ? 'ROUTE_CANDIDATE' : 'HOLD', semanticReviewReasons: reasons };
}
function fingerprint(records) { return crypto.createHash('sha256').update(records.map(r => r.id).join('\n')).digest('hex'); }

function loadCanonicalInput() {
  const receiptPath = path.join(committedCorpusRoot, 'MATERIALIZATION_RECEIPT.json');
  const batchesRoot = path.join(committedCorpusRoot, 'batches');
  if (fs.existsSync(receiptPath) && fs.existsSync(batchesRoot)) {
    const receipt = JSON.parse(fs.readFileSync(receiptPath, 'utf8'));
    const batchFiles = fs.readdirSync(batchesRoot).filter(name => name.endsWith('.json')).sort();
    const records = [];
    for (const name of batchFiles) {
      const batch = JSON.parse(fs.readFileSync(path.join(batchesRoot, name), 'utf8'));
      if (!Array.isArray(batch.records)) throw new Error('Committed batch has no records: ' + name);
      records.push(...batch.records);
    }
    if (records.length !== receipt.totalRecords || batchFiles.length !== receipt.totalBatches) {
      throw new Error('Committed corpus receipt mismatch: records=' + records.length + ', batches=' + batchFiles.length);
    }
    return { manifest: { id:receipt.id, corpusFingerprint:receipt.corpusFingerprint }, records, source:'committed-canonical-ledger' };
  }
  if (!fs.existsSync(generatedInputPath)) throw new Error('Missing canonical corpus ledger and generated fallback');
  return { ...JSON.parse(fs.readFileSync(generatedInputPath, 'utf8')), source:'generated-v2-fallback' };
}

const input = loadCanonicalInput();
if (!Array.isArray(input.records)) throw new Error('Canonical input records are missing');
const before = input.records.map(r => r.id);
if (new Set(before).size !== before.length) throw new Error('Input contains duplicate record IDs');
const records = input.records.map(classify);
const after = records.map(r => r.id);
if (before.length !== after.length || before.some((id,i) => id !== after[i])) throw new Error('Record preservation gate failed');

const counts = records.reduce((a,r) => { a[r.reviewStatus] = (a[r.reviewStatus] || 0) + 1; return a; }, {});
const moduleSummary = {};
const reviewReasonSummary = {};
for (const r of records) {
  const module = r.reviewStatus === 'PRESERVED_RECURSIVE_ARTIFACT' ? 'RECOVERY / PROVENANCE QUARANTINE' : (r.classification.module || 'UNCLASSIFIED');
  const target = moduleSummary[module] ||= { total:0, classified:0, reviewRequired:0, preservedRecursiveArtifacts:0, pathAnchored:0, pathReassigned:0, subsystems:{}, capabilities:{}, artifactTypes:{}, sourceFamilies:{}, evidenceInventory:{ specification:0, schemaOrMigration:0, backendOrService:0, userInterface:0, tests:0, automation:0, runtimeEvidence:0, other:0 }, reviewReasons:{} };
  target.total++;
  if (r.reviewStatus === 'SEMANTICALLY_CLASSIFIED') target.classified++;
  else if (r.reviewStatus === 'PRESERVED_RECURSIVE_ARTIFACT') target.preservedRecursiveArtifacts++;
  else target.reviewRequired++;
  if (r.classification.subsystem) target.subsystems[r.classification.subsystem] = (target.subsystems[r.classification.subsystem] || 0) + 1;
  if (r.classification.capability) target.capabilities[r.classification.capability] = (target.capabilities[r.classification.capability] || 0) + 1;
  const artifact = r.classification.artifactType || 'unknown';
  const sourceFamily = (r.provenance && r.provenance.sourceFamily) || 'unknown';
  target.artifactTypes[artifact] = (target.artifactTypes[artifact] || 0) + 1;
  target.sourceFamilies[sourceFamily] = (target.sourceFamilies[sourceFamily] || 0) + 1;
  const pathEvidence = r.classification.classificationEvidence && r.classification.classificationEvidence.pathAnchor;
  if (pathEvidence) {
    target.pathAnchored++;
    if (r.classification.classificationEvidence.seedModule !== r.classification.module) target.pathReassigned++;
  }
  const evidenceLane = artifact === 'requirement-document' ? 'specification'
    : artifact === 'database-migration' ? 'schemaOrMigration'
    : ['api','service','implementation'].includes(artifact) ? 'backendOrService'
    : artifact === 'user-interface' ? 'userInterface'
    : artifact === 'test' ? 'tests'
    : artifact === 'automation' ? 'automation'
    : artifact === 'runtime-evidence' ? 'runtimeEvidence'
    : 'other';
  target.evidenceInventory[evidenceLane]++;
  for (const reason of r.semanticReviewReasons || []) {
    reviewReasonSummary[reason] = (reviewReasonSummary[reason] || 0) + 1;
    target.reviewReasons[reason] = (target.reviewReasons[reason] || 0) + 1;
  }
}
const productionTruth = loadProductionTruthEvidence();
const unassignedExternalEvidence = { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
function attachExternalEvidence(kind, item, value) {
  const modules = evidenceModules(value);
  if (!modules.length) {
    unassignedExternalEvidence[kind].push(item);
    return;
  }
  for (const module of modules) {
    const target = moduleSummary[module];
    if (!target) continue;
    target.externalEvidence ||= { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
    target.externalEvidence[kind].push(item);
  }
}
if (productionTruth) {
  for (const item of productionTruth.repository.migrationFiles.items) attachExternalEvidence('repositoryMigrationFiles',item,item.file);
  for (const item of productionTruth.supabase.appliedMigrations.items) attachExternalEvidence('appliedMigrations',item,item.name);
  for (const item of productionTruth.reconciliation.objectLevelProductionEvidence.items) attachExternalEvidence('migrationObjectReconciliation',item,item.repositoryMigration);
  for (const item of productionTruth.repository.verificationArtifacts.conventionalTests.items) attachExternalEvidence('conventionalTests',item,item.path);
  for (const item of productionTruth.repository.verificationArtifacts.gatesAuditsSmokes.items) attachExternalEvidence('gatesAuditsSmokes',item,item.path);
}
for (const [module,target] of Object.entries(moduleSummary)) {
  if (module === 'RECOVERY / PROVENANCE QUARANTINE') continue;
  target.externalEvidence ||= { repositoryMigrationFiles:[], appliedMigrations:[], migrationObjectReconciliation:[], conventionalTests:[], gatesAuditsSmokes:[] };
  target.missingRecoveredEvidenceCategories = Object.entries(target.evidenceInventory).filter(([,count]) => count === 0).map(([name]) => name);
  target.missingCombinedEvidenceCategories = target.missingRecoveredEvidenceCategories.filter(name => {
    if (name === 'schemaOrMigration') return !target.externalEvidence.repositoryMigrationFiles.length && !target.externalEvidence.appliedMigrations.length;
    if (name === 'tests') return !target.externalEvidence.conventionalTests.length;
    return true;
  });
}
const externalProductionTruth = productionTruth ? {
  source:path.relative(root,productionTruthPath),
  capturedAt:productionTruth.capturedAt,
  repositoryRevision:productionTruth.repository.revision,
  repositoryMigrationFiles:productionTruth.repository.migrationFiles.count,
  appliedMigrations:productionTruth.supabase.appliedMigrations.count,
  exactMigrationNameMatches:productionTruth.reconciliation.exactMigrationNameMatches,
  repositoryMigrationsWithoutExactAppliedName:productionTruth.reconciliation.repositoryMigrationsWithoutExactAppliedName.count,
  appliedMigrationsWithoutExactRepositoryName:productionTruth.reconciliation.appliedMigrationsWithoutExactRepositoryName.count,
  migrationReconciliationDecision:productionTruth.reconciliation.decision,
  objectLevelMigrationEvidence:{ examinedRepositoryMigrations:productionTruth.reconciliation.objectLevelProductionEvidence.examinedRepositoryMigrations, statusCounts:productionTruth.reconciliation.objectLevelProductionEvidence.statusCounts, equivalenceDecision:productionTruth.reconciliation.objectLevelProductionEvidence.equivalenceDecision },
  conventionalTests:productionTruth.repository.verificationArtifacts.conventionalTests.count,
  gatesAuditsSmokes:productionTruth.repository.verificationArtifacts.gatesAuditsSmokes.count,
  publicTables:productionTruth.supabase.publicTables,
  registrationGate:productionTruth.supabase.registrationGate,
  securityAdvisors:productionTruth.supabase.securityAdvisors,
  unassignedExternalEvidence
} : null;
const manifest = { id:'pantavion_canonical_semantic_v3', generatedAt:new Date().toISOString(), sourceManifest:input.manifest && input.manifest.id, sourceFingerprint:input.manifest && input.manifest.corpusFingerprint, recordCount:records.length, preservedRecordCount:before.length, idFingerprint:fingerprint(records), counts, reviewReasonSummary, moduleSummary, externalProductionTruth, completion:{ complete:!counts.REVIEW_REQUIRED, semanticallyClassified:counts.SEMANTICALLY_CLASSIFIED || 0, preservedRecursiveArtifacts:counts.PRESERVED_RECURSIVE_ARTIFACT || 0, reviewRequired:counts.REVIEW_REQUIRED || 0 }, truthRule:'No record is final, mergeable, deletable, implemented, deployed, or live merely because deterministic routing succeeded. Semantic review and implementation evidence remain mandatory.' };
fs.mkdirSync(outRoot,{recursive:true});
fs.writeFileSync(path.join(outRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const ledgerPath = path.join(outRoot,'semantic-ledger.ndjson');
const ledgerFd = fs.openSync(ledgerPath,'w');
try {
  for (const record of records) fs.writeSync(ledgerFd,JSON.stringify(record)+'\n');
} finally {
  fs.closeSync(ledgerFd);
}
fs.writeFileSync(path.join(outRoot,'module-gap-map.json'),JSON.stringify(moduleSummary,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
