import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyAgeAssurance } from '../lib/age-assurance/runtime';

test('self-declared DOB is never treated as high-assurance verification', () => {
  const result = verifyAgeAssurance({
    method: 'SELF_DECLARED',
    claimedDateOfBirth: '2000-01-01',
    jurisdiction: 'CY',
  });
  assert.equal(result.status, 'REVIEW_REQUIRED');
  assert.equal(result.assuranceLevel, 1);
  assert.equal(result.featurePolicy.dating, false);
});

test('camera path requires liveness', () => {
  const result = verifyAgeAssurance({
    method: 'CAMERA_LIVENESS',
    estimatedAge: 20,
    livenessPassed: false,
    jurisdiction: 'CY',
  });
  assert.equal(result.status, 'REJECTED');
  assert.equal(result.ageBand, 'UNKNOWN');
});

test('camera+liveness can verify an adult without retaining a raw image in the core', () => {
  const result = verifyAgeAssurance({
    method: 'CAMERA_LIVENESS',
    estimatedAge: 20,
    livenessPassed: true,
    jurisdiction: 'CY',
  });
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.ageBand, '18_PLUS');
  assert.equal(result.featurePolicy.dating, true);
});

test('verified teen is blocked from dating and unknown-adult DMs', () => {
  const result = verifyAgeAssurance({
    method: 'CAMERA_LIVENESS',
    estimatedAge: 16,
    livenessPassed: true,
    jurisdiction: 'CY',
  });
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.ageBand, '15_17');
  assert.equal(result.featurePolicy.dating, false);
  assert.equal(result.featurePolicy.directMessagingFromUnknownAdults, false);
});

test('verified credential is accepted at highest assurance level', () => {
  const result = verifyAgeAssurance({
    method: 'VERIFIED_CREDENTIAL',
    credentialAgeOver: 18,
    jurisdiction: 'CY',
  });
  assert.equal(result.status, 'VERIFIED');
  assert.equal(result.assuranceLevel, 3);
  assert.equal(result.ageBand, '18_PLUS');
});
