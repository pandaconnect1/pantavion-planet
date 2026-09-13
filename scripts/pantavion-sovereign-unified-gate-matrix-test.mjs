import assert from 'node:assert/strict';

const lifecycle = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const forbiddenAuthority = [
  'productionMutation',
  'publicRelease',
  'ownerAdmission',
  'externalAuthorization',
  'agentActivation',
  'forcePush',
];

function evaluate(input) {
  const state = {
    lifecycle: input.lifecycle,
    allowed: input.allowed === true,
    evidence: Array.isArray(input.evidence) ? [...input.evidence].sort() : [],
    blockers: Array.isArray(input.blockers) ? [...input.blockers].sort() : [],
    authority: Object.fromEntries(forbiddenAuthority.map((key) => [key, false])),
  };

  if (!lifecycle.includes(state.lifecycle)) return { ...state, decision: 'deny', reason: 'invalid_lifecycle' };
  if (state.authority.productionMutation || state.authority.publicRelease) {
    return { ...state, decision: 'deny', reason: 'authority_gate' };
  }
  if (state.blockers.length > 0) return { ...state, decision: 'hold', reason: 'blockers_present' };
  if (state.allowed !== true || state.evidence.length === 0) {
    return { ...state, decision: 'hold', reason: 'insufficient_evidence' };
  }
  return { ...state, decision: 'allow', reason: 'bounded_review_only' };
}

const baseline = evaluate({ lifecycle: 'CODED', allowed: true, evidence: ['exact_head', 'ci_success'] });
assert.equal(baseline.decision, 'allow');
assert.deepEqual(baseline.authority, Object.fromEntries(forbiddenAuthority.map((key) => [key, false])));

const blocked = evaluate({ lifecycle: 'CODED', allowed: true, evidence: ['exact_head'], blockers: ['owner_review'] });
assert.equal(blocked.decision, 'hold');
assert.equal(blocked.reason, 'blockers_present');

const insufficient = evaluate({ lifecycle: 'CODED', allowed: true, evidence: [] });
assert.equal(insufficient.decision, 'hold');
assert.equal(insufficient.reason, 'insufficient_evidence');

const invalid = evaluate({ lifecycle: 'UNKNOWN', allowed: true, evidence: ['exact_head'] });
assert.equal(invalid.decision, 'deny');
assert.equal(invalid.reason, 'invalid_lifecycle');

const repeatA = evaluate({ lifecycle: 'TESTED', allowed: true, evidence: ['z', 'a'] });
const repeatB = evaluate({ lifecycle: 'TESTED', allowed: true, evidence: ['a', 'z'] });
assert.deepEqual(repeatA, repeatB);

console.log(JSON.stringify({ status: 'PASS', checks: 5, lifecycle }, null, 2));
