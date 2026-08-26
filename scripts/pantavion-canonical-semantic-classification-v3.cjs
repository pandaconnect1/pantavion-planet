const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const generatedInputPath = path.join(root, 'data/recovery/canonical-knowledge-v2/full-corpus.json');
const committedCorpusRoot = path.join(root, 'data/recovery/imported-pr248/canonical-ledger/corpus');
const outRoot = path.join(root, 'data/recovery/canonical-semantic-v3');

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
  if (f.startsWith('scripts ') || f.startsWith(' github ')) return 'automation';
  if (f.startsWith('docs ') || file.endsWith('.md')) return 'requirement-document';
  if (f.startsWith('data ')) return 'data-artifact';
  return 'implementation';
}
function classify(record) {
  const module = record.classification && record.classification.module;
  const text = normalize([record.provenance && record.provenance.sourceFile, record.text, record.context].join('\n'));
  const subsystems = ontology[module] ? rank(ontology[module], text) : [];
  const capabilityRanks = rank(capabilities, text);
  const subsystem = subsystems[0] ? subsystems[0].name : null;
  const capability = capabilityRanks[0] ? capabilityRanks[0].name : null;
  const artifact = artifactType((record.provenance && record.provenance.sourceFile) || '', text);
  const subsystemConflict = subsystems.length > 1 && subsystems[0].score === subsystems[1].score;
  const capabilityConflict = capabilityRanks.length > 1 && capabilityRanks[0].score === capabilityRanks[1].score;
  const competingModules = Object.entries(ontology).map(([name,groups]) => {
    const rankedSubsystems = rank(groups, text);
    return {
      name,
      score: rankedSubsystems.reduce((sum,item) => sum + item.score, 0),
      strongestSubsystemScore: rankedSubsystems[0] ? rankedSubsystems[0].score : 0,
      evidence: rankedSubsystems.flatMap(item => item.evidence).slice(0,12)
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
  return { ...record, classification: { ...record.classification, subsystem, capability, feature: subsystem && capability ? subsystem + '.' + capability + '.' + artifact : null, artifactType: artifact, canonicalTarget: deterministic ? 'canonical/' + module + '/' + subsystem + '/' + capability : null, classificationMethod: 'semantic-v3-strict-evidence-ontology', classificationEvidence: { subsystem: subsystems.slice(0,3), capability: capabilityRanks.slice(0,3), competingModules: competingModules.slice(0,3) } }, reviewStatus: deterministic ? 'SEMANTICALLY_CLASSIFIED' : 'REVIEW_REQUIRED', semanticDecision: deterministic ? 'ROUTE_CANDIDATE' : 'HOLD', semanticReviewReasons: reasons };
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
for (const r of records) {
  const module = r.classification.module || 'UNCLASSIFIED';
  const target = moduleSummary[module] ||= { total:0, classified:0, reviewRequired:0, subsystems:{}, capabilities:{} };
  target.total++;
  if (r.reviewStatus === 'SEMANTICALLY_CLASSIFIED') target.classified++; else target.reviewRequired++;
  if (r.classification.subsystem) target.subsystems[r.classification.subsystem] = (target.subsystems[r.classification.subsystem] || 0) + 1;
  if (r.classification.capability) target.capabilities[r.classification.capability] = (target.capabilities[r.classification.capability] || 0) + 1;
}
const manifest = { id:'pantavion_canonical_semantic_v3', generatedAt:new Date().toISOString(), sourceManifest:input.manifest && input.manifest.id, sourceFingerprint:input.manifest && input.manifest.corpusFingerprint, recordCount:records.length, preservedRecordCount:before.length, idFingerprint:fingerprint(records), counts, moduleSummary, completion:{ complete:!counts.REVIEW_REQUIRED, semanticallyClassified:counts.SEMANTICALLY_CLASSIFIED || 0, reviewRequired:counts.REVIEW_REQUIRED || 0 }, truthRule:'No record is final, mergeable, deletable, implemented, deployed, or live merely because deterministic routing succeeded. Semantic review and implementation evidence remain mandatory.' };
fs.mkdirSync(outRoot,{recursive:true});
fs.writeFileSync(path.join(outRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(outRoot,'semantic-ledger.json'),JSON.stringify({manifest,records},null,2)+'\n');
fs.writeFileSync(path.join(outRoot,'module-gap-map.json'),JSON.stringify(moduleSummary,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
