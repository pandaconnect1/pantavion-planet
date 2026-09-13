import assert from 'node:assert/strict';

const STATES = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];

function projectStatus(item) {
  assert.equal(typeof item.id, 'string');
  assert.equal(typeof item.state, 'string');
  assert.ok(STATES.includes(item.state));
  assert.equal(typeof item.evidence, 'object');
  assert.equal(typeof item.evidence.code, 'boolean');
  assert.equal(typeof item.evidence.tests, 'boolean');
  assert.equal(typeof item.evidence.deployment, 'boolean');
  assert.equal(typeof item.evidence.live, 'boolean');

  const index = STATES.indexOf(item.state);
  assert.ok(index >= 0);
  if (index < STATES.indexOf('TESTED')) assert.equal(item.evidence.tests, false);
  if (index < STATES.indexOf('DEPLOYED')) assert.equal(item.evidence.deployment, false);
  if (index < STATES.indexOf('VERIFIED_LIVE')) assert.equal(item.evidence.live, false);
  if (item.state === 'VERIFIED_LIVE') {
    assert.equal(item.evidence.code, true);
    assert.equal(item.evidence.tests, true);
    assert.equal(item.evidence.deployment, true);
    assert.equal(item.evidence.live, true);
  }
  return Object.freeze({
    id: item.id,
    state: item.state,
    blocker: item.blocker ?? null,
    evidence: Object.freeze({ ...item.evidence }),
  });
}

const valid = projectStatus({
  id: 'intent-to-outcome-fabric',
  state: 'TESTED',
  blocker: null,
  evidence: { code: true, tests: true, deployment: false, live: false },
});
assert.equal(valid.state, 'TESTED');
assert.equal(Object.isFrozen(valid), true);

assert.throws(() => projectStatus({
  id: 'unsafe-skip',
  state: 'DEPLOYED',
  evidence: { code: true, tests: false, deployment: true, live: false },
}));

assert.throws(() => projectStatus({
  id: 'false-live',
  state: 'VERIFIED_LIVE',
  evidence: { code: true, tests: true, deployment: false, live: true },
}));

const blocked = projectStatus({
  id: 'technology-library',
  state: 'CODED',
  blocker: 'owner-approval-required',
  evidence: { code: true, tests: false, deployment: false, live: false },
});
assert.equal(blocked.blocker, 'owner-approval-required');
assert.equal(blocked.evidence.tests, false);

console.log('pantavion sovereign status projection contract: PASS');
