// core/continuity/directive-continuity-contract.test.ts
import {
  assertDirectiveTransition,
  isDirectiveVerifiedLive,
  type PantavionDirectiveRecord,
} from './directive-continuity-contract';

describe('directive continuity contract', () => {
  it('blocks VERIFIED_LIVE without a real live-check evidence record', () => {
    expect(() => assertDirectiveTransition('TESTED', 'VERIFIED_LIVE', [])).toThrow(
      'directive_live_check_evidence_required',
    );
  });

  it('blocks stage regression', () => {
    expect(() => assertDirectiveTransition('TESTED', 'IMPLEMENTING', [])).toThrow(
      'directive_stage_regression',
    );
  });

  it('accepts VERIFIED_LIVE only with live evidence', () => {
    const record = {
      contractVersion: 1,
      directiveId: 'PANTAVION-REQ-RESILIENCE-001',
      canonicalKey: 'resilience.always-available-public-shell',
      title: 'Always available Pantavion public shell',
      intent: 'A provider failure must not make the Pantavion public presence disappear.',
      stage: 'VERIFIED_LIVE',
      realityState: 'VERIFIED_DONE',
      sources: [{
        kind: 'chat',
        sourceId: 'historical-directive',
        capturedAt: '2026-09-26T00:00:00.000Z',
        immutableFingerprint: 'historical-source-fingerprint',
      }],
      artifactRefs: [],
      notes: [],
      evidence: [{
        evidenceId: 'live-1',
        kind: 'live-check',
        uri: 'evidence://synthetic-live-check',
        recordedAt: '2026-09-26T00:00:00.000Z',
      }],
      createdAt: '2026-09-26T00:00:00.000Z',
      updatedAt: '2026-09-26T00:00:00.000Z',
      revision: 1,
    } satisfies PantavionDirectiveRecord;

    expect(isDirectiveVerifiedLive(record)).toBe(true);
  });

  it('does not allow an unverified completion claim to masquerade as VERIFIED_LIVE', () => {
    expect(() =>
      assertDirectiveTransition('IMPLEMENTING', 'VERIFIED_LIVE', []),
    ).toThrow('directive_live_check_evidence_required');
  });
});
