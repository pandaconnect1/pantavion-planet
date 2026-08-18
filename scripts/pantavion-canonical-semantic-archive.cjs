const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const sourcePath = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'photo-marriage', 'full-corpus-married.json');
const outRoot = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'semantic-archive');
if (!fs.existsSync(sourcePath)) throw new Error('Run excavation + screenshot marriage first.');

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const records = Array.isArray(source.records) ? source.records : [];

const topicRules = [
  ['identity-auth', ['auth','authentication','session','passkey','aal2','signup','login']],
  ['consent-permissions', ['consent','permission','privacy','entitlement','access mode']],
  ['profiles-people-graph', ['profile','people','relationship','contact','nearby','graph']],
  ['messaging-realtime', ['message','conversation','chat','realtime','delivery','read receipt','secret chat']],
  ['translation-language', ['translate','translation','interpreter','language','dialect','subtitle']],
  ['speech-voice-video', ['speech','voice','audio','video','webrtc','microphone','stt','tts']],
  ['personal-ai-agents', ['pantaai','personal ai','assistant','agent','orchestration','workflow planner','tool executor']],
  ['memory-continuity', ['memory','continuity','thread','checkpoint','reminder','working memory']],
  ['kernel-guardian-runtime', ['kernel','guardian','runtime','control plane','durable execution','capability router']],
  ['safety-trust-minors', ['safety','trust','moderation','minor','child','teen','verification','abuse','blocked']],
  ['sos-crisis', ['sos','crisis','emergency','humanitarian','trusted contact']],
  ['social-pulse-community', ['social','pulse','community','post','comment','reaction','feed']],
  ['maps-water-city', ['water','map','gis','dwg','utility','geospatial','city intelligence','segment','zone']],
  ['business-marketplace-ads', ['business','marketplace','listing','job','work','commerce','ads center','income']],
  ['learning-knowledge-research', ['learning','pantalearn','knowledge','research','library','education','source']],
  ['music-media-creator', ['music','lyrics','creator','media','voice studio','image generation','video generation']],
  ['resilience-infrastructure', ['offline','satellite','sms','mms','mesh','failover','resilience','infrastructure']],
  ['provider-routing-economics', ['provider','routing','model','latency','cost','pricing','quota','jurisdiction']],
  ['security-observability-evals', ['security','guardrail','observability','trace','audit','eval','monitor']],
  ['rag-retrieval-vector', ['rag','retrieval','embedding','vector','semantic search','provenance']],
  ['recovery-donor-evolution', ['recovery','recover','donor','historical','deleted','canonical','merge','evolve','supersede']],
];

function norm(v) { return String(v || '').toLowerCase(); }
function slug(v) { return String(v || 'unclassified').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'unclassified'; }
function hash(v) { return crypto.createHash('sha256').update(v).digest('hex'); }
function scoreTopic(text, terms) { return terms.reduce((s,t) => s + (text.includes(t) ? (t.includes(' ') ? 3 : 1) : 0), 0); }
function inferTopics(record) {
  const c = record.classification || {};
  const text = norm([record.text, record.context, record.provenance?.sourceFile, c.module, c.subsystem, c.capability, c.feature, ...(record.notes || []), ...(record.augmentationMatches || []).flatMap(x => [x.insightId,x.insightTitle,...(x.matchedTerms||[])])].filter(Boolean).join('\n'));
  const ranked = topicRules.map(([topic,terms]) => [topic, scoreTopic(text,terms)]).filter(([,s])=>s>0).sort((a,b)=>b[1]-a[1]);
  return ranked.slice(0,4).map(([topic,score]) => ({topic,score}));
}

const enriched = records.map(record => {
  const topics = inferTopics(record);
  const module = record.classification?.module || 'UNCLASSIFIED';
  const primaryTopic = topics[0]?.topic || 'semantic-review-required';
  const needsReview = record.reviewStatus !== 'CLASSIFIED' || module === 'UNCLASSIFIED' || primaryTopic === 'semantic-review-required';
  return {
    ...record,
    archive: {
      module,
      primaryTopic,
      topics,
      archiveState: needsReview ? 'REVIEW_REQUIRED' : 'ARCHIVED_CANDIDATE',
      canonicalPath: `canonical/${slug(module)}/${primaryTopic}`,
      screenshotLearningCount: (record.augmentationMatches || []).length,
    },
  };
});

const byModule = new Map();
const byTopic = new Map();
const byBatch = new Map();
for (const r of enriched) {
  const module = r.archive.module;
  const topic = r.archive.primaryTopic;
  if (!byModule.has(module)) byModule.set(module, []);
  byModule.get(module).push(r);
  if (!byTopic.has(topic)) byTopic.set(topic, []);
  byTopic.get(topic).push(r);
  const batchIndex = Math.floor((Number(r.ordinal || 1)-1)/1499);
  const label = String.fromCharCode(65 + batchIndex);
  if (!byBatch.has(label)) byBatch.set(label, []);
  byBatch.get(label).push(r);
}

fs.mkdirSync(path.join(outRoot,'by-module'), {recursive:true});
fs.mkdirSync(path.join(outRoot,'by-topic'), {recursive:true});
fs.mkdirSync(path.join(outRoot,'batches'), {recursive:true});

for (const [module,list] of [...byModule.entries()].sort()) {
  fs.writeFileSync(path.join(outRoot,'by-module',`${slug(module)}.json`), JSON.stringify({module,recordCount:list.length,records:list},null,2)+'\n');
}
for (const [topic,list] of [...byTopic.entries()].sort()) {
  fs.writeFileSync(path.join(outRoot,'by-topic',`${topic}.json`), JSON.stringify({topic,recordCount:list.length,records:list},null,2)+'\n');
}
for (const [label,list] of [...byBatch.entries()].sort()) {
  const moduleCounts = {}; const topicCounts = {}; const sourceCounts = {};
  for (const r of list) {
    moduleCounts[r.archive.module]=(moduleCounts[r.archive.module]||0)+1;
    topicCounts[r.archive.primaryTopic]=(topicCounts[r.archive.primaryTopic]||0)+1;
    const family=r.provenance?.sourceFamily||'unknown'; sourceCounts[family]=(sourceCounts[family]||0)+1;
  }
  fs.writeFileSync(path.join(outRoot,'batches',`batch-${label.toLowerCase()}-archive.json`), JSON.stringify({
    batchLabel:label,
    startOrdinal:list[0]?.ordinal||0,
    endOrdinal:list.at(-1)?.ordinal||0,
    recordCount:list.length,
    moduleCounts,
    topicCounts,
    sourceCounts,
    unresolvedCount:list.filter(r=>r.archive.archiveState==='REVIEW_REQUIRED').length,
    records:list,
  },null,2)+'\n');
}

const moduleCounts = Object.fromEntries([...byModule.entries()].map(([k,v])=>[k,v.length]));
const topicCounts = Object.fromEntries([...byTopic.entries()].map(([k,v])=>[k,v.length]));
const reviewCount = enriched.filter(r=>r.archive.archiveState==='REVIEW_REQUIRED').length;
const manifest = {
  id:'pantavion_canonical_semantic_archive_v1',
  generatedAt:new Date().toISOString(),
  totalRecords:enriched.length,
  totalBatches:byBatch.size,
  moduleCounts,
  topicCounts,
  archivedCandidateCount:enriched.length-reviewCount,
  reviewRequiredCount:reviewCount,
  fingerprint:hash(enriched.map(r=>`${r.id}:${r.archive.canonicalPath}`).join('\n')),
  truthRule:'Archive placement is a deterministic semantic candidate, never a merge/completion claim. REVIEW_REQUIRED items require deeper review before canonical implementation.',
};
fs.writeFileSync(path.join(outRoot,'archive-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify(manifest,null,2));
