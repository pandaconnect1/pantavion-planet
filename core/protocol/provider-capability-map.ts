// core/protocol/provider-capability-map.ts

export type PantavionExternalProviderRouteKind =
  | 'chat-completion'
  | 'tool-routing'
  | 'evidence-retrieval'
  | 'voice-turn'
  | 'export-render';

export type PantavionExternalProviderExecutionClass =
  | 'verified'
  | 'bounded-generative'
  | 'generative'
  | 'deterministic-bridge';

export interface PantavionExternalProviderCapabilityRoute {
  capabilityKey: string;
  defaultOperationKey: string;
  routeKind: PantavionExternalProviderRouteKind;
  executionClass: PantavionExternalProviderExecutionClass;
  endpointKey: string;
  truthBoundary: 'deterministic' | 'verified' | 'generative' | 'hybrid';
  requestShape: string;
  responseShape: string;
  preferredAdapterKey?: string;
}

export interface PantavionExternalProviderCapabilityMapSnapshot {
  generatedAt: string;
  count: number;
  capabilityKeys: string[];
  endpointKeys: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const CAPABILITY_ROUTES: PantavionExternalProviderCapabilityRoute[] = [
  {
    capabilityKey: 'external-provider-routing',
    defaultOperationKey: 'dispatch-to-provider',
    routeKind: 'tool-routing',
    executionClass: 'bounded-generative',
    endpointKey: 'bridge-external-routing',
    truthBoundary: 'hybrid',
    requestShape: 'dispatch-envelope',
    responseShape: 'provider-response-envelope',
    preferredAdapterKey: 'pantavion-external-provider-bridge',
  },
  {
    capabilityKey: 'research-intake',
    defaultOperationKey: 'collect-sources',
    routeKind: 'evidence-retrieval',
    executionClass: 'verified',
    endpointKey: 'bridge-research-evidence',
    truthBoundary: 'verified',
    requestShape: 'research-query-bundle',
    responseShape: 'evidence-bundle',
    preferredAdapterKey: 'pantavion-research-intake',
  },
  {
    capabilityKey: 'voice-turn-processing',
    defaultOperationKey: 'process-turn',
    routeKind: 'voice-turn',
    executionClass: 'bounded-generative',
    endpointKey: 'bridge-voice-stream',
    truthBoundary: 'hybrid',
    requestShape: 'voice-turn-envelope',
    responseShape: 'voice-turn-result',
    preferredAdapterKey: 'pantavion-voice-runtime',
  },
  {
    capabilityKey: 'report-export',
    defaultOperationKey: 'export',
    routeKind: 'export-render',
    executionClass: 'deterministic-bridge',
    endpointKey: 'bridge-export-render',
    truthBoundary: 'deterministic',
    requestShape: 'report-export-request',
    responseShape: 'report-export-result',
    preferredAdapterKey: 'pantavion-reporting-export',
  },
  {
    capabilityKey: 'kernel-decisioning',
    defaultOperationKey: 'decide',
    routeKind: 'chat-completion',
    executionClass: 'verified',
    endpointKey: 'bridge-governed-kernel',
    truthBoundary: 'verified',
    requestShape: 'kernel-decision-request',
    responseShape: 'kernel-decision-response',
    preferredAdapterKey: 'pantavion-kernel-governor',
  },
];

export function listExternalProviderCapabilityRoutes(): PantavionExternalProviderCapabilityRoute[] {
  return JSON.parse(JSON.stringify(CAPABILITY_ROUTES)) as PantavionExternalProviderCapabilityRoute[];
}

export function getExternalProviderCapabilityRoute(
  capabilityKey: string,
): PantavionExternalProviderCapabilityRoute | null {
  const item = CAPABILITY_ROUTES.find((route) => route.capabilityKey === capabilityKey);
  return item ? (JSON.parse(JSON.stringify(item)) as PantavionExternalProviderCapabilityRoute) : null;
}

export function getExternalProviderCapabilityMapSnapshot(): PantavionExternalProviderCapabilityMapSnapshot {
  const routes = listExternalProviderCapabilityRoutes();

  return {
    generatedAt: nowIso(),
    count: routes.length,
    capabilityKeys: routes.map((route) => route.capabilityKey),
    endpointKeys: [...new Set(routes.map((route) => route.endpointKey))],
  };
}

export default listExternalProviderCapabilityRoutes;
