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
  'intent-to-outcome-fabric',
  'ephemeral-agent-swarm',
  'disconnected-edge-execution',
  'intent-firewall',
  'agent-capability-budget-control',
  'owner-control-integration',
  'technology-library',
  'implementation-status-verification-surface',
];

function isExactSha(value) {
  return typeof value === 'string' && /^[0-9a-f]{40}$/.test(value);
}

function validateRecoveryRecord(record) {
  return Boolean(
    record &&
      record.kind === 'recovery' &&
      typeof record.recordId === 'string' &&
      typeof record.sourceRef === 'string' &&
      typeof record.sourceSha256 === 'string' &&
      /^[0-9a-f]{64}$/.test(record.sourceSha256) &&
      record.syntheticRecordsCountedAsImplementation === 0 &&
      record.implementationState === 'IDEA',
  );
}

function validateImplementationStatus(status) {
  assert.deepEqual(status.lifecycle, LIFECYCLE);
  assert.deepEqual(Object.keys(status.workstreams).sort(), [...WORKSTREAMS].sort());
  assert.equal(status.syntheticRecordsCountedAsImplementation, 0);

  for (const [name, item] of Object.entries(status.workstreams)) {
    assert.ok(WORKSTREAMS.includes(name));
    assert.ok(LIFECYCLE.includes(item.state));
    if (item.state !== 'IDEA') assert.ok(isExactSha(item.commitSha));
    if (item.state === 'MERGED' || item.state === 'DEPLOYED' || item.state === 'VERIFIED_LIVE') {
      assert.equal(item.ownerApproved, true);
    }
    if (item.state === 'DEPLOYED' || item.state === 'VERIFIED_LIVE') {
      assert.equal(item.externalAuthorization, true);
    }
    if (item.state === 'VERIFIED_LIVE') {
      assert.equal(item.liveVerification?.verified, true);
      assert.ok(typeof item.liveVerification?.verifiedAt === 'string');
    }
  }
}

const recoveryRecord = {
  kind: 'recovery',
  recordId: 'recovery-20260904-2004-0001',
  sourceRef: 'github://pandaconnect1/pantavion-planet/main',
  sourceSha256: 'a'.repeat(64),
  syntheticRecordsCountedAsImplementation: 0,
  implementationState: 'IDEA',
};

assert.equal(validateRecoveryRecord(recoveryRecord), true);
assert.equal(
  validateRecoveryRecord({ ...recoveryRecord, implementationState: 'TESTED' }),
  false,
);
assert.equal(
  validateRecoveryRecord({ ...recoveryRecord, syntheticRecordsCountedAsImplementation: 1 }),
  false,
);

const validStatus = {
  lifecycle: LIFECYCLE,
  syntheticRecordsCountedAsImplementation: 0,
  workstreams: Object.fromEntries(
    WORKSTREAMS.map((name) => [name, { state: 'IDEA' }]),
  ),
};

validateImplementationStatus(validStatus);

const invalidSkip = structuredClone(validStatus);
invalidSkip.workstreams['intent-firewall'] = { state: 'DEPLOYED', commitSha: 'b'.repeat(40), ownerApproved: true, externalAuthorization: true };
assert.throws(() => validateImplementationStatus(invalidSkip), /liveVerification|verified/);

const invalidMissingOwnerGate = structuredClone(validStatus);
invalidMissingOwnerGate.workstreams['technology-library'] = { state: 'MERGED', commitSha: 'c'.repeat(40), ownerApproved: false };
assert.throws(() => validateImplementationStatus(invalidMissingOwnerGate));

const invalidSyntheticCount = structuredClone(validStatus);
invalidSyntheticCount.syntheticRecordsCountedAsImplementation = 1;
assert.throws(() => validateImplementationStatus(invalidSyntheticCount));

console.log('sovereign recovery/classification ledger contract: PASS');
