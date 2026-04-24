// core/kernel/final-closure-audit-policy.ts

export interface PantavionFinalClosureAuditInput {
  multilingual: {
    selectedLocale: string;
    selectedSource: string;
    candidateCount: number;
  };
  externalRoutingPromotion: {
    status: string;
    promotedCount: number;
    bridgeReadyCount: number;
    watchCount: number;
    blockedCount: number;
  };
  routeSelector: {
    status: string;
    directSelectedCount: number;
    fallbackSelectedCount: number;
    watchCount: number;
    blockedCount: number;
  };
  directDispatch: {
    status: string;
    promotedCount: number;
    fallbackPromotedCount: number;
    watchCount: number;
    blockedCount: number;
  };
  primaryCutover: {
    status: string;
    primaryActiveCount: number;
    cutoverPendingCount: number;
    watchCount: number;
    blockedCount: number;
  };
  fallbackBypass: {
    status: string;
    bypassActiveCount: number;
    cutoverPendingCount: number;
    watchCount: number;
    blockedCount: number;
  };
}

export interface PantavionFinalClosureAuditDecision {
  status:
    | 'closed-primary-ready'
    | 'operational-primary-ready'
    | 'bridge-ready'
    | 'watch'
    | 'blocked';
  closureScore: number;
  aggregateBlockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function clampScore(value: number): number {
  if (value < 0) {
    return 0;
  }
  if (value > 100) {
    return 100;
  }
  return Math.round(value);
}

export function evaluateFinalClosureAudit(
  input: PantavionFinalClosureAuditInput,
): PantavionFinalClosureAuditDecision {
  const aggregateBlockedCount =
    input.externalRoutingPromotion.blockedCount +
    input.routeSelector.blockedCount +
    input.directDispatch.blockedCount +
    input.primaryCutover.blockedCount +
    input.fallbackBypass.blockedCount;

  let score = 0;

  score += input.multilingual.selectedSource === 'explicit-user' ? 15 : 10;
  score += input.externalRoutingPromotion.status === 'bridge-ready' || input.externalRoutingPromotion.status === 'promoted' ? 15 : 8;
  score += input.routeSelector.status === 'selector-hardened' ? 20 : 8;
  score += input.routeSelector.directSelectedCount * 3;
  score += input.directDispatch.status === 'bridge-ready' || input.directDispatch.status === 'direct-promoted' ? 15 : 6;
  score += input.primaryCutover.status === 'bridge-ready' || input.primaryCutover.status === 'primary-cutover-complete' ? 10 : 4;
  score += input.fallbackBypass.status === 'bypass-enforced' ? 20 : 8;
  score += input.fallbackBypass.bypassActiveCount * 3;
  score -= aggregateBlockedCount * 20;

  const closureScore = clampScore(score);

  let status: PantavionFinalClosureAuditDecision['status'] = 'watch';

  if (aggregateBlockedCount > 0) {
    status = 'blocked';
  } else if (
    input.fallbackBypass.status === 'bypass-enforced' &&
    input.fallbackBypass.bypassActiveCount >= 2 &&
    input.routeSelector.status === 'selector-hardened'
  ) {
    status = 'closed-primary-ready';
  } else if (
    input.primaryCutover.status === 'bridge-ready' ||
    input.directDispatch.status === 'bridge-ready' ||
    input.fallbackBypass.status === 'bridge-ready'
  ) {
    status = 'operational-primary-ready';
  } else if (input.externalRoutingPromotion.status === 'bridge-ready') {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    input.fallbackBypass.bypassActiveCount >= 2
      ? 'Preserve bypass-active lanes as authoritative primary routes.'
      : 'Raise remaining lanes to authoritative primary route status.',
    input.routeSelector.status === 'selector-hardened'
      ? 'Preserve selector-hardened routing rules as the preferred dispatch baseline.'
      : 'Finish route selector hardening before final closure.',
    input.multilingual.selectedSource === 'explicit-user'
      ? 'Preserve explicit user locale priority in voice policy.'
      : 'Tighten multilingual voice locale resolution priority.',
    aggregateBlockedCount > 0
      ? 'Resolve blocked paths before closure signoff.'
      : 'No blocked paths remain in the audited closure set.',
  ]);

  return {
    status,
    closureScore,
    aggregateBlockedCount,
    actions,
  };
}

export default evaluateFinalClosureAudit;
