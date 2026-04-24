// core/protocol/external-routing-promotion-policy.ts

type UnknownRecord = Record<string, unknown>;

export interface PantavionExternalRoutingPromotionProbeResult {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  disposition: string;
  bridgeMode: string;
  routeStatus: 'promoted' | 'bridge-ready' | 'watch' | 'blocked';
}

export interface PantavionExternalRoutingPromotionDecision {
  status: 'promoted' | 'bridge-ready' | 'watch' | 'blocked';
  promotedCount: number;
  bridgeReadyCount: number;
  watchCount: number;
  blockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateExternalRoutingPromotion(
  probes: PantavionExternalRoutingPromotionProbeResult[],
): PantavionExternalRoutingPromotionDecision {
  const promotedCount = probes.filter((item) => item.routeStatus === 'promoted').length;
  const bridgeReadyCount = probes.filter((item) => item.routeStatus === 'bridge-ready').length;
  const watchCount = probes.filter((item) => item.routeStatus === 'watch').length;
  const blockedCount = probes.filter((item) => item.routeStatus === 'blocked').length;

  let status: PantavionExternalRoutingPromotionDecision['status'] = 'watch';

  if (blockedCount > 0) {
    status = 'blocked';
  } else if (promotedCount === probes.length && probes.length > 0) {
    status = 'promoted';
  } else if (promotedCount > 0 || bridgeReadyCount > 0) {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    promotedCount < probes.length ? 'Promote fallback-dispatched paths toward direct dispatched routing.' : '',
    watchCount > 0 ? 'Reduce watch-grade provider paths by tightening endpoint routing selection.' : '',
    blockedCount > 0 ? 'Remove blocked paths before treating routing as live-ready.' : '',
    promotedCount > 0 ? 'Preserve promoted routes as preferred dispatch lanes.' : '',
  ]);

  return {
    status,
    promotedCount,
    bridgeReadyCount,
    watchCount,
    blockedCount,
    actions,
  };
}

export default evaluateExternalRoutingPromotion;
