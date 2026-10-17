import assert from 'node:assert/strict';

const lifecycle = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const forbidden = [
  'production mutation',
  'public release',
  'owner admission',
  'external authorization',
  'agent activation',
  'force push',
];

function validateStatusSurface(surface) {
  assert.equal(surface.method, 'GET');
  assert.equal(surface.authorizes, false);
  assert.ok(surface.status);
  assert.ok(surface.verification);
  assert.ok(surface.provenance);
  assert.ok(surface.owner);
  assert.ok(surface.blocker);
  assert.ok(Array.isArray(surface.lifecycle));
  assert.deepEqual(surface.lifecycle, lifecycle);
  assert.ok(Array.isArray(surface.evidence));
  assert.ok(surface.evidence.length > 0);
  assert.equal(surface.productionMutation, false);
  assert.equal(surface.publicRelease, false);
  assert.equal(surface.ownerAdmission, false);
  assert.equal(surface.externalAuthorization, false);
  assert.equal(surface.agentActivation, false);
  assert.equal(surface.forcePush, false);
}

function assertNoForbiddenBypassMarkers(serialized) {
  for (const marker of forbidden) {
    assert.equal(serialized.toLowerCase().includes(marker), false, `forbidden marker: ${marker}`);
  }
}

const statusSurface = {
  method: 'GET',
  authorizes: false,
  status: 'CODED',
  verification: 'pending exact-head CI evidence',
  provenance: 'repository commit + workflow evidence',
  owner: 'founder approval required for gated transitions',
  blocker: 'merge/deploy/live verification intentionally pending',
  lifecycle,
  evidence: [
    { kind: 'commit', exactHead: 'placeholder-exact-head' },
    { kind: 'workflow', conclusion: 'pending' },
  ],
  productionMutation: false,
  publicRelease: false,
  ownerAdmission: false,
  externalAuthorization: false,
  agentActivation: false,
  forcePush: false,
};

validateStatusSurface(statusSurface);
assertNoForbiddenBypassMarkers(JSON.stringify({
  intent: 'read-only implementation status',
  gates: statusSurface,
}));

const next = { ...statusSurface, status: 'TESTED' };
assert.equal(lifecycle.indexOf(next.status), lifecycle.indexOf(statusSurface.status) + 1);

console.log('PASS: sovereign status live evidence contract');
