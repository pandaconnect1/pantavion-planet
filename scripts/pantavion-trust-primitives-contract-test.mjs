import assert from 'node:assert/strict';
import { AgeAssuranceError, verifyAgeEvidence } from '../lib/trust/age-assurance.ts';
import { AuthorityError, authorizeExecution, narrowAuthority } from '../lib/trust/execution-authority.ts';

const now = new Date('2026-09-15T12:00:00Z');
const validAgeEvidence = {
  provider: 'provider-neutral-test',
  claim: 'OVER_18',
  assuranceLevel: 'HIGH',
  jurisdiction: 'cy',
  issuedAt: '2026-09-15T11:00:00Z',
  expiresAt: '2026-09-16T11:00:00Z',
  evidenceId: 'evidence:test:1',
  serverVerified: true,
  rawIdentityStored: false,
};

const verified = verifyAgeEvidence(validAgeEvidence, now);
assert.equal(verified.band, 'ADULT_18_PLUS');
assert.deepEqual(verified.claims, ['OVER_13', 'OVER_15', 'OVER_18']);
assert.equal(verified.jurisdiction, 'CY');

assert.throws(
  () => verifyAgeEvidence({ ...validAgeEvidence, serverVerified: false }, now),
  (error) => error instanceof AgeAssuranceError && error.code === 'CLIENT_ASSERTION_REJECTED',
);
assert.throws(
  () => verifyAgeEvidence({ ...validAgeEvidence, expiresAt: '2026-09-15T11:59:59Z' }, now),
  (error) => error instanceof AgeAssuranceError && error.code === 'EXPIRED_EVIDENCE',
);

const parent = {
  actorId: 'human:owner',
  authoritySource: 'FOUNDER',
  capabilities: ['trust.verify_age', 'deploy.preview'],
  jurisdiction: 'CY',
  issuedAt: '2026-09-15T11:00:00Z',
  expiresAt: '2026-09-15T13:00:00Z',
  auditId: 'audit:parent',
  approvalRequired: false,
};

authorizeExecution(parent, 'trust.verify_age', now);
assert.throws(
  () => authorizeExecution(parent, 'deploy.production', now),
  (error) => error instanceof AuthorityError && error.code === 'CAPABILITY_DENIED',
);

const child = narrowAuthority(parent, 'agent:trust-worker', ['trust.verify_age', 'deploy.production'], 'audit:child');
assert.deepEqual(child.capabilities, ['trust.verify_age']);
assert.equal(child.actorId, 'agent:trust-worker');

assert.throws(
  () => authorizeExecution({ ...parent, approvalRequired: true }, 'trust.verify_age', now),
  (error) => error instanceof AuthorityError && error.code === 'APPROVAL_REQUIRED',
);

console.log('pantavion trust primitives contract: PASS');
