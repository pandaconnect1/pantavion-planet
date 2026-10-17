import assert from 'node:assert/strict';

const ALLOWED = new Set(['read','classify','summarize','translate']);
const BLOCKED = new Set(['production_write','public_release','credential_exfiltration','policy_bypass']);

function evaluateIntent(intent) {
  const normalized = String(intent).trim().toLowerCase();
  if (BLOCKED.has(normalized)) return { decision: 'deny', reason: 'blocked_capability' };
  if (!ALLOWED.has(normalized)) return { decision: 'hold', reason: 'owner_or_policy_review_required' };
  return { decision: 'allow', reason: 'bounded_non_mutating_capability' };
}

function compilePlan(intent) {
  const verdict = evaluateIntent(intent);
  return {
    intent,
    verdict,
    steps: verdict.decision === 'allow' ? [{ kind: 'bounded', reversible: true, network: false, productionWrite: false }] : [],
    gates: { productionWrite: false, publicRelease: false, ownerAdmission: false, agentActivation: false },
  };
}

const allow = compilePlan('summarize');
assert.deepEqual(allow.verdict, { decision: 'allow', reason: 'bounded_non_mutating_capability' });
assert.equal(allow.gates.productionWrite, false);
assert.equal(allow.gates.publicRelease, false);
assert.equal(allow.steps[0].reversible, true);

const deny = compilePlan('production_write');
assert.deepEqual(deny.verdict, { decision: 'deny', reason: 'blocked_capability' });
assert.equal(deny.steps.length, 0);
assert.equal(deny.gates.ownerAdmission, false);

const hold = compilePlan('external_provider_execution');
assert.deepEqual(hold.verdict, { decision: 'hold', reason: 'owner_or_policy_review_required' });
assert.equal(hold.steps.length, 0);

const replayA = JSON.stringify(compilePlan('translate'));
const replayB = JSON.stringify(compilePlan('translate'));
assert.equal(replayA, replayB);

console.log('sovereign intent firewall boundary contract: ok');
