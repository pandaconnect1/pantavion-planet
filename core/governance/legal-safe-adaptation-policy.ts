// core/governance/legal-safe-adaptation-policy.ts

export type PantavionAdaptationActionType =
  | 'extract-public-principles'
  | 'copy-foreign-source-code'
  | 'use-leaked-internal-doc'
  | 'rewrite-clean-spec'
  | 'ship-sensitive-jurisdiction-without-review'
  | 'promote-global-policy-with-founder-approval';

export interface PantavionLegalSafeEvaluationRecord {
  actionType: PantavionAdaptationActionType;
  allowed: boolean;
  reason: string;
  riskTier: 'low' | 'medium' | 'high' | 'critical';
}

export interface PantavionLegalSafePolicySnapshot {
  generatedAt: string;
  evaluationCount: number;
  allowedCount: number;
  blockedCount: number;
  criticalBlockedCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function evaluateLegalSafeAction(
  actionType: PantavionAdaptationActionType,
): PantavionLegalSafeEvaluationRecord {
  switch (actionType) {
    case 'extract-public-principles':
      return {
        actionType,
        allowed: true,
        reason: 'Public principles and capability lessons may be studied and re-expressed independently.',
        riskTier: 'low',
      };
    case 'rewrite-clean-spec':
      return {
        actionType,
        allowed: true,
        reason: 'Independent Pantavion clean-spec rewriting is allowed and required.',
        riskTier: 'low',
      };
    case 'promote-global-policy-with-founder-approval':
      return {
        actionType,
        allowed: true,
        reason: 'High-risk global policy is allowed when founder approval is explicitly present.',
        riskTier: 'medium',
      };
    case 'copy-foreign-source-code':
      return {
        actionType,
        allowed: false,
        reason: 'Foreign source code copying is blocked by legal-safe doctrine.',
        riskTier: 'critical',
      };
    case 'use-leaked-internal-doc':
      return {
        actionType,
        allowed: false,
        reason: 'Leaked or private internal materials are blocked entirely.',
        riskTier: 'critical',
      };
    case 'ship-sensitive-jurisdiction-without-review':
      return {
        actionType,
        allowed: false,
        reason: 'Sensitive jurisdiction rollout requires explicit review before deployment.',
        riskTier: 'high',
      };
  }
}

export function getLegalSafePolicySnapshot(
  evaluations: PantavionLegalSafeEvaluationRecord[],
): PantavionLegalSafePolicySnapshot {
  return {
    generatedAt: nowIso(),
    evaluationCount: evaluations.length,
    allowedCount: evaluations.filter((item) => item.allowed).length,
    blockedCount: evaluations.filter((item) => !item.allowed).length,
    criticalBlockedCount: evaluations.filter(
      (item) => !item.allowed && item.riskTier === 'critical',
    ).length,
  };
}

export default evaluateLegalSafeAction;
