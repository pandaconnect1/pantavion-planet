import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const LIFECYCLE = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const ALLOWED_TRANSITIONS = new Map(LIFECYCLE.map((state, index) => [state, index < LIFECYCLE.length - 1 ? LIFECYCLE[index + 1] : null]));

function canonicalize(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function digest(snapshot) {
  return crypto.createHash('sha256').update(canonicalize(snapshot)).digest('hex');
}

function validateEntry(entry) {
  assert.equal(typeof entry.id, 'string');
  assert.equal(typeof entry.state, 'string');
  assert.ok(LIFECYCLE.includes(entry.state), `invalid lifecycle state: ${entry.state}`);
  assert.equal(typeof entry.exactCommit, 'string');
  assert.match(entry.exactCommit, /^[0-9a-f]{40}$/);
  assert.equal(typeof entry.evidence, 'object');
  assert.equal(typeof entry.authorityGates, 'object');
  for (const gate of ['ownerAdmission', 'productionMutation', 'publicRelease', 'agentActivation']) {
    assert.equal(entry.authorityGates[gate], false, `${entry.id}: gate must remain closed: ${gate}`);
  }
  if (entry.state !== 'IDEA') {
    assert.ok(Array.isArray(entry.evidence.workflowRuns), `${entry.id}: workflowRuns evidence required`);
  }
  const expectedNext = ALLOWED_TRANSITIONS.get(entry.state);
  assert.equal(entry.nextAllowedTransition, expectedNext, `${entry.id}: invalid next transition`);
}

const snapshot = {
  schema: 'pantavion.sovereign.status-snapshot.v1',
  generatedAt: '2026-09-07T05:06:45+03:00',
  source: 'repository-main',
  entries: [
    {
      id: 'intent-to-outcome-fabric',
      state: 'TESTED',
      exactCommit: '4e5e0aad536390c74bcfe596f2b495edc8bbb53a',
      evidence: { workflowRuns: ['34033156289', '34033156277', '34033156327'] },
      authorityGates: { ownerAdmission: false, productionMutation: false, publicRelease: false, agentActivation: false },
      nextAllowedTransition: 'MERGED',
    },
    {
      id: 'ephemeral-agent-swarm',
      state: 'TESTED',
      exactCommit: 'e1a74189e5d7f0ca6974aad25dc896b7328ebb56',
      evidence: { workflowRuns: ['34044660696', '34044660704', '34044660692'] },
      authorityGates: { ownerAdmission: false, productionMutation: false, publicRelease: false, agentActivation: false },
      nextAllowedTransition: 'MERGED',
    },
    {
      id: 'implementation-status-surface',
      state: 'CODED',
      exactCommit: '1ca8b49540e6d0e38f14fd8bfb96896edf60d229',
      evidence: { workflowRuns: [] },
      authorityGates: { ownerAdmission: false, productionMutation: false, publicRelease: false, agentActivation: false },
      nextAllowedTransition: 'TESTED',
    },
  ],
};

for (const entry of snapshot.entries) validateEntry(entry);
const baselineDigest = digest(snapshot);
const tampered = structuredClone(snapshot);
tampered.entries[0].authorityGates.publicRelease = true;
assert.notEqual(digest(tampered), baselineDigest, 'tampering must change the digest');

console.log(JSON.stringify({ ok: true, schema: snapshot.schema, entryCount: snapshot.entries.length, digest: baselineDigest }));
