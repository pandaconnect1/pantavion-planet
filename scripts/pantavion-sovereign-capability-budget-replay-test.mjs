import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const lifecycle = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function authorize(grant, request, now) {
  if (!grant || grant.revoked || grant.expiresAt <= now) return { decision: 'deny', blocker: 'grant-inactive' };
  if (request.capability !== grant.capability || request.scope !== grant.scope) {
    return { decision: 'deny', blocker: 'capability-scope-mismatch' };
  }
  if (request.cost <= 0 || request.cost > grant.remainingBudget) {
    return { decision: 'deny', blocker: 'budget-exhausted' };
  }
  return {
    decision: 'allow',
    remainingBudget: grant.remainingBudget - request.cost,
    lifecycle: 'TESTED',
    authority: {
      productionMutation: false,
      publicRelease: false,
      ownerAdmission: false,
      agentActivation: false,
    },
  };
}

const now = 1_757_152_000_000;
const grant = {
  grantId: 'grant-demo',
  capability: 'read:status',
  scope: 'founder-visible-status',
  remainingBudget: 5,
  expiresAt: now + 60_000,
  revoked: false,
};

const first = authorize(grant, { capability: 'read:status', scope: 'founder-visible-status', cost: 2 }, now);
assert.equal(first.decision, 'allow');
assert.equal(first.remainingBudget, 3);
assert.equal(first.lifecycle, 'TESTED');
assert.deepEqual(first.authority, {
  productionMutation: false,
  publicRelease: false,
  ownerAdmission: false,
  agentActivation: false,
});

const replay = authorize({ ...grant, remainingBudget: first.remainingBudget }, { capability: 'read:status', scope: 'founder-visible-status', cost: 2 }, now);
assert.equal(replay.decision, 'allow');
assert.equal(replay.remainingBudget, 1);
assert.notEqual(digest(first), digest(replay));

const overrun = authorize({ ...grant, remainingBudget: 1 }, { capability: 'read:status', scope: 'founder-visible-status', cost: 2 }, now);
assert.deepEqual(overrun, { decision: 'deny', blocker: 'budget-exhausted' });

const expired = authorize({ ...grant, expiresAt: now }, { capability: 'read:status', scope: 'founder-visible-status', cost: 1 }, now);
assert.deepEqual(expired, { decision: 'deny', blocker: 'grant-inactive' });

const mismatch = authorize(grant, { capability: 'write:production', scope: 'production', cost: 1 }, now);
assert.deepEqual(mismatch, { decision: 'deny', blocker: 'capability-scope-mismatch' });

assert.deepEqual(lifecycle, ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE']);
console.log('sovereign capability/budget replay contract: PASS');
