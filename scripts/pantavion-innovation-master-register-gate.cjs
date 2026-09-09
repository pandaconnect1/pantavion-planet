const fs = require('fs');
const path = require('path');

const root = process.cwd();
const dir = path.join(root, 'data', 'recovery', 'innovation-master-register');
const manifestPath = path.join(dir, 'manifest.json');
const registerPath = path.join(dir, 'innovation-master-register.json');

function fail(message) {
  console.error(`PANTAVION INNOVATION REGISTER GATE: FAIL - ${message}`);
  process.exit(1);
}
if (!fs.existsSync(manifestPath)) fail('manifest.json missing; run innovations:extract first');
if (!fs.existsSync(registerPath)) fail('innovation-master-register.json missing; run innovations:extract first');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const register = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
if (manifest.id !== 'pantavion_innovation_master_register_v1') fail('unexpected manifest id');
if (!Array.isArray(register.candidates)) fail('candidates array missing');
if (manifest.totals?.exactDeduplicatedCandidates !== register.candidates.length) fail('candidate count mismatch');

const forbiddenNovelty = register.candidates.filter(c => c.noveltyClaimAllowed !== false || c.noveltyStatus !== 'UNVERIFIED_PRIOR_ART_REQUIRED');
if (forbiddenNovelty.length) fail(`${forbiddenNovelty.length} candidates make an unsupported novelty claim`);

const missingEvidence = register.candidates.filter(c => !Array.isArray(c.evidence) || c.evidence.length === 0);
if (missingEvidence.length) fail(`${missingEvidence.length} candidates have no source evidence`);

const ids = new Set();
for (const c of register.candidates) {
  if (!c.innovationId) fail('candidate without innovationId');
  if (ids.has(c.innovationId)) fail(`duplicate innovationId ${c.innovationId}`);
  ids.add(c.innovationId);
}

console.log('PANTAVION INNOVATION REGISTER GATE: PASS');
console.log(`- candidates: ${register.candidates.length}`);
console.log('- unsupported novelty claims: 0');
console.log('- evidence-less candidates: 0');
