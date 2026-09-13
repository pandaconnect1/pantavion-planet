import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const lifecycle = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];
const authorityGates = {
  productionMutation: false,
  publicRelease: false,
  ownerAdmission: false,
  externalAuthorization: false,
  agentActivation: false,
};

function canonicalize(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function digest(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

function assess(packet) {
  const blockers = [];
  if (packet.networkRequired) blockers.push('network_required');
  if (packet.productionWrite) blockers.push('production_write_forbidden');
  if (packet.irreversible) blockers.push('irreversible_task');
  if (packet.remainingBudget < packet.estimatedCost) blockers.push('budget_exhausted');
  if (packet.expiresAt <= packet.now) blockers.push('expired');
  return {
    status: blockers.length ? 'hold' : 'allow',
    blockers,
    plan: blockers.length ? [] : ['validate', 'execute_in_memory', 'emit_receipt'],
    authorityGates,
    lifecycle,
  };
}

const safe = assess({
  networkRequired: false,
  productionWrite: false,
  irreversible: false,
  remainingBudget: 10,
  estimatedCost: 3,
  now: 100,
  expiresAt: 200,
});
assert.equal(safe.status, 'allow');
assert.deepEqual(safe.blockers, []);
assert.deepEqual(safe.plan, ['validate', 'execute_in_memory', 'emit_receipt']);

const budgetDenied = assess({
  networkRequired: false,
  productionWrite: false,
  irreversible: false,
  remainingBudget: 2,
  estimatedCost: 3,
  now: 100,
  expiresAt: 200,
});
assert.equal(budgetDenied.status, 'hold');
assert.deepEqual(budgetDenied.blockers, ['budget_exhausted']);
assert.deepEqual(budgetDenied.plan, []);

const edgeDenied = assess({
  networkRequired: true,
  productionWrite: false,
  irreversible: false,
  remainingBudget: 10,
  estimatedCost: 3,
  now: 100,
  expiresAt: 200,
});
assert.equal(edgeDenied.status, 'hold');
assert.deepEqual(edgeDenied.blockers, ['network_required']);
assert.deepEqual(edgeDenied.plan, []);

const tampered = { ...safe, status: 'VERIFIED_LIVE' };
assert.notEqual(digest(safe), digest(tampered));
assert.equal(canonicalize({ b: 2, a: 1 }), '{"a":1,"b":2}');
assert.deepEqual(authorityGates, {
  productionMutation: false,
  publicRelease: false,
  ownerAdmission: false,
  externalAuthorization: false,
  agentActivation: false,
});

console.log('sovereign disconnected budget/status boundary: PASS');
