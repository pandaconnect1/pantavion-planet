import assert from 'node:assert/strict';

const STATES = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
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

function assertAdjacentTransition(from, to) {
  assert.equal(STATES.indexOf(to), STATES.indexOf(from) + 1);
}

function validateRecord(record) {
  assert.ok(WORKSTREAMS.includes(record.workstream));
  assert.ok(STATES.includes(record.state));
  assert.equal(record.syntheticRecordsCountedAsImplementation, 0);
  if (record.state !== 'IDEA') {
    assert.match(record.exactHead, /^[0-9a-f]{40}$/);
    assert.ok(record.evidence && record.evidence.length > 0);
  }
  if (['MERGED', 'DEPLOYED', 'VERIFIED_LIVE'].includes(record.state)) {
    assert.equal(record.ownerApproval, true);
  }
  if (['DEPLOYED', 'VERIFIED_LIVE'].includes(record.state)) {
    assert.equal(record.externalAuthorization, true);
  }
  if (record.state === 'VERIFIED_LIVE') {
    assert.equal(record.liveVerification, true);
  }
  if (record.productionMutation === true) {
    assert.equal(record.ownerApproval, true);
    assert.equal(record.externalAuthorization, true);
  }
}

for (const workstream of WORKSTREAMS) {
  validateRecord({
    workstream,
    state: 'TESTED',
    exactHead: '0123456789abcdef0123456789abcdef01234567',
    evidence: ['workflow:success', 'run:123'],
    syntheticRecordsCountedAsImplementation: 0,
    ownerApproval: false,
    externalAuthorization: false,
    liveVerification: false,
    productionMutation: false,
  });
}

assertAdjacentTransition('IDEA', 'CODED');
assertAdjacentTransition('CODED', 'TESTED');
assertAdjacentTransition('TESTED', 'MERGED');
assertAdjacentTransition('MERGED', 'DEPLOYED');
assertAdjacentTransition('DEPLOYED', 'VERIFIED_LIVE');
assert.throws(() => assertAdjacentTransition('CODED', 'MERGED'));
assert.throws(() => validateRecord({
  workstream: WORKSTREAMS[0],
  state: 'VERIFIED_LIVE',
  exactHead: '0123456789abcdef0123456789abcdef01234567',
  evidence: ['workflow:success'],
  syntheticRecordsCountedAsImplementation: 0,
  ownerApproval: true,
  externalAuthorization: true,
  liveVerification: false,
  productionMutation: false,
}));
assert.throws(() => validateRecord({
  workstream: WORKSTREAMS[1],
  state: 'TESTED',
  exactHead: 'not-a-sha',
  evidence: ['workflow:success'],
  syntheticRecordsCountedAsImplementation: 0,
  ownerApproval: false,
  externalAuthorization: false,
  liveVerification: false,
  productionMutation: false,
}));
assert.throws(() => validateRecord({
  workstream: WORKSTREAMS[2],
  state: 'MERGED',
  exactHead: '0123456789abcdef0123456789abcdef01234567',
  evidence: ['workflow:success'],
  syntheticRecordsCountedAsImplementation: 0,
  ownerApproval: false,
  externalAuthorization: false,
  liveVerification: false,
  productionMutation: false,
}));

console.log('sovereign status provenance ledger contract: ok');
