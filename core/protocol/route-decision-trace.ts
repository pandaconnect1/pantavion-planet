// core/protocol/route-decision-trace.ts

import type { PantavionCanonicalRoutingTruth } from './canonical-routing-truth';
import type { PantavionRouteAuthorityEntry } from './route-authority-registry';

export interface PantavionRouteDecisionTrace {
  traceId: string;
  capabilityKey: string;
  operationKey: string;
  selectedLocale?: string;
  selectedSource?: string;
  authority: {
    primaryAdapterKey: string;
    primaryEndpointKey: string;
    authorityReason: string;
  };
  observed: {
    adapterKey: string;
    endpointKey: string;
    rawDisposition: string;
    canonicalDisposition: string;
    bridgeMode: string;
  };
  alignment: {
    adapterMatchesPrimary: boolean;
    endpointMatchesPrimary: boolean;
    truthAligned: boolean;
  };
  reason: string;
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function buildRouteDecisionTrace(input: {
  truth: PantavionCanonicalRoutingTruth;
  authority: PantavionRouteAuthorityEntry;
  selectedLocale?: string;
  selectedSource?: string;
}): PantavionRouteDecisionTrace {
  const adapterMatchesPrimary =
    input.truth.adapterKey === input.authority.primaryAdapterKey;

  const endpointMatchesPrimary =
    input.truth.endpointKey === input.authority.primaryEndpointKey;

  const truthAligned =
    adapterMatchesPrimary &&
    endpointMatchesPrimary &&
    input.truth.canonicalDisposition === 'primary-dispatched';

  return {
    traceId: createId('rdt'),
    capabilityKey: input.truth.capabilityKey,
    operationKey: input.truth.operationKey,
    selectedLocale: input.selectedLocale,
    selectedSource: input.selectedSource,
    authority: {
      primaryAdapterKey: input.authority.primaryAdapterKey,
      primaryEndpointKey: input.authority.primaryEndpointKey,
      authorityReason: input.authority.authorityReason,
    },
    observed: {
      adapterKey: input.truth.adapterKey,
      endpointKey: input.truth.endpointKey,
      rawDisposition: input.truth.rawDisposition,
      canonicalDisposition: input.truth.canonicalDisposition,
      bridgeMode: input.truth.bridgeMode,
    },
    alignment: {
      adapterMatchesPrimary,
      endpointMatchesPrimary,
      truthAligned,
    },
    reason: truthAligned
      ? 'Observed route fully matches primary authority and canonical truth.'
      : 'Observed route does not yet fully match primary authority or canonical disposition.',
  };
}

export function renderRouteDecisionTraces(
  traces: PantavionRouteDecisionTrace[],
): string {
  return [
    'PANTAVION ROUTE DECISION TRACES',
    ...traces.flatMap((trace) => [
      '',
      `${trace.capabilityKey}:${trace.operationKey}`,
      `selectedLocale=${trace.selectedLocale ?? ''}`,
      `selectedSource=${trace.selectedSource ?? ''}`,
      `primaryAdapter=${trace.authority.primaryAdapterKey}`,
      `primaryEndpoint=${trace.authority.primaryEndpointKey}`,
      `observedAdapter=${trace.observed.adapterKey}`,
      `observedEndpoint=${trace.observed.endpointKey}`,
      `rawDisposition=${trace.observed.rawDisposition}`,
      `canonicalDisposition=${trace.observed.canonicalDisposition}`,
      `bridgeMode=${trace.observed.bridgeMode}`,
      `adapterMatchesPrimary=${trace.alignment.adapterMatchesPrimary ? 'yes' : 'no'}`,
      `endpointMatchesPrimary=${trace.alignment.endpointMatchesPrimary ? 'yes' : 'no'}`,
      `truthAligned=${trace.alignment.truthAligned ? 'yes' : 'no'}`,
      `reason=${trace.reason}`,
    ]),
  ].join('\n');
}

export default buildRouteDecisionTrace;
