const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const outRoot = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2');
const batchSize = 1499;

const sourceSpecs = [
  { family: 'founder-vision', roots: ['data/founder-vision-vault', 'docs', 'app', 'core', 'scripts'] },
  { family: 'unfinished-gap', roots: ['data/runtime-reports', 'docs', 'app', 'core', 'scripts', '.github'] },
  { family: 'recovery', roots: ['docs/recovery', 'core/recovery', 'data/recovery', 'PANTAVION_MASTER_RECOVERY_HANDOFF_20260810.md'] },
  { family: 'donor', roots: ['core/recovery', 'data/pantavion-source-inventory', 'docs/recovery'] },
  { family: 'current-code', roots: ['app', 'core', 'services', 'scripts'] },
  { family: 'live-state', roots: ['docs/recovery/LIVE_COMPLETION_MAP.md', 'PANTAVION_LIVE_COMPLETION_MAP_20260810.md', 'core/product'] },
];

const allowedExtensions = new Set(['.md','.txt','.json','.ts','.tsx','.js','.jsx','.cjs','.mjs','.yml','.yaml','.html']);
const blockedRoots = ['.next','node_modules','data/water-network-private','data/recovery/canonical-knowledge','data/recovery/canonical-knowledge-v2'];

const modules = [
  ['Personal AI / PantaAI', ['personal ai','personal assistant','pantaai','assistant','agent','agents','memory','personal_memory','goals','workflow planner','tool executor']],
  ['People', ['people','profile','profiles','relationship','relationships','nearby','contact','contacts','identity','discover']],
  ['Chat', ['chat','message','messages','conversation','conversations','realtime','read receipt','delivery state','secret chat']],
  ['Interpreter / Translation', ['translation','translate','translator','interpreter','language','dialect','subtitle','stt','tts','speech-to-text','text-to-speech']],
  ['Voice / Video', ['voice','audio','video','call','calling','microphone','webrtc']],
  ['Social / Pulse / Communities', ['social','pulse','community','communities','post','posts','comment','reaction','feed']],
  ['Safety / Trust / Minors', ['safety','moderation','minor','minors','child','teen','guardian','trust','verification','abuse','blocked','approval']],
  ['SOS / Crisis', ['sos','crisis','emergency','trusted contact','incident','humanitarian']],
  ['Maps / World / Water', ['map','maps','gis','water','utility','dwg','location','gps','geospatial','city intelligence']],
  ['Marketplace / Work / Business', ['marketplace','work','business','job','jobs','listing','commerce','income','ads center']],
  ['Learning / Knowledge', ['education','learning','pantalearn','knowledge','research','library']],
  ['Music / Media / Creation', ['music','media','voice studio','lyrics','creator','creation','image','video generation','audio generation']],
  ['Kernel / Guardian / Runtime', ['kernel','guardian','durable execution','runtime','control plane','orchestration','router','provider routing','capability registry']],
  ['Identity / Auth / Consent', ['auth','authentication','identity','consent','permission','permissions','session','passkey','aal2']],
  ['Resilience / Offline / Infrastructure', ['offline','satellite','sms','mms','mesh','failover','resilience','redundancy','continuity','infrastructure']],
];

function normalize(value) { return value.replace(/\\/g, '/'); }
function blocked(rel) { const n = normalize(rel); return blockedRoots.some(x => n === x || n.startsWith(x + '/')); }

function walk(target) {
  const abs = path.join(root, target);
  if (!fs.existsSync(abs)) return [];
  const stat = fs.statSync(abs);
  if (stat.isFile()) return allowedExtensions.has(path.extname(abs)) ? [normalize(target)] : [];
  const out = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = normalize(path.join(target, entry.name));
    if (blocked(rel)) continue;
    if (entry.isDirectory()) out.push(...walk(rel));
    else if (allowedExtensions.has(path.extname(entry.name))) out.push(rel);
  }
  return out;
}

function hash(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
function stableId(family,file,start,text) { return `pk_${hash([family,file,start,text].join('\u001f')).slice(0,24)}`; }
function inferLayer(file) {
  if (file.startsWith('app/api/')) return 'API';
  if (file.startsWith('app/')) return 'UI';
  if (file.includes('/kernel/') || file.startsWith('core/kernel/')) return 'KERNEL';
  if (file.includes('/runtime/')) return 'RUNTIME';
  if (file.startsWith('services/')) return 'SERVICE';
  if (file.startsWith('data/')) return 'DATA';
  if (file.startsWith('scripts/') || file.startsWith('.github/')) return 'SCRIPT';
  if (/(__tests__|\.test\.|\.spec\.)/.test(file)) return 'TEST';
  if (file.includes('recovery')) return 'RECOVERY';
  if (file.startsWith('docs/') || file.endsWith('.md')) return 'DOCS';
  return 'UNKNOWN';
}

function scoreModules(text) {
  const lower = text.toLowerCase();
  const scores = modules.map(([name, terms]) => [name, terms.reduce((sum, term) => sum + (lower.includes(term) ? (term.includes(' ') ? 3 : 1) : 0), 0)]).filter(([,s]) => s > 0).sort((a,b) => b[1]-a[1]);
  return scores;
}

function classification(file, context) {
  const scores = scoreModules(context);
  const primary = scores[0] || null;
  const second = scores[1] || null;
  const confident = primary && (!second || primary[1] >= second[1] + 2 || primary[1] >= 4);
  const module = primary ? primary[0] : null;
  const liveWords = /verified[_ -]?live|deployed|backend[_ -]?live/i.test(context);
  const partialWords = /todo|fixme|planned|future|missing|blocked|not yet|stub|skeleton|provider_pending|requires/i.test(context);
  return {
    topicFamily: module,
    productDomain: module,
    module,
    subsystem: null,
    capability: null,
    feature: null,
    layer: inferLayer(file),
    recoveryState: partialWords ? 'PARTIAL' : 'UNCLASSIFIED',
    decision: 'INVESTIGATE',
    liveState: liveWords ? 'DEPLOYED' : partialWords ? 'BACKEND_PARTIAL' : 'UNCLASSIFIED',
    canonicalTarget: module ? `canonical-module:${module}` : null,
    owningKernel: module === 'Kernel / Guardian / Runtime' ? 'Prime Kernel / Guardian' : null,
    guardianLane: /safety|trust|minor|guardian|security|approval|abuse/i.test(context) ? 'safety-governance-review' : null,
    agentLane: module === 'Personal AI / PantaAI' ? 'personal-ai-orchestration' : null,
    blockers: [],
    nextAction: confident ? 'Compare with same-module records and current canonical implementation before merge/evolve decision.' : 'Semantic review required; do not merge or deduplicate.',
    _scores: scores.slice(0,5),
    _confident: Boolean(confident),
  };
}

function paragraphs(content) {
  const lines = content.split(/\r?\n/);
  const out = [];
  let start = 1, buffer = [];
  function flush() {
    const text = buffer.join('\n').trim();
    if (text) out.push({ startLine: start, text: text.slice(0,4000) });
    buffer = [];
  }
  for (let i=0;i<lines.length;i++) {
    const line = lines[i];
    if (!line.trim()) { flush(); start = i+2; continue; }
    if (!buffer.length) start = i+1;
    buffer.push(line);
    if (buffer.join('\n').length > 3000) { flush(); start = i+2; }
  }
  flush();
  return out;
}

const seen = new Set();
const records = [];
for (const spec of sourceSpecs) {
  const files = [...new Set(spec.roots.flatMap(walk))].sort();
  for (const file of files) {
    let content; try { content = fs.readFileSync(path.join(root,file),'utf8'); } catch { continue; }
    for (const p of paragraphs(content)) {
      const scores = scoreModules(p.text);
      const gapSignal = /todo|fixme|planned|future|missing|blocked|not yet|stub|skeleton|requires|provider_pending/i.test(p.text);
      const recoverySignal = /recover|recovery|historical|deleted|donor|canonical|merge|evolve|supersede/i.test(p.text);
      if (!scores.length && !gapSignal && !recoverySignal) continue;
      const key = `${spec.family}|${file}|${p.startLine}|${p.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const c = classification(file,p.text);
      const scoreNotes = c._scores.map(([name,score]) => `${name}:${score}`);
      const confident = c._confident;
      delete c._scores; delete c._confident;
      records.push({
        id: stableId(spec.family,file,p.startLine,p.text),
        ordinal: 0,
        provenance: { sourceFamily: spec.family, sourceFile: file, sourceLine: p.startLine, sourceRef: process.env.GITHUB_SHA || 'working-tree', sourceCommit: process.env.GITHUB_SHA || null, sourceReport: null },
        marker: null,
        text: p.text.slice(0,1000),
        context: p.text,
        classification: c,
        relations: [],
        reviewStatus: confident ? 'CLASSIFIED' : 'REVIEW_REQUIRED',
        notes: scoreNotes,
      });
    }
  }
}

records.sort((a,b) => {
  const m = String(a.classification.module || 'ZZZ').localeCompare(String(b.classification.module || 'ZZZ'));
  if (m) return m;
  const f = a.provenance.sourceFile.localeCompare(b.provenance.sourceFile); if (f) return f;
  return (a.provenance.sourceLine||0)-(b.provenance.sourceLine||0);
});
records.forEach((r,i) => r.ordinal = i+1);

// Relation-map exact and near-thematic evolution before any merge decision.
const lastByModule = new Map();
const exactByText = new Map();
for (const r of records) {
  const exact = hash(r.text.toLowerCase().replace(/\s+/g,' ').trim());
  if (exactByText.has(exact)) r.relations.push({ type:'DUPLICATE_EXACT', targetId: exactByText.get(exact), rationale:'Normalized source text is exact-match equivalent.', confidence:1 });
  else exactByText.set(exact,r.id);
  const mod = r.classification.module;
  if (mod && lastByModule.has(mod)) r.relations.push({ type:'RELATED_TO', targetId:lastByModule.get(mod), rationale:`Same canonical module family: ${mod}. Requires semantic evolution review before merge.`, confidence:0.6 });
  if (mod) lastByModule.set(mod,r.id);
}

fs.mkdirSync(outRoot,{recursive:true});
const fingerprint = hash(records.map(r=>r.id).join('\n'));
const sourceCounts = {}; const moduleCounts = {}; const reviewCounts = {};
for (const r of records) {
  sourceCounts[r.provenance.sourceFamily]=(sourceCounts[r.provenance.sourceFamily]||0)+1;
  const m=r.classification.module||'UNCLASSIFIED'; moduleCounts[m]=(moduleCounts[m]||0)+1;
  reviewCounts[r.reviewStatus]=(reviewCounts[r.reviewStatus]||0)+1;
}
const batches=[];
for (let off=0,index=0;off<records.length;off+=batchSize,index++) {
  const slice=records.slice(off,off+batchSize); const label=String.fromCharCode(65+(index%26))+(index>=26?String(Math.floor(index/26)+1):'');
  const mods={}; const sources={};
  for(const r of slice){const m=r.classification.module||'UNCLASSIFIED';mods[m]=(mods[m]||0)+1;sources[r.provenance.sourceFamily]=(sources[r.provenance.sourceFamily]||0)+1;}
  const checkpoint={batchId:`batch-${label.toLowerCase()}`,batchLabel:label,startOrdinal:slice[0]?.ordinal||0,endOrdinal:slice.at(-1)?.ordinal||0,recordCount:slice.length,sourceCounts:sources,moduleCounts:mods,classifiedCount:slice.filter(r=>r.reviewStatus==='CLASSIFIED').length,unresolvedCount:slice.filter(r=>r.reviewStatus!=='CLASSIFIED').length,crossBatchRelationCount:0,generatedAt:new Date().toISOString(),corpusFingerprint:fingerprint};
  batches.push(checkpoint);
  fs.mkdirSync(path.join(outRoot,'batches'),{recursive:true});
  fs.writeFileSync(path.join(outRoot,'batches',`batch-${label.toLowerCase()}.json`),JSON.stringify({checkpoint,records:slice},null,2)+'\n');
}
const manifest={id:'pantavion_canonical_knowledge_v2',generatedAt:new Date().toISOString(),totalRecords:records.length,batchSize,totalBatches:batches.length,corpusFingerprint:fingerprint,sourceCounts,moduleCounts,reviewCounts,batches,truthRule:'Module classification is an intake seed. REVIEW_REQUIRED records must receive semantic human/AI review; no feature may be merged, deduplicated or called complete from keyword/thematic scoring alone.'};
fs.writeFileSync(path.join(outRoot,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(outRoot,'full-corpus.json'),JSON.stringify({manifest,records},null,2)+'\n');
console.log(JSON.stringify({totalRecords:records.length,totalBatches:batches.length,sourceCounts,moduleCounts,reviewCounts,fingerprint},null,2));
