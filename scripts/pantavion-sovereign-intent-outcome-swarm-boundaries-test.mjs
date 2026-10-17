import assert from 'node:assert/strict';

const LIFECYCLE = [
  'IDEA',
  'CODED',
  'TESTED',
  'MERGED',
  'DEPLOYED',
  'VERIFIED_LIVE',
];

function nextLifecycleState(current, requested) {
  const currentIndex = LIFECYCLE.indexOf(current);
  const requestedIndex = LIFECYCLE.indexOf(requested);
  if (currentIndex < 0 || requestedIndex !== currentIndex + 1) {
    return { allowed: false, reason: 'strict_adjacent_transition_required' };
  }
  return { allowed: true, state: requested };
}

function authorizeIntentOutcome({ intentId, outcomeIntentId, capability, budgetRemaining, estimatedCost, firewall }) {
  if (!intentId || intentId !== outcomeIntentId) {
    return { allowed: false, reason: 'intent_outcome_mismatch' };
  }
  if (!firewall?.approvedCapabilities?.includes(capability)) {
    return { allowed: false, reason: 'intent_firewall_denied_capability' };
  }
  if (!Number.isFinite(estimatedCost) || estimatedCost < 0 || budgetRemaining < estimatedCost) {
    return { allowed: false, reason: 'budget_insufficient_or_invalid' };
  }
  return { allowed: true, remainingBudget: budgetRemaining - estimatedCost };
}

function verifyEphemeralPacket(packet, { now, consumedNonces }) {
  if (!packet || packet.executionMode !== 'disconnected') {
    return { allowed: false, reason: 'unsupported_execution_mode' };
  }
  if (packet.productionWrite === true || packet.publicExposure === true) {
    return { allowed: false, reason: 'disconnected_packet_has_forbidden_authority' };
  }
  if (!packet.nonce || consumedNonces.has(packet.nonce)) {
    return { allowed: false, reason: 'replay_or_missing_nonce' };
  }
  if (!Number.isFinite(packet.expiresAt) || packet.expiresAt <= now) {
    return { allowed: false, reason: 'expired_packet' };
  }
  return { allowed: true };
}

// Intent-to-Outcome Fabric must fail closed on cross-intent routing.
assert.deepEqual(
  authorizeIntentOutcome({
    intentId: 'intent-a',
    outcomeIntentId: 'intent-b',
    capability: 'summarize',
    budgetRemaining: 10,
    estimatedCost: 1,
    firewall: { approvedCapabilities: ['summarize'] },
  }),
  { allowed: false, reason: 'intent_outcome_mismatch' },
);

// Capability and budget controls must be enforced before an ephemeral agent acts.
assert.deepEqual(
  authorizeIntentOutcome({
    intentId: 'intent-a',
    outcomeIntentId: 'intent-a',
    capability: 'publish',
    budgetRemaining: 10,
    estimatedCost: 1,
    firewall: { approvedCapabilities: ['summarize'] },
  }),
  { allowed: false, reason: 'intent_firewall_denied_capability' },
);

assert.deepEqual(
  authorizeIntentOutcome({
    intentId: 'intent-a',
    outcomeIntentId: 'intent-a',
    capability: 'summarize',
    budgetRemaining: 1,
    estimatedCost: 2,
    firewall: { approvedCapabilities: ['summarize'] },
  }),
  { allowed: false, reason: 'budget_insufficient_or_invalid' },
);

assert.deepEqual(
  authorizeIntentOutcome({
    intentId: 'intent-a',
    outcomeIntentId: 'intent-a',
    capability: 'summarize',
    budgetRemaining: 3,
    estimatedCost: 2,
    firewall: { approvedCapabilities: ['summarize'] },
  }),
  { allowed: true, remainingBudget: 1 },
);

// Disconnected/edge execution remains non-authoritative and replay-safe.
const consumedNonces = new Set();
const validPacket = {
  executionMode: 'disconnected',
  productionWrite: false,
  publicExposure: false,
  nonce: 'nonce-1',
  expiresAt: 200,
};
assert.deepEqual(verifyEphemeralPacket(validPacket, { now: 100, consumedNonces }), { allowed: true });
consumedNonces.add(validPacket.nonce);
assert.deepEqual(
  verifyEphemeralPacket(validPacket, { now: 100, consumedNonces }),
  { allowed: false, reason: 'replay_or_missing_nonce' },
);
assert.deepEqual(
  verifyEphemeralPacket({ ...validPacket, nonce: 'nonce-2', productionWrite: true }, { now: 100, consumedNonces }),
  { allowed: false, reason: 'disconnected_packet_has_forbidden_authority' },
);
assert.deepEqual(
  verifyEphemeralPacket({ ...validPacket, nonce: 'nonce-3', expiresAt: 100 }, { now: 100, consumedNonces }),
  { allowed: false, reason: 'expired_packet' },
);

// Lifecycle projection must never skip reviewable states.
assert.deepEqual(nextLifecycleState('CODED', 'TESTED'), { allowed: true, state: 'TESTED' });
assert.deepEqual(nextLifecycleState('CODED', 'DEPLOYED'), {
  allowed: false,
  reason: 'strict_adjacent_transition_required',
});
assert.deepEqual(nextLifecycleState('DEPLOYED', 'VERIFIED_LIVE'), {
  allowed: true,
  state: 'VERIFIED_LIVE',
});

console.log('pantavion-sovereign-intent-outcome-swarm-boundaries-test: PASS');
