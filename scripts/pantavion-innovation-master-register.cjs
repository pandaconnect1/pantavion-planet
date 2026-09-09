const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const corpusPath = path.join(root, 'data', 'recovery', 'canonical-knowledge-v2', 'full-corpus.json');
const founderPath = path.join(root, 'data', 'runtime-reports', 'latest-founder-vision-ingestion.json');
const unfinishedPath = path.join(root, 'data', 'runtime-reports', 'latest-unfinished-plan-ingestion.json');
const externalSignalPath = path.join(root, 'docs', 'recovery', 'PANTAVION_EXTERNAL_SIGNAL_ABSORPTION_2026-09-09.md');
const outDir = path.join(root, 'data', 'recovery', 'innovation-master-register');

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }
function readJson(file) { if (!fs.existsSync(file)) return null; return JSON.parse(fs.readFileSync(file, 'utf8')); }
function normalize(text) { return String(text || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim(); }
function evidenceSignal(text) {
  return /(must|shall|should|needs?|requires?|support|enable|allow|produce|generate|create|compose|route|adapt|detect|translate|preserve|recover|verify|govern|orchestrat|invent|absorb|replace|fallback|offline|satellite|trusted|relationship|personal ai|agent|kernel|guardian|memory|continuity|sos|emergency|contact|message|email|voice|video|signal|device|workflow|service|application|program|intent|evidence|benchmark|rollback|provenance|provider-neutral)/i.test(text);
}
function statusSignal(text) {
  if (/verified[_ -]?live|production verified/i.test(text)) return 'VERIFIED_LIVE_EVIDENCE_CLAIM';
  if (/deployed|backend[_ -]?live/i.test(text)) return 'IMPLEMENTATION_EVIDENCE_CLAIM';
  if (/prototype|partial|planned|future|missing|blocked|not yet|stub|foundation|spec/i.test(text)) return 'EARLY_OR_PARTIAL';
  return 'UNASSESSED';
}

const families = [
  ['AI_ORCHESTRATION', /pantaai|personal ai|prime brain|specialist brain|agent|kernel|orchestrat|router|multi-brain/i],
  ['DYNAMIC_APP_SERVICE_CREATION', /produce applications|programs|workflows|services|app service engine|build factory|foundry|blueprint|intent-to-capability/i],
  ['INVENTION_EVOLUTION', /invention|discover.*research.*prototype|simulate|benchmark|improve|self.?evolv|evolution|adversarial truth/i],
  ['PRODUCT_TECH_ABSORPTION', /product absorption|alternate provider|open standard|self-hosted|pantavion-native|replace.*provider|provider-neutral|capability mesh/i],
  ['PEOPLE_RELATIONSHIP_GRAPH', /people|relationship|trusted contact|companion|friend|guardian|profile|nearby/i],
  ['UNIFIED_COMMUNICATION', /contact|message|email|chat|voice|video|conversation|communication/i],
  ['TRANSLATION_LANGUAGE', /translation|interpreter|language|dialect|subtitle|speech|stt|tts|7000/i],
  ['SOS_CRISIS_RESILIENCE', /sos|emergency|crisis|satellite|offline|sms|mms|radio|trusted contact|fallback/i],
  ['IDENTITY_TRUST_SECURITY', /identity|auth|consent|permission|trust|verification|passkey|session|security/i],
  ['MEMORY_CONTINUITY', /memory|continuity|thread|context|history|provenance/i],
  ['GLOBAL_POLICY_JURISDICTION', /country|jurisdiction|policy|legal|age|minor|guardian|consent/i],
  ['DEVICE_INFRASTRUCTURE', /device|mobile|desktop|tablet|iot|physical-machine|low-data|constrained/i],
  ['MARKET_WORK_BUSINESS', /marketplace|work|business|job|service|income|commerce|ads|seo|visibility|growth/i],
  ['LEARNING_KNOWLEDGE', /learning|education|knowledge|research|library|source verification|critical-thinking/i],
  ['MEDIA_CREATION', /music|media|studio|creator|image|audio|video generation/i],
];
function classifyFamily(text) { const matches = families.filter(([, re]) => re.test(text)).map(([name]) => name); return matches.length ? matches : ['UNCLASSIFIED']; }

const sourceRows = [];
const corpus = readJson(corpusPath);
if (corpus && Array.isArray(corpus.records)) {
  for (const r of corpus.records) {
    const text = `${r.text || ''}\n${r.context || ''}`.trim();
    if (!text || !evidenceSignal(text)) continue;
    sourceRows.push({ sourceKind: 'canonical-knowledge-v2', sourceId: r.id, sourceFile: r.provenance?.sourceFile || null, sourceLine: r.provenance?.sourceLine || null, sourceFamily: r.provenance?.sourceFamily || null, text, existingModule: r.classification?.module || null, existingReviewStatus: r.reviewStatus || null });
  }
}
for (const [kind, file, json] of [
  ['founder-vision-ingestion', founderPath, readJson(founderPath)],
  ['unfinished-plan-ingestion', unfinishedPath, readJson(unfinishedPath)],
]) {
  if (!json || !Array.isArray(json.findings)) continue;
  for (const f of json.findings) {
    const text = String(f.text || '').trim();
    if (!text || !evidenceSignal(text)) continue;
    sourceRows.push({ sourceKind: kind, sourceId: `${kind}:${f.file || 'unknown'}:${f.line || 0}`, sourceFile: f.file || null, sourceLine: f.line || null, sourceFamily: kind, text, existingModule: null, existingReviewStatus: null });
  }
}

// External research signals are deliberately isolated from founder/recovered evidence.
// They may improve comparison and synthesis, but cannot establish Pantavion origin or novelty.
if (fs.existsSync(externalSignalPath)) {
  const lines = fs.readFileSync(externalSignalPath, 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const text = line.replace(/^[-*]\s+/, '').trim();
    if (!text || text.startsWith('#') || !evidenceSignal(text)) return;
    sourceRows.push({
      sourceKind: 'external-signal-synthesis',
      sourceId: `external-signal:${index + 1}`,
      sourceFile: path.relative(root, externalSignalPath),
      sourceLine: index + 1,
      sourceFamily: 'EXTERNAL_SIGNAL_SYNTHESIS',
      text,
      existingModule: null,
      existingReviewStatus: 'RESEARCH_INPUT_ONLY',
    });
  });
}

const exact = new Map();
const candidates = [];
for (const row of sourceRows) {
  const norm = normalize(row.text);
  if (norm.length < 20) continue;
  const fingerprint = hash(norm);
  if (exact.has(fingerprint)) { exact.get(fingerprint).evidence.push(row); continue; }
  const externalOnly = row.sourceKind === 'external-signal-synthesis';
  const record = {
    innovationId: `pin_${fingerprint.slice(0, 20)}`,
    normalizedFingerprint: fingerprint,
    title: null,
    atomicMechanism: row.text.slice(0, 700),
    families: classifyFamily(row.text),
    evidenceStatus: statusSignal(row.text),
    originStatus: externalOnly ? 'EXTERNAL_SIGNAL_ONLY' : 'PANTAVION_EVIDENCE_PRESENT',
    noveltyStatus: 'UNVERIFIED_PRIOR_ART_REQUIRED',
    noveltyClaimAllowed: false,
    duplicateStatus: 'UNIQUE_TEXT_NOT_SEMANTICALLY_PROVEN_UNIQUE',
    evidence: [row],
    nextAction: externalOnly
      ? 'Find matching recovered Pantavion evidence, then perform semantic atomization and prior-art comparison.'
      : 'Semantic atomization + prior-art comparison required before any novelty claim.',
  };
  exact.set(fingerprint, record);
  candidates.push(record);
}

candidates.sort((a, b) => { const f = a.families.join(',').localeCompare(b.families.join(',')); return f || a.innovationId.localeCompare(b.innovationId); });
const familyCounts = {};
for (const c of candidates) for (const family of c.families) familyCounts[family] = (familyCounts[family] || 0) + 1;
const manifest = {
  id: 'pantavion_innovation_master_register_v1',
  generatedAt: new Date().toISOString(),
  truthRule: 'This register extracts evidence-backed innovation candidates and isolated external research signals. It does NOT declare novelty, world-first status, patentability, production readiness, Pantavion origin for external-only signals, or semantic uniqueness.',
  inputs: {
    canonicalKnowledgeV2: fs.existsSync(corpusPath),
    founderVisionIngestion: fs.existsSync(founderPath),
    unfinishedPlanIngestion: fs.existsSync(unfinishedPath),
    externalSignalSynthesis: fs.existsSync(externalSignalPath),
  },
  totals: { sourceRows: sourceRows.length, exactDeduplicatedCandidates: candidates.length, familyCounts },
  requiredNextStages: ['SEMANTIC_ATOMIZATION','SEMANTIC_DEDUPLICATION','CAPABILITY_MAPPING','MATURITY_EVIDENCE_REVIEW','GLOBAL_PRIOR_ART_RESEARCH','NOVELTY_SCORING','PRESEED_SELECTION'],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'innovation-master-register.json'), JSON.stringify({ manifest, candidates }, null, 2) + '\n');
const csvEscape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
const rows = [['innovation_id','families','evidence_status','origin_status','novelty_status','source_count','source_files','atomic_mechanism']];
for (const c of candidates) rows.push([c.innovationId,c.families.join('|'),c.evidenceStatus,c.originStatus,c.noveltyStatus,c.evidence.length,[...new Set(c.evidence.map(e => e.sourceFile).filter(Boolean))].join('|'),c.atomicMechanism]);
fs.writeFileSync(path.join(outDir, 'innovation-master-register.csv'), rows.map(r => r.map(csvEscape).join(',')).join('\n') + '\n');
console.log(JSON.stringify(manifest, null, 2));
