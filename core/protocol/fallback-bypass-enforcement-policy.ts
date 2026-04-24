// core/protocol/fallback-bypass-enforcement-policy.ts

export interface PantavionFallbackBypassProbeResult {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  preferredAdapterKey: string;
  preferredEndpointKey: string;
  disposition: string;
  bridgeMode: string;
  bypassOutcome: 'bypass-active' | 'cutover-pending' | 'watch' | 'blocked';
}

export interface PantavionFallbackBypassDecision {
  status: 'bypass-enforced' | 'bridge-ready' | 'watch' | 'blocked';
  bypassActiveCount: number;
  cutoverPendingCount: number;
  watchCount: number;
  blockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateFallbackBypassEnforcement(
  probes: PantavionFallbackBypassProbeResult[],
): PantavionFallbackBypassDecision {
  const bypassActiveCount = probes.filter((item) => item.bypassOutcome === 'bypass-active').length;
  const cutoverPendingCount = probes.filter((item) => item.bypassOutcome === 'cutover-pending').length;
  const watchCount = probes.filter((item) => item.bypassOutcome === 'watch').length;
  const blockedCount = probes.filter((item) => item.bypassOutcome === 'blocked').length;

  let status: PantavionFallbackBypassDecision['status'] = 'watch';

  if (blockedCount > 0) {
    status = 'blocked';
  } else if (bypassActiveCount === probes.length && probes.length > 0) {
    status = 'bypass-enforced';
  } else if (bypassActiveCount > 0 || cutoverPendingCount > 0) {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    bypassActiveCount > 0 ? 'Preserve bypass-active lanes as authoritative primary routes.' : '',
    cutoverPendingCount > 0 ? 'Convert cutover-pending lanes into bypass-active primary routes.' : '',
    watchCount > 0 ? 'Tighten fallback bypass enforcement for watch-grade lanes.' : '',
    blockedCount > 0 ? 'Remove blocked lanes before claiming bypass enforcement.' : '',
  ]);

  return {
    status,
    bypassActiveCount,
    cutoverPendingCount,
    watchCount,
    blockedCount,
    actions,
  };
}

export default evaluateFallbackBypassEnforcement;
