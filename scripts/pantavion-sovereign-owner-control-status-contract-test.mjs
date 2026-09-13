import assert from 'node:assert/strict';

const LIFECYCLE = [
  'IDEA',
  'CODED',
  'TESTED',
  'MERGED',
  'DEPLOYED',
  'VERIFIED_LIVE',
];

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

function assertAdjacent(from, to) {
  const fromIndex = LIFECYCLE.indexOf(from);
  const toIndex = LIFECYCLE.indexOf(to);
  assert.notEqual(fromIndex, -1, `unknown lifecycle state: ${from}`);
  assert.notEqual(toIndex, -1, `unknown lifecycle state: ${to}`);
  assert.equal(toIndex, fromIndex + 1, `${from} -> ${to} must be adjacent`);
}

function projectStatus(input) {
  const {
    workstream,
    state,
    exactHeadEvidence,
    ownerApproval,
    productionMutation,
    externalAuthorization,
    liveVerificationEvidence,
  } = input;

  assert(WORKSTREAMS.includes(workstream), 'status must name a canonical workstream');
  assert(LIFECYCLE.includes(state), 'status must use the canonical lifecycle');

  if (state !== 'IDEA') {
    assert(exactHeadEvidence, 'non-IDEA state requires exact-head evidence');
  }
  if (state === 'MERGED' || state === 'DEPLOYED' || state === 'VERIFIED_LIVE') {
    assert(ownerApproval, `${state} requires explicit owner approval`);
  }
  if (state === 'DEPLOYED' || state === 'VERIFIED_LIVE') {
    assert(externalAuthorization, `${state} requires explicit external authorization`);
  }
  if (state === 'VERIFIED_LIVE') {
    assert(liveVerificationEvidence, 'VERIFIED_LIVE requires live-verification evidence');
  }
  assert.equal(productionMutation, false, 'status projection must not perform production mutation');

  return { workstream, state, exactHeadEvidence, ownerApproval, externalAuthorization, liveVerificationEvidence };
}

for (const workstream of WORKSTREAMS) {
  const status = projectStatus({
    workstream,
    state: 'CODED',
    exactHeadEvidence: { commit: 'exact-head-placeholder', workflows: [] },
    ownerApproval: false,
    productionMutation: false,
    externalAuthorization: false,
    liveVerificationEvidence: false,
  });
  assert.equal(status.workstream, workstream);
}

assertAdjacent('IDEA', 'CODED');
assertAdjacent('CODED', 'TESTED');
assertAdjacent('TESTED', 'MERGED');
assertAdjacent('MERGED', 'DEPLOYED');
assertAdjacent('DEPLOYED', 'VERIFIED_LIVE');
assert.throws(() => assertAdjacent('TESTED', 'DEPLOYED'));

assert.throws(() => projectStatus({
  workstream: WORKSTREAMS[0],
  state: 'TESTED',
  exactHeadEvidence: null,
  ownerApproval: false,
  productionMutation: false,
  externalAuthorization: false,
  liveVerificationEvidence: false,
}));

assert.throws(() => projectStatus({
  workstream: WORKSTREAMS[5],
  state: 'MERGED',
  exactHeadEvidence: { commit: 'abc', workflows: ['ci'] },
  ownerApproval: false,
  productionMutation: false,
  externalAuthorization: true,
  liveVerificationEvidence: false,
}));

assert.throws(() => projectStatus({
  workstream: WORKSTREAMS[6],
  state: 'VERIFIED_LIVE',
  exactHeadEvidence: { commit: 'abc', workflows: ['ci'] },
  ownerApproval: true,
  productionMutation: false,
  externalAuthorization: true,
  liveVerificationEvidence: false,
}));

assert.throws(() => projectStatus({
  workstream: WORKSTREAMS[7],
  state: 'DEPLOYED',
  exactHeadEvidence: { commit: 'abc', workflows: ['ci'] },
  ownerApproval: true,
  productionMutation: true,
  externalAuthorization: true,
  liveVerificationEvidence: false,
}));

console.log('sovereign owner-control/status contract: PASS');
