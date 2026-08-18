const fs = require('fs');
const path = require('path');

const root = process.cwd();
const corpusPath = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'full-corpus.json');
const insightPath = path.join(root, 'data', 'recovery', 'external-learning', '20260818-ai-screenshot-insights.json');
const outRoot = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'photo-marriage');

if (!fs.existsSync(corpusPath)) throw new Error('Run npm run knowledge:excavate:v2 first; full-corpus.json is missing.');
if (!fs.existsSync(insightPath)) throw new Error('Screenshot insight registry is missing.');

const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
const insightRegistry = JSON.parse(fs.readFileSync(insightPath, 'utf8'));
const records = Array.isArray(corpus.records) ? corpus.records : [];
const insights = Array.isArray(insightRegistry.insights) ? insightRegistry.insights : [];

function norm(v) { return String(v || '').toLowerCase(); }
function termScore(text, term) {
  const t = norm(term);
  const hay = norm(text);
  if (!t || !hay.includes(t)) return 0;
  return t.includes(' ') ? 3 : 1;
}

function matchInsight(record, insight) {
  const c = record.classification || {};
  const module = String(c.module || '');
  const targetHit = (insight.targets || []).includes(module);
  const text = [record.text, record.context, module, c.productDomain, c.subsystem, c.capability, c.feature, ...(record.notes || [])].filter(Boolean).join('\n');
  const termHits = (insight.terms || []).map(term => ({ term, score: termScore(text, term) })).filter(x => x.score > 0);
  const termScoreTotal = termHits.reduce((a,b) => a + b.score, 0);
  const score = (targetHit ? 5 : 0) + termScoreTotal;
  if (score < 5) return null;
  return {
    insightId: insight.id,
    insightTitle: insight.title,
    score,
    targetHit,
    matchedTerms: termHits.map(x => x.term),
    proposedDecision: insight.action,
    rationale: insight.notes,
    reviewStatus: score >= 8 ? 'MATCHED_REVIEW_REQUIRED' : 'CANDIDATE_REVIEW_REQUIRED'
  };
}

const enriched = records.map(record => {
  const augmentationMatches = insights.map(insight => matchInsight(record, insight)).filter(Boolean).sort((a,b) => b.score-a.score);
  return { ...record, augmentationMatches };
});

const moduleIndex = {};
const insightIndex = {};
let matchedRecords = 0;
for (const r of enriched) {
  if (r.augmentationMatches.length) matchedRecords += 1;
  const module = r.classification?.module || 'UNCLASSIFIED';
  if (!moduleIndex[module]) moduleIndex[module] = { recordCount: 0, matchedRecordCount: 0, insights: {} };
  moduleIndex[module].recordCount += 1;
  if (r.augmentationMatches.length) moduleIndex[module].matchedRecordCount += 1;
  for (const m of r.augmentationMatches) {
    moduleIndex[module].insights[m.insightId] = (moduleIndex[module].insights[m.insightId] || 0) + 1;
    if (!insightIndex[m.insightId]) insightIndex[m.insightId] = { title: m.insightTitle, matchedRecordCount: 0, modules: {} };
    insightIndex[m.insightId].matchedRecordCount += 1;
    insightIndex[m.insightId].modules[module] = (insightIndex[m.insightId].modules[module] || 0) + 1;
  }
}

fs.mkdirSync(outRoot, { recursive: true });
fs.writeFileSync(path.join(outRoot, 'full-corpus-married.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  sourceCorpusFingerprint: corpus.manifest?.corpusFingerprint || null,
  insightRegistryId: insightRegistry.id,
  truthRule: 'Every match is a review candidate. No screenshot-derived learning may overwrite recovered requirements, bypass provenance, or mark a capability live. Semantic review and current-code comparison remain mandatory.',
  records: enriched
}, null, 2) + '\n');
fs.writeFileSync(path.join(outRoot, 'crosswalk.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  totalRecords: records.length,
  matchedRecords,
  unmatchedRecords: records.length - matchedRecords,
  moduleIndex,
  insightIndex
}, null, 2) + '\n');

const batchDir = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'batches');
const outBatchDir = path.join(outRoot, 'batches');
fs.mkdirSync(outBatchDir, { recursive: true });
if (fs.existsSync(batchDir)) {
  for (const file of fs.readdirSync(batchDir).filter(f => f.endsWith('.json')).sort()) {
    const batch = JSON.parse(fs.readFileSync(path.join(batchDir, file), 'utf8'));
    const ids = new Set((batch.records || []).map(r => r.id));
    const batchRecords = enriched.filter(r => ids.has(r.id));
    fs.writeFileSync(path.join(outBatchDir, file), JSON.stringify({ checkpoint: batch.checkpoint, records: batchRecords }, null, 2) + '\n');
  }
}

console.log(JSON.stringify({ totalRecords: records.length, matchedRecords, insightCount: insights.length, output: path.relative(root, outRoot) }, null, 2));
