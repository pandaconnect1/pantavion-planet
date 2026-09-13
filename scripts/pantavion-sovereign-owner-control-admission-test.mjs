import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const LIFECYCLE = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function evaluateOwnerControl(input) {
  const lifecycleIndex = LIFECYCLE.indexOf(input.lifecycle);
  if (lifecycleIndex < 0) return { decision: 'deny', reason: 'invalid_lifecycle', plan: [] };
  if (input.ownerControl?.admitted !== true) {
    return { decision: 'hold', reason: 'owner_admission_required', plan: [] };
  }
  if (input.ownerControl?.scope !== input.requestedScope) {
    return { decision: 'deny', reason: 'owner_scope_mismatch', plan: [] };
  }
  if (input.authority?.productionMutation || input.authority?.publicRelease || input.authority?.agentActivation) {
    return { decision: 'deny', reason: 'authority_gate_closed', plan: [] };
  }
  return { decision: 'allow_review_only', reason: null, plan: [{ action: 'prepare', scope: input.requestedScope }] };
}

const base = {
  lifecycle: 'TESTED',
  requestedScope: 'technology-library:review',
  ownerControl: { admitted: true, scope: 'technology-library:review' },
  authority: { productionMutation: false, publicRelease: false, agentActivation: false },
};

const allowed = evaluateOwnerControl(base);
assert.deepEqual(allowed, {
  decision: 'allow_review_only',
  reason: null,
  plan: [{ action: 'prepare', scope: 'technology-library:review' }],
});

const noAdmission = evaluateOwnerControl({ ...base, ownerControl: { admitted: false, scope: base.requestedScope } });
assert.deepEqual(noAdmission, { decision: 'hold', reason: 'owner_admission_required', plan: [] });

const mismatch = evaluateOwnerControl({ ...base, ownerControl: { admitted: true, scope: 'different-scope' } });
assert.deepEqual(mismatch, { decision: 'deny', reason: 'owner_scope_mismatch', plan: [] });

const authorityClosed = evaluateOwnerControl({ ...base, authority: { ...base.authority, publicRelease: true } });
assert.deepEqual(authorityClosed, { decision: 'deny', reason: 'authority_gate_closed', plan: [] });

const invalidLifecycle = evaluateOwnerControl({ ...base, lifecycle: 'LIVE' });
assert.deepEqual(invalidLifecycle, { decision: 'deny', reason: 'invalid_lifecycle', plan: [] });

const snapshot = { ...base, result: allowed };
assert.equal(digest(snapshot), digest(JSON.parse(JSON.stringify(snapshot))));
const tampered = { ...snapshot, result: { ...allowed, decision: 'allow' } };
assert.notEqual(digest(snapshot), digest(tampered));

console.log('sovereign owner-control admission tests passed');
