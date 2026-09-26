// core/continuity/directive-continuity-contract.ts
// Canonical, provider-independent contract for durable Pantavion directives.
// Storage adapters MUST persist this contract; runtime memory alone is never authoritative.

export const DIRECTIVE_CONTRACT_VERSION = 1 as const;

export const DIRECTIVE_STAGES = [
  'DIRECTIVE_CAPTURED',
  'INTENT_PRESERVED',
  'OWNER_ASSIGNED',
  'ARTIFACT_BOUND',
  'EXECUTION_PLAN',
  'IMPLEMENTING',
  'EXECUTION_EVIDENCE',
  'TESTED',
  'DEPLOYED_WHEN_AUTHORIZED',
  'VERIFIED_LIVE',
] as const;

export type DirectiveStage = (typeof DIRECTIVE_STAGES)[number];

export const DIRECTIVE_REALITY_STATES = [
  'OPEN',
  'IN_PROGRESS',
  'BLOCKED',
  'CLAIMED_DONE_BUT_UNVERIFIED',
  'NOT_DONE',
  'VERIFIED_DONE',
  'SUPERSEDED',
] as const;

export type DirectiveRealityState = (typeof DIRECTIVE_REALITY_STATES)[number];

export type DirectiveNoteKind =
  | 'requirement'
  | 'promise'
  | 'decision'
  | 'note'
  | 'blocker'
  | 'failure'
  | 'claim'
  | 'correction'
  | 'follow-up'
  | 'verification';

export interface DirectiveNote {
  noteId: string;
  kind: DirectiveNoteKind;
  text: string;
  recordedAt: string;
  source?: DirectiveSource;
  evidenceIds?: string[];
}

export type DirectiveSourceKind =
  | 'chat'
  | 'voice'
  | 'email'
  | 'admin'
  | 'github'
  | 'import'
  | 'system';

export interface DirectiveSource {
  kind: DirectiveSourceKind;
  sourceId: string;
  capturedAt: string;
  immutableFingerprint: string;
}

export interface DirectiveEvidence {
  evidenceId: string;
  kind: 'artifact' | 'test' | 'deployment' | 'live-check' | 'decision';
  uri: string;
  recordedAt: string;
  fingerprint?: string;
}

export interface PantavionDirectiveRecord {
  contractVersion: typeof DIRECTIVE_CONTRACT_VERSION;
  directiveId: string;
  canonicalKey: string;
  title: string;
  intent: string;
  stage: DirectiveStage;
  realityState: DirectiveRealityState;
  sources: DirectiveSource[];
  owner?: string;
  artifactRefs: string[];
  evidence: DirectiveEvidence[];
  notes: DirectiveNote[];
  createdAt: string;
  updatedAt: string;
  revision: number;
  supersedes?: string;
}

const STAGE_INDEX = new Map<DirectiveStage, number>(
  DIRECTIVE_STAGES.map((stage, index) => [stage, index]),
);

export function assertDirectiveTransition(
  current: DirectiveStage,
  next: DirectiveStage,
  evidence: DirectiveEvidence[] = [],
): void {
  const currentIndex = STAGE_INDEX.get(current) ?? -1;
  const nextIndex = STAGE_INDEX.get(next) ?? -1;

  if (nextIndex < currentIndex) {
    throw new Error(`directive_stage_regression:${current}->${next}`);
  }

  if (next === 'EXECUTION_EVIDENCE' && evidence.length === 0) {
    throw new Error('directive_execution_evidence_required');
  }

  if (next === 'TESTED' && !evidence.some((item) => item.kind === 'test')) {
    throw new Error('directive_test_evidence_required');
  }

  if (
    next === 'DEPLOYED_WHEN_AUTHORIZED' &&
    !evidence.some((item) => item.kind === 'deployment')
  ) {
    throw new Error('directive_deployment_evidence_required');
  }

  if (
    next === 'VERIFIED_LIVE' &&
    !evidence.some((item) => item.kind === 'live-check')
  ) {
    throw new Error('directive_live_check_evidence_required');
  }
}

export function assertDirectiveRecord(record: PantavionDirectiveRecord): void {
  if (record.contractVersion !== DIRECTIVE_CONTRACT_VERSION) {
    throw new Error('directive_contract_version_unsupported');
  }
  if (!record.directiveId || !record.canonicalKey || !record.intent) {
    throw new Error('directive_identity_or_intent_missing');
  }
  if (record.sources.length === 0) {
    throw new Error('directive_source_provenance_required');
  }
  if (
    record.realityState === 'VERIFIED_DONE' &&
    (record.stage !== 'VERIFIED_LIVE' ||
      !record.evidence.some((item) => item.kind === 'live-check'))
  ) {
    throw new Error('directive_verified_done_requires_live_evidence');
  }
  if (
    record.realityState === 'CLAIMED_DONE_BUT_UNVERIFIED' &&
    record.stage === 'VERIFIED_LIVE'
  ) {
    throw new Error('directive_unverified_claim_cannot_be_verified_live');
  }
  if (record.revision < 1 || !Number.isInteger(record.revision)) {
    throw new Error('directive_revision_invalid');
  }
  assertDirectiveTransition('DIRECTIVE_CAPTURED', record.stage, record.evidence);
}

export function isDirectiveVerifiedLive(record: PantavionDirectiveRecord): boolean {
  return (
    record.stage === 'VERIFIED_LIVE' &&
    record.evidence.some((item) => item.kind === 'live-check')
  );
}
