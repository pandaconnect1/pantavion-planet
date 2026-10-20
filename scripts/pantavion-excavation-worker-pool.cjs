#!/usr/bin/env node
// Real local process workers for non-mutating Pantavion excavation verification.
// Explicit opt-in: node scripts/pantavion-excavation-worker-pool.cjs --execute
// No provider keys, code edits, deploys, or access to protected maps are required.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { Worker } = require('node:worker_threads');
const root = path.resolve(__dirname, '..');
const sources = [
  ['founder-vision', 'data/runtime-reports/latest-founder-vision-ingestion.json'],
  ['unfinished-plan', 'data/runtime-reports/latest-unfinished-plan-ingestion.json'],
  ['branch-history', 'data/recovery/imported-pr248/deep-analysis/manifest.json'],
  ['recovery-state', 'docs/recovery/RECOVERY_STATE_MANIFEST.json']
];
const run = process.argv.includes('--execute');
const maxWorkers = Math.max(1, Math.min(4, os.availableParallelism?.() || os.cpus().length));
const sha = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const workerSource = `
const { parentPort, workerData } = require('node:worker_threads');
const fs = require('node:fs');
const crypto = require('node:crypto');
const sha = x => crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
try {
 const raw = fs.readFileSync(workerData.path, 'utf8');
 const data = JSON.parse(raw);
 const findings = Array.isArray(data.findings) ? data.findings :
                  Array.isArray(data.items) ? data.items :
                  Array.isArray(data.branches) ? data.branches : [];
 const records = findings.map((original, index) => ({
   id: workerData.family + ':' + String(index + 1).padStart(6, '0'),
   source: workerData.rel, original, fingerprint: sha(original),
   implementationState: 'unverified', requiresHumanReview: true
 }));
 parentPort.postMessage({ family: workerData.family, source: workerData.rel,
   declared: data.totals?.findings ?? null, records, sourceHash: crypto.createHash('sha256').update(raw).digest('hex') });
} catch (error) { parentPort.postMessage({ family: workerData.family, source: workerData.rel, error: error.message }); }
`;
async function main() {
 const available = sources.filter(([, rel]) => fs.existsSync(path.join(root, rel)));
 const missing = sources.filter(([, rel]) => !fs.existsSync(path.join(root, rel))).map(x => x[1]);
 if (!run) {
   console.log(JSON.stringify({ status: 'not_executed', command: 'node scripts/pantavion-excavation-worker-pool.cjs --execute',
     workerKind: 'real Node.js worker_threads, read-only', maxWorkers, available: available.map(x=>x[1]), missing }, null, 2));
   return;
 }
 const results = [];
 let cursor = 0;
 async function lane() {
   while (cursor < available.length) {
     const [family, rel] = available[cursor++];
     const result = await new Promise((resolve, reject) => {
       const worker = new Worker(workerSource, { eval: true, workerData: { family, rel, path: path.join(root, rel) } });
       worker.once('message', resolve);
       worker.once('error', reject);
       worker.once('exit', code => { if (code !== 0) reject(new Error('worker exit ' + code)); });
     });
     results.push(result);
   }
 }
 await Promise.all(Array.from({ length: Math.min(maxWorkers, available.length) }, lane));
 const failures = results.filter(x => x.error);
 const records = results.flatMap(x => x.records || []);
 const canonicalCandidates = new Map();
 for (const record of records) {
   const group = canonicalCandidates.get(record.fingerprint) || { fingerprint: record.fingerprint, recordIds: [], reviewRequired: true };
   group.recordIds.push(record.id);
   canonicalCandidates.set(record.fingerprint, group);
 }
 const receipt = { schema: 'pantavion-excavation-worker-receipt-v1', executedAt: new Date().toISOString(),
   execution: 'real_parallel_node_worker_threads', workersUsed: Math.min(maxWorkers, available.length),
   readOnlyInputs: available.map(x => x[1]), missing, failures,
   totalPreservedRecords: records.length, duplicateCandidateGroups: canonicalCandidates.size,
   sources: results.map(({family,source,declared,sourceHash,records,error})=>({family,source,declared,loaded:records?.length||0,sourceHash,error})),
   aiProviderConnected: false, aiInferenceExecuted: false, productionDeployed: false };
 const dir = path.join(root, 'artifacts', 'ecosystem-discovery');
 fs.mkdirSync(dir, { recursive: true });
 fs.writeFileSync(path.join(dir, 'excavation-worker-records.json'), JSON.stringify({receipt,records},null,2)+'\n');
 fs.writeFileSync(path.join(dir, 'excavation-worker-candidates.json'), JSON.stringify([...canonicalCandidates.values()],null,2)+'\n');
 fs.writeFileSync(path.join(dir, 'excavation-worker-receipt.json'), JSON.stringify(receipt,null,2)+'\n');
 console.log(JSON.stringify(receipt,null,2));
 if (failures.length || missing.length) process.exitCode = 2;
}
main().catch(error => { console.error(error); process.exitCode = 1; });
