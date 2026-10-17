import assert from 'node:assert/strict';
import fs from 'node:fs';

const packageJson = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const scripts = packageJson.scripts ?? {};

const requiredCommands = [
  'test:sovereign-factory-contract',
  'test:sovereign-kernel-integration',
  'test:owner-release-gate',
  'audit:implementation',
  'audit:foundry',
  'audit:protected-change',
  'audit:water:network-lock',
  'verify:runtime-safety',
];

for (const command of requiredCommands) {
  assert.equal(typeof scripts[command], 'string', `missing verification command: ${command}`);
  assert.ok(scripts[command].trim().length > 0, `empty verification command: ${command}`);
}

const runtimeSafety = scripts['verify:runtime-safety'];
for (const requiredFragment of [
  'npm run lint',
  'npm run typecheck',
  'npm run build',
  'npm run audit:implementation',
  'npm run audit:scheduled-worker',
]) {
  assert.ok(runtimeSafety.includes(requiredFragment), `runtime safety surface missing: ${requiredFragment}`);
}

for (const forbiddenFragment of [
  'supabase db reset',
  'supabase db push',
  'vercel --prod',
  'git push --force',
]) {
  assert.equal(runtimeSafety.includes(forbiddenFragment), false, `unsafe command surfaced: ${forbiddenFragment}`);
}

assert.ok(
  scripts['test:sovereign-factory-contract'].includes('pantavion-sovereign-factory-contract-test.mjs'),
  'sovereign factory contract command must remain mapped to its test surface',
);
assert.ok(
  scripts['test:owner-release-gate'].includes('pantavion-owner-release-gate-test.mjs'),
  'owner release gate command must remain mapped to its test surface',
);

console.log('Sovereign verification command surface: PASS');
