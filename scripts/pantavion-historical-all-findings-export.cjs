#!/usr/bin/env node
// Read-only, lossless historical findings index. Run from repository root.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const sources = [
  ['founder-vision', 'data/runtime-reports/latest-founder-vision-ingestion.json'],
  ['unfinished-plan', 'data/runtime-reports/latest-unfinished-plan-ingestion.json']
];
const out = path.join(root, 'artifacts', 'ecosystem-discovery');
fs.mkdirSync(out, { recursive: true });
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const rows = [], missing = [], counts = {};
for (const [family, rel] of sources) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) { missing.push(rel); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const findings = Array.isArray(data.findings) ? data.findings : [];
  counts[family] = { reported: data.totals?.findings ?? null, loaded: findings.length, source: rel };
  findings.forEach((item, index) => {
    const original = { ...item };
    const fingerprint = hash(JSON.stringify([item.file ?? '', item.line ?? '', item.text ?? '']));
    rows.push({ id: family + ':' + String(index + 1).padStart(6, '0'), family, source: rel, fingerprint, original, canonicalStatus: 'unreviewed', productionVerified: false });
  });
}
const groups = new Map();
for (const row of rows) {
  const group = groups.get(row.fingerprint) ?? { fingerprint: row.fingerprint, occurrences: [], candidate: null, review: 'required' };
  group.occurrences.push(row.id);
  groups.set(row.fingerprint, group);
}
const provenance = {
  schema: 'pantavion-historical-excavation-inventory-v1',
  generatedAt: new Date().toISOString(),
  truth: 'Preserves every loaded historical record. Matching fingerprints are candidate duplicates only; no historical record is deleted. No production verification implied.',
  counts, totalLoaded: rows.length, candidateUniqueFingerprints: groups.size, missingSources: missing,
  otherSourcesRequiringSeparateIntake: [
    'data/recovery/imported-pr248/deep-analysis/manifest.json',
    'docs/recovery/RECOVERY_STATE_MANIFEST.json',
    'data/recovery/canonical-knowledge-v2/full-corpus.json',
    'data/recovery/imported-pr248/canonical-ledger/corpus'
  ]
};
fs.writeFileSync(path.join(out, 'historical-all-findings.json'), JSON.stringify({ ...provenance, findings: rows }, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'historical-candidate-duplicates.json'), JSON.stringify([...groups.values()], null, 2) + '\n');
fs.writeFileSync(path.join(out, 'historical-inventory-summary.json'), JSON.stringify(provenance, null, 2) + '\n');
console.log(JSON.stringify(provenance, null, 2));
if (missing.length) process.exitCode = 2;
