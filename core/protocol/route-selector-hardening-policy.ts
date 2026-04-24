// core/protocol/route-selector-hardening-policy.ts

export interface PantavionRouteSelectorProbeResult {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  disposition: string;
  bridgeMode: string;
  selectorOutcome: 'direct-selected' | 'fallback-selected' | 'watch' | 'blocked';
}

export interface PantavionRouteSelectorHardeningDecision {
  status: 'selector-hardened' | 'bridge-ready' | 'watch' | 'blocked';
  directSelectedCount: number;
  fallbackSelectedCount: number;
  watchCount: number;
  blockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluateRouteSelectorHardening(
  probes: PantavionRouteSelectorProbeResult[],
): PantavionRouteSelectorHardeningDecision {
  const directSelectedCount = probes.filter((item) => item.selectorOutcome === 'direct-selected').length;
  const fallbackSelectedCount = probes.filter((item) => item.selectorOutcome === 'fallback-selected').length;
  const watchCount = probes.filter((item) => item.selectorOutcome === 'watch').length;
  const blockedCount = probes.filter((item) => item.selectorOutcome === 'blocked').length;

  let status: PantavionRouteSelectorHardeningDecision['status'] = 'watch';

  if (blockedCount > 0) {
    status = 'blocked';
  } else if (directSelectedCount >= 3) {
    status = 'selector-hardened';
  } else if (directSelectedCount > 0 || fallbackSelectedCount > 0) {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    fallbackSelectedCount > 0 ? 'Promote fallback-selected routes toward direct-selected lanes.' : '',
    watchCount > 0 ? 'Tighten selector rules for watch-grade routes.' : '',
    blockedCount > 0 ? 'Remove blocked routes before claiming selector hardening.' : '',
    directSelectedCount > 0 ? 'Preserve direct-selected routes as preferred primary lanes.' : '',
  ]);

  return {
    status,
    directSelectedCount,
    fallbackSelectedCount,
    watchCount,
    blockedCount,
    actions,
  };
}

export default evaluateRouteSelectorHardening;
