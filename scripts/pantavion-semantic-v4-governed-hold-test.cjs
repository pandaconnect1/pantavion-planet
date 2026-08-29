const fs = require('fs');
const readline = require('readline');

const registryPath = 'data/recovery/governed-hold-resolution-v4.json';
const ledgerPath = 'data/recovery/canonical-semantic-v3/semantic-ledger.ndjson';

if (!fs.existsSync(registryPath)) throw new Error('Governed HOLD registry missing');
if (!fs.existsSync(ledgerPath)) throw new Error('Semantic ledger missing; run classifier first');

const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
if (registry.schemaVersion !== 4 || registry.id !== 'pantavion_governed_hold_resolution_v4') {
  throw new Error('Unexpected governed HOLD registry identity');
}
if (registry.corpus.records !== 82413) throw new Error('Registry corpus count mismatch');
if (registry.corpus.sourceFingerprint !== '99ff942f154e3dac6298488923e15436c9ebf652b64bc14bcfb72efc82b22d2d') throw new Error('Registry source fingerprint mismatch');
if (registry.corpus.orderedIdFingerprint !== 'd796a55c548655fda8b1014f4db810a7cf7b5f1aef8c7441b985faa8baa00b51') throw new Error('Registry ordered-ID fingerprint mismatch');

const byPath = new Map();
for (const item of registry.dispositions || []) {
  if (!item.sourceFile || byPath.has(item.sourceFile)) throw new Error(`Duplicate/invalid governed source ${item.sourceFile}`);
  if (!Number.isInteger(item.expectedRecords) || item.expectedRecords <= 0) throw new Error(`Invalid expectedRecords for ${item.sourceFile}`);
  if (!item.disposition || !item.canonicalOwner || !item.subsystem || !item.capability || !item.canonicalTarget) throw new Error(`Incomplete governed disposition for ${item.sourceFile}`);
  if (item.executionAuthority !== false) throw new Error(`Governed HOLD must not grant execution authority: ${item.sourceFile}`);
  byPath.set(item.sourceFile, item);
}

const allowedDispositions = new Set([
  'CANONICAL_OWNER',
  'SHARED_SURFACE',
  'SHARED_CONTRACT',
  'SHARED_POLICY',
  'SHARED_UI_CONTRACT',
  'SHARED_READINESS_ENDPOINT',
  'RESEARCH_SIGNAL_SOURCE',
  'RECOVERY_PATCH_SOURCE',
  'LOCKED_CROSS_MODULE_REQUIREMENT',
  'LOCKED_REQUIREMENT',
  'DEVELOPMENT_RUNNER',
  'BUILD_PREPARATION',
]);
for (const item of byPath.values()) {
  if (!allowedDispositions.has(item.disposition)) throw new Error(`Unknown disposition ${item.disposition}`);
  if (item.disposition.startsWith('SHARED_') && (!Array.isArray(item.sharedWith) || item.sharedWith.length === 0)) {
    throw new Error(`Shared disposition lacks sharedWith: ${item.sourceFile}`);
  }
  if ((item.disposition.includes('REQUIREMENT') || item.disposition === 'RECOVERY_PATCH_SOURCE' || item.disposition === 'RESEARCH_SIGNAL_SOURCE') && item.executionAuthority !== false) {
    throw new Error(`Non-runtime evidence gained authority: ${item.sourceFile}`);
  }
}

(async () => {
  const counts = new Map();
  const ids = new Set();
  let totalHold = 0;
  const input = readline.createInterface({
    input: fs.createReadStream(ledgerPath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of input) {
    if (!line.trim()) continue;
    const record = JSON.parse(line);
    if (record.reviewStatus !== 'REVIEW_REQUIRED') continue;
    totalHold++;
    if (ids.has(record.id)) throw new Error(`Duplicate HOLD id ${record.id}`);
    ids.add(record.id);
    const sourceFile = String(record.provenance?.sourceFile || '');
    if (!byPath.has(sourceFile)) throw new Error(`Ungoverned HOLD source: ${sourceFile}`);
    counts.set(sourceFile, (counts.get(sourceFile) || 0) + 1);
  }

  if (totalHold !== registry.expectedReviewRequired) {
    throw new Error(`HOLD total changed: expected ${registry.expectedReviewRequired}, got ${totalHold}`);
  }

  let governed = 0;
  for (const [sourceFile, item] of byPath) {
    const actual = counts.get(sourceFile) || 0;
    if (actual !== item.expectedRecords) {
      throw new Error(`Governed HOLD count mismatch for ${sourceFile}: expected ${item.expectedRecords}, got ${actual}`);
    }
    governed += actual;
  }
  if (governed !== totalHold) throw new Error(`Governed HOLD coverage mismatch: ${governed}/${totalHold}`);

  const ownerSummary = {};
  const dispositionSummary = {};
  for (const item of byPath.values()) {
    ownerSummary[item.canonicalOwner] = (ownerSummary[item.canonicalOwner] || 0) + item.expectedRecords;
    dispositionSummary[item.disposition] = (dispositionSummary[item.disposition] || 0) + item.expectedRecords;
  }

  const result = {
    marker: 'pantavion_semantic_v4_governed_hold_closure',
    corpusRecords: registry.corpus.records,
    reviewRequired: totalHold,
    governedHolds: governed,
    ungovernedHolds: totalHold - governed,
    governedSourcePaths: byPath.size,
    ownerSummary,
    dispositionSummary,
    classificationClosure: totalHold === governed,
    semanticCompletionClaim: false,
    implementationCompletionClaim: false,
    truth: 'Every current HOLD has an explicit governed disposition. This closes unknown ownership, not implementation or deployment.',
  };
  fs.mkdirSync('data/recovery/canonical-semantic-v3', { recursive: true });
  fs.writeFileSync('data/recovery/canonical-semantic-v3/governed-hold-closure.json', JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
