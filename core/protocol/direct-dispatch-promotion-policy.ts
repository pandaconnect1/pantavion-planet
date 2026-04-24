// core/protocol/direct-dispatch-promotion-policy.ts

export interface PantavionDirectDispatchPromotionProbeResult {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  disposition: string;
  bridgeMode: string;
  promotionOutcome: 'promoted' | 'fallback-promoted' | 'watch' | 'blocked';
}

export interface PantavionDirectDispatchPromotionDecision {
  status: 'direct-promoted' | 'bridge-ready' | 'watch' | 'blocked';
  promotedCount: number;
  fallbackPromotedCount: number;
  watchCount: number;
  blockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateDirectDispatchPromotion(
  probes: PantavionDirectDispatchPromotionProbeResult[],
): PantavionDirectDispatchPromotionDecision {
  const promotedCount = probes.filter((item) => item.promotionOutcome === 'promoted').length;
  const fallbackPromotedCount = probes.filter((item) => item.promotionOutcome === 'fallback-promoted').length;
  const watchCount = probes.filter((item) => item.promotionOutcome === 'watch').length;
  const blockedCount = probes.filter((item) => item.promotionOutcome === 'blocked').length;

  let status: PantavionDirectDispatchPromotionDecision['status'] = 'watch';

  if (blockedCount > 0) {
    status = 'blocked';
  } else if (promotedCount === probes.length && probes.length > 0) {
    status = 'direct-promoted';
  } else if (promotedCount > 0 || fallbackPromotedCount > 0) {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    fallbackPromotedCount > 0 ? 'Promote fallback-promoted lanes toward fully direct-promoted dispatch.' : '',
    watchCount > 0 ? 'Tighten direct-dispatch routing preferences for watch-grade lanes.' : '',
    blockedCount > 0 ? 'Remove blocked lanes before claiming direct dispatch promotion.' : '',
    promotedCount > 0 ? 'Preserve promoted lanes as preferred direct dispatch routes.' : '',
  ]);

  return {
    status,
    promotedCount,
    fallbackPromotedCount,
    watchCount,
    blockedCount,
    actions,
  };
}

export default evaluateDirectDispatchPromotion;
