// core/protocol/primary-lane-cutover-policy.ts

export interface PantavionPrimaryLaneCutoverProbeResult {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  disposition: string;
  bridgeMode: string;
  cutoverOutcome: 'primary-active' | 'cutover-pending' | 'watch' | 'blocked';
}

export interface PantavionPrimaryLaneCutoverDecision {
  status: 'primary-cutover-complete' | 'bridge-ready' | 'watch' | 'blocked';
  primaryActiveCount: number;
  cutoverPendingCount: number;
  watchCount: number;
  blockedCount: number;
  actions: string[];
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function evaluatePrimaryLaneCutover(
  probes: PantavionPrimaryLaneCutoverProbeResult[],
): PantavionPrimaryLaneCutoverDecision {
  const primaryActiveCount = probes.filter((item) => item.cutoverOutcome === 'primary-active').length;
  const cutoverPendingCount = probes.filter((item) => item.cutoverOutcome === 'cutover-pending').length;
  const watchCount = probes.filter((item) => item.cutoverOutcome === 'watch').length;
  const blockedCount = probes.filter((item) => item.cutoverOutcome === 'blocked').length;

  let status: PantavionPrimaryLaneCutoverDecision['status'] = 'watch';

  if (blockedCount > 0) {
    status = 'blocked';
  } else if (primaryActiveCount === probes.length && probes.length > 0) {
    status = 'primary-cutover-complete';
  } else if (primaryActiveCount > 0 || cutoverPendingCount > 0) {
    status = 'bridge-ready';
  }

  const actions = uniqStrings([
    cutoverPendingCount > 0 ? 'Convert cutover-pending lanes into fully primary-active dispatch.' : '',
    watchCount > 0 ? 'Tighten primary lane rules for watch-grade lanes.' : '',
    blockedCount > 0 ? 'Remove blocked lanes before claiming cutover completion.' : '',
    primaryActiveCount > 0 ? 'Preserve primary-active lanes as authoritative primary routes.' : '',
  ]);

  return {
    status,
    primaryActiveCount,
    cutoverPendingCount,
    watchCount,
    blockedCount,
    actions,
  };
}

export default evaluatePrimaryLaneCutover;
