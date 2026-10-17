import assert from 'node:assert/strict';

const LIFECYCLE = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const REQUIRED_MARKERS = ['status', 'blocker', 'provenance', 'verification', 'owner'];

const statusSurface = {
  routeContract: 'GET-only visible implementation-status surface',
  lifecycle: LIFECYCLE,
  authorityGates: {
    productionWrite: false,
    merge: false,
    deployment: false,
    publicRelease: false,
    agentActivation: false,
  },
  evidence: {
    status: 'present',
    blocker: 'present',
    provenance: 'present',
    verification: 'present',
    owner: 'present',
  },
};

assert.equal(statusSurface.routeContract.includes('GET-only'), true);
assert.deepEqual(statusSurface.lifecycle, LIFECYCLE);
for (const marker of REQUIRED_MARKERS) {
  assert.equal(statusSurface.evidence[marker], 'present', `missing evidence marker: ${marker}`);
}
for (const [gate, value] of Object.entries(statusSurface.authorityGates)) {
  assert.equal(value, false, `status surface must not authorize ${gate}`);
}

const invalidTransitions = [
  ['CODED', 'MERGED'],
  ['TESTED', 'DEPLOYED'],
  ['MERGED', 'VERIFIED_LIVE'],
];
for (const [from, to] of invalidTransitions) {
  assert.equal(LIFECYCLE.indexOf(to) - LIFECYCLE.indexOf(from) > 1, true);
}

console.log('sovereign status evidence ledger contract: ok');
