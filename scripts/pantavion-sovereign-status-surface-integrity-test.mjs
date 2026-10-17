import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'app/api/pantavion/intelligence/status/route.ts',
  'app/pantavion/intelligence/page.tsx',
  'core/intelligence/pantavion-sovereign-intelligence-fabric.ts',
  'core/intelligence/pantavion-intelligence-ledger.ts',
  'PANTAVION-MASTER-DOCTRINE.md',
];

for (const relative of requiredFiles) {
  assert.equal(fs.existsSync(path.join(root, relative)), true, `missing canonical surface: ${relative}`);
}

const statusRoute = fs.readFileSync(path.join(root, 'app/api/pantavion/intelligence/status/route.ts'), 'utf8');
const intelligencePage = fs.readFileSync(path.join(root, 'app/pantavion/intelligence/page.tsx'), 'utf8');
const doctrine = fs.readFileSync(path.join(root, 'PANTAVION-MASTER-DOCTRINE.md'), 'utf8');

for (const token of ['GET', 'NextResponse', 'getPantavionSovereignIntelligenceFabric']) {
  assert.match(statusRoute, new RegExp(token.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')), `status route lost ${token}`);
}

for (const field of ['runtime', 'status', 'blocker', 'provenance', 'owner', 'verification']) {
  assert.match(`${statusRoute}\\n${intelligencePage}`, new RegExp(field, 'i'), `visible status surface lost ${field}`);
}

for (const forbidden of [
  'supabase.from(',
  'supabase.auth.admin',
  'DROP TABLE',
  'TRUNCATE ',
  'force-push',
  'process.env.SUPABASE_SERVICE_ROLE_KEY',
]) {
  assert.equal(statusRoute.includes(forbidden), false, `unsafe mutation primitive leaked into status route: ${forbidden}`);
}

for (const lifecycle of ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE']) {
  assert.match(doctrine, new RegExp(lifecycle), `canonical doctrine missing lifecycle state ${lifecycle}`);
}

for (const workstream of [
  'Intent-to-Outcome Fabric',
  'Ephemeral Agent Swarm',
  'disconnected',
  'edge execution',
  'Intent Firewall',
  'Capability',
  'Budget',
  'Owner Control',
  'Technology Library',
]) {
  assert.match(`${doctrine}\\n${intelligencePage}\\n${statusRoute}`, new RegExp(workstream.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&'), 'i'), `missing canonical workstream marker: ${workstream}`);
}

console.log('sovereign status surface integrity: PASS');
