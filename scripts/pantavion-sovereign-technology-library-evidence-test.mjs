import assert from 'node:assert/strict';

const LIFECYCLE = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const WORKSTREAMS = [
  'Intent-to-Outcome Fabric',
  'Ephemeral Agent Swarm',
  'disconnected / edge execution',
  'Intent Firewall',
  'Agent Capability / Budget Control',
  'Owner Control integration',
  'Technology Library',
  'visible implementation-status / verification surface',
];

function nextState(current, requested, evidence) {
  const currentIndex = LIFECYCLE.indexOf(current);
  const requestedIndex = LIFECYCLE.indexOf(requested);
  if (currentIndex < 0 || requestedIndex < 0) return { ok: false, reason: 'unknown-state' };
  if (requestedIndex !== currentIndex + 1) return { ok: false, reason: 'non-adjacent-transition' };
  if (!evidence || evidence.exactHead !== true) return { ok: false, reason: 'missing-exact-head-evidence' };
  if (requested === 'VERIFIED_LIVE' && evidence.liveVerification !== true) return { ok: false, reason: 'missing-live-verification' };
  return { ok: true, state: requested };
}

function admitTechnology(record) {
  if (record.syntheticRecordsCountedAsImplementation !== 0) return { ok: false, reason: 'synthetic-material-counted' };
  if (!record.sourceSha256 || !record.sourceUri) return { ok: false, reason: 'missing-source-provenance' };
  if (record.externalAuthorization !== true) return { ok: false, reason: 'external-authorization-required' };
  if (record.ownerApproval !== true) return { ok: false, reason: 'owner-approval-required' };
  if (record.productionMutation !== false) return { ok: false, reason: 'production-mutation-not-false' };
  return { ok: true };
}

assert.deepEqual(LIFECYCLE, ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE']);
assert.equal(WORKSTREAMS.length, 8);
assert(WORKSTREAMS.includes('Technology Library'));
assert(WORKSTREAMS.includes('Owner Control integration'));

assert.deepEqual(nextState('IDEA', 'CODED', { exactHead: true }), { ok: true, state: 'CODED' });
assert.deepEqual(nextState('CODED', 'TESTED', { exactHead: false }), { ok: false, reason: 'missing-exact-head-evidence' });
assert.deepEqual(nextState('TESTED', 'DEPLOYED', { exactHead: true }), { ok: false, reason: 'non-adjacent-transition' });
assert.deepEqual(nextState('DEPLOYED', 'VERIFIED_LIVE', { exactHead: true, liveVerification: false }), { ok: false, reason: 'missing-live-verification' });

const admissible = admitTechnology({
  syntheticRecordsCountedAsImplementation: 0,
  sourceSha256: 'sha256:example',
  sourceUri: 'https://example.invalid/library-entry',
  externalAuthorization: true,
  ownerApproval: true,
  productionMutation: false,
});
assert.deepEqual(admissible, { ok: true });
assert.equal(admitTechnology({ ...admissible, syntheticRecordsCountedAsImplementation: 1 }).ok, false);
assert.equal(admitTechnology({
  syntheticRecordsCountedAsImplementation: 0,
  sourceSha256: 'sha256:example',
  sourceUri: 'https://example.invalid/library-entry',
  externalAuthorization: false,
  ownerApproval: true,
  productionMutation: false,
}).reason, 'external-authorization-required');
assert.equal(admitTechnology({
  syntheticRecordsCountedAsImplementation: 0,
  sourceSha256: 'sha256:example',
  sourceUri: 'https://example.invalid/library-entry',
  externalAuthorization: true,
  ownerApproval: false,
  productionMutation: false,
}).reason, 'owner-approval-required');
assert.equal(admitTechnology({
  syntheticRecordsCountedAsImplementation: 0,
  sourceSha256: 'sha256:example',
  sourceUri: 'https://example.invalid/library-entry',
  externalAuthorization: true,
  ownerApproval: true,
  productionMutation: true,
}).reason, 'production-mutation-not-false');

console.log('sovereign technology library evidence boundaries: ok');
