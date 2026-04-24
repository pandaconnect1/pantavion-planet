// core/protocol/canonical-routing-truth.ts

export type PantavionCanonicalDispatchDisposition =
  | 'primary-dispatched'
  | 'bridge-dispatched'
  | 'fallback-dispatched'
  | 'shadow-dispatched'
  | 'blocked';

export interface PantavionCanonicalRoutingTruthInput {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  rawDisposition: string;
  bridgeMode: string;
  routeSelectorOutcome?: string;
  directDispatchOutcome?: string;
  primaryCutoverOutcome?: string;
  bypassOutcome?: string;
}

export interface PantavionCanonicalRoutingTruth {
  capabilityKey: string;
  operationKey: string;
  adapterKey: string;
  endpointKey: string;
  canonicalDisposition: PantavionCanonicalDispatchDisposition;
  truthReason: string;
  rawDisposition: string;
  bridgeMode: string;
  routeSelectorOutcome?: string;
  directDispatchOutcome?: string;
  primaryCutoverOutcome?: string;
  bypassOutcome?: string;
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export function normalizeCanonicalRoutingTruth(
  input: PantavionCanonicalRoutingTruthInput,
): PantavionCanonicalRoutingTruth {
  const rawDisposition = readString(input.rawDisposition, 'unknown');
  const bridgeMode = readString(input.bridgeMode, 'watch');
  const routeSelectorOutcome = readString(input.routeSelectorOutcome);
  const directDispatchOutcome = readString(input.directDispatchOutcome);
  const primaryCutoverOutcome = readString(input.primaryCutoverOutcome);
  const bypassOutcome = readString(input.bypassOutcome);

  if (rawDisposition === 'blocked') {
    return {
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      adapterKey: input.adapterKey,
      endpointKey: input.endpointKey,
      canonicalDisposition: 'blocked',
      truthReason: 'Raw disposition is blocked.',
      rawDisposition,
      bridgeMode,
      routeSelectorOutcome,
      directDispatchOutcome,
      primaryCutoverOutcome,
      bypassOutcome,
    };
  }

  if (
    bypassOutcome === 'bypass-active' ||
    primaryCutoverOutcome === 'primary-active' ||
    directDispatchOutcome === 'promoted' ||
    routeSelectorOutcome === 'direct-selected'
  ) {
    return {
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      adapterKey: input.adapterKey,
      endpointKey: input.endpointKey,
      canonicalDisposition: 'primary-dispatched',
      truthReason:
        'Lane is treated as primary because authoritative primary signals are present.',
      rawDisposition,
      bridgeMode,
      routeSelectorOutcome,
      directDispatchOutcome,
      primaryCutoverOutcome,
      bypassOutcome,
    };
  }

  if (bridgeMode === 'bridge-ready' || bridgeMode === 'live-ready') {
    return {
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      adapterKey: input.adapterKey,
      endpointKey: input.endpointKey,
      canonicalDisposition: 'bridge-dispatched',
      truthReason:
        'Lane is healthy enough for bridge dispatch, but not yet canonical primary.',
      rawDisposition,
      bridgeMode,
      routeSelectorOutcome,
      directDispatchOutcome,
      primaryCutoverOutcome,
      bypassOutcome,
    };
  }

  if (rawDisposition === 'fallback-dispatched') {
    return {
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      adapterKey: input.adapterKey,
      endpointKey: input.endpointKey,
      canonicalDisposition: 'fallback-dispatched',
      truthReason: 'Lane still depends on fallback semantics without primary proof.',
      rawDisposition,
      bridgeMode,
      routeSelectorOutcome,
      directDispatchOutcome,
      primaryCutoverOutcome,
      bypassOutcome,
    };
  }

  return {
    capabilityKey: input.capabilityKey,
    operationKey: input.operationKey,
    adapterKey: input.adapterKey,
    endpointKey: input.endpointKey,
    canonicalDisposition: 'shadow-dispatched',
    truthReason: 'Lane is active but does not yet map cleanly to primary/bridge/fallback.',
    rawDisposition,
    bridgeMode,
    routeSelectorOutcome,
    directDispatchOutcome,
    primaryCutoverOutcome,
    bypassOutcome,
  };
}

export function renderCanonicalRoutingTruth(
  items: PantavionCanonicalRoutingTruth[],
): string {
  return [
    'PANTAVION CANONICAL ROUTING TRUTH',
    ...items.flatMap((item) => [
      '',
      `${item.capabilityKey}:${item.operationKey}`,
      `canonicalDisposition=${item.canonicalDisposition}`,
      `adapter=${item.adapterKey}`,
      `endpoint=${item.endpointKey}`,
      `rawDisposition=${item.rawDisposition}`,
      `bridgeMode=${item.bridgeMode}`,
      `routeSelectorOutcome=${item.routeSelectorOutcome ?? ''}`,
      `directDispatchOutcome=${item.directDispatchOutcome ?? ''}`,
      `primaryCutoverOutcome=${item.primaryCutoverOutcome ?? ''}`,
      `bypassOutcome=${item.bypassOutcome ?? ''}`,
      `truthReason=${item.truthReason}`,
    ]),
  ].join('\n');
}

export default normalizeCanonicalRoutingTruth;
