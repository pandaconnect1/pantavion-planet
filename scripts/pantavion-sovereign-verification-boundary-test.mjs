import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const candidates = [
  'app/api/implementation-status/route.ts',
  'app/implementation-status/page.tsx',
  'core/sovereign/implementation-registry.ts',
  'core/sovereign/technology-library.ts',
  'core/sovereign/owner-control.ts',
  'core/sovereign/intent-firewall.ts',
  'core/sovereign/agent-capability-budget.ts',
  'core/sovereign/edge-execution.ts'
];

const existing = candidates.filter((file) => fs.existsSync(path.join(root, file)));
assert.ok(existing.length >= 1, 'at least one canonical verification surface must exist');

for (const file of existing) {
  const content = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(content.trim().length > 0, `${file} must be non-empty`);
  assert.match(content, /(status|verification|provenance|owner|blocker)/i, `${file} must expose verification metadata`);
  assert.doesNotMatch(content, /supabase\.(insert|update|upsert|delete)\s*\(/i, `${file} must not directly mutate Supabase`);
  assert.doesNotMatch(content, /force[-_ ]?push|bypass|disable.*gate/i, `${file} must not contain bypass markers`);
}

const lifecycle = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const registryText = existing.map((file) => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
for (const state of lifecycle) {
  assert.match(registryText, new RegExp(state), `lifecycle state ${state} must remain discoverable`);
}

console.log(JSON.stringify({
  contract: 'sovereign-verification-boundary',
  checkedFiles: existing,
  lifecycle,
  productionMutation: false,
  bypassDetected: false
}, null, 2));
