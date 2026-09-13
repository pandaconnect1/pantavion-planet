import assert from 'node:assert/strict';
import crypto from 'node:crypto';

const LIFECYCLE = ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE'];

function canonicalize(value) {
  return JSON.stringify(value, Object.keys(value).sort());
}

function snapshotDigest(snapshot) {
  return crypto.createHash('sha256').update(canonicalize(snapshot)).digest('hex');
}

function buildSnapshot(input) {
  const snapshot = {
    feature: input.feature,
    lifecycle: input.lifecycle,
    verification: input.verification,
    provenance: input.provenance,
    owner: input.owner,
    blocker: input.blocker ?? null,
    authority: {
      productionMutation: false,
      merge: false,
      deployment: false,
      publicRelease: false,
      ownerAdmission: false,
      externalAuthorization: false,
      agentActivation: false,
    },
  };
  return { snapshot, digest: snapshotDigest(snapshot) };
}

const base = buildSnapshot({
  feature: 'visible implementation-status/verification surface',
  lifecycle: 'TESTED',
  verification: { exactHead: 'example-exact-head', evidence: ['ci-success', 'status-contract'] },
  provenance: { source: 'repository', branch: 'reviewable-pr' },
  owner: { required: true, approved: false },
});

assert.equal(base.snapshot.lifecycle, 'TESTED');
assert.deepEqual(Object.keys(base.snapshot.authority).filter((key) => base.snapshot.authority[key]), []);
assert.equal(base.snapshot.blocker, null);
assert.equal(base.digest, snapshotDigest(base.snapshot));

const reordered = buildSnapshot({
  owner: { approved: false, required: true },
  provenance: { branch: 'reviewable-pr', source: 'repository' },
  verification: { evidence: ['ci-success', 'status-contract'], exactHead: 'example-exact-head' },
  lifecycle: 'TESTED',
  feature: 'visible implementation-status/verification surface',
});
assert.equal(reordered.digest, base.digest, 'equivalent snapshots must hash deterministically');

const tampered = { ...base.snapshot, lifecycle: 'VERIFIED_LIVE' };
assert.notEqual(snapshotDigest(tampered), base.digest, 'tampering must change the digest');

assert.deepEqual(LIFECYCLE, ['IDEA', 'CODED', 'TESTED', 'MERGED', 'DEPLOYED', 'VERIFIED_LIVE']);
for (const state of LIFECYCLE) {
  assert.equal(typeof state, 'string');
}

console.log('sovereign status snapshot integrity contract: ok');
