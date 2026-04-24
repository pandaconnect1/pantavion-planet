// core/protocol/external-provider-endpoint-registry.ts

export type PantavionExternalEndpointStatus =
  | 'ready'
  | 'watch'
  | 'degraded'
  | 'offline';

export type PantavionExternalEndpointMode =
  | 'simulated'
  | 'bridge-ready'
  | 'live-ready';

export interface PantavionExternalProviderEndpoint {
  endpointKey: string;
  displayName: string;
  providerKey: string;
  status: PantavionExternalEndpointStatus;
  mode: PantavionExternalEndpointMode;
  supportedCapabilities: string[];
  supportedOperations: string[];
  latencyBaselineMs: number;
  metadata: Record<string, unknown>;
}

export interface PantavionExternalProviderEndpointRegistrySnapshot {
  generatedAt: string;
  count: number;
  readyCount: number;
  watchCount: number;
  degradedCount: number;
  offlineCount: number;
  endpointKeys: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const ENDPOINTS: PantavionExternalProviderEndpoint[] = [
  {
    endpointKey: 'bridge-external-routing',
    displayName: 'Bridge External Routing',
    providerKey: 'external-bridge',
    status: 'degraded',
    mode: 'bridge-ready',
    supportedCapabilities: ['external-provider-routing'],
    supportedOperations: ['dispatch-to-provider', 'probe-health'],
    latencyBaselineMs: 240,
    metadata: {
      class: 'hybrid-bridge',
    },
  },
  {
    endpointKey: 'bridge-research-evidence',
    displayName: 'Bridge Research Evidence',
    providerKey: 'research-evidence',
    status: 'ready',
    mode: 'live-ready',
    supportedCapabilities: ['research-intake'],
    supportedOperations: ['collect-sources', 'bundle-evidence', 'score-sources'],
    latencyBaselineMs: 72,
    metadata: {
      class: 'verified-research',
    },
  },
  {
    endpointKey: 'bridge-voice-stream',
    displayName: 'Bridge Voice Stream',
    providerKey: 'voice-stream',
    status: 'watch',
    mode: 'bridge-ready',
    supportedCapabilities: ['voice-turn-processing'],
    supportedOperations: ['process-turn', 'start-voice-session', 'end-session'],
    latencyBaselineMs: 98,
    metadata: {
      class: 'voice-runtime',
    },
  },
  {
    endpointKey: 'bridge-export-render',
    displayName: 'Bridge Export Render',
    providerKey: 'export-render',
    status: 'ready',
    mode: 'bridge-ready',
    supportedCapabilities: ['report-export'],
    supportedOperations: ['export', 'render-report', 'render-summary'],
    latencyBaselineMs: 44,
    metadata: {
      class: 'deterministic-export',
    },
  },
  {
    endpointKey: 'bridge-governed-kernel',
    displayName: 'Bridge Governed Kernel',
    providerKey: 'governed-kernel',
    status: 'ready',
    mode: 'bridge-ready',
    supportedCapabilities: ['kernel-decisioning'],
    supportedOperations: ['decide', 'route', 'explain'],
    latencyBaselineMs: 26,
    metadata: {
      class: 'kernel-governor',
    },
  },
];

export function listExternalProviderEndpoints(): PantavionExternalProviderEndpoint[] {
  return JSON.parse(JSON.stringify(ENDPOINTS)) as PantavionExternalProviderEndpoint[];
}

export function getExternalProviderEndpoint(
  endpointKey: string,
): PantavionExternalProviderEndpoint | null {
  const item = ENDPOINTS.find((endpoint) => endpoint.endpointKey === endpointKey);
  return item ? (JSON.parse(JSON.stringify(item)) as PantavionExternalProviderEndpoint) : null;
}

export function selectExternalProviderEndpoint(input: {
  capabilityKey: string;
  operationKey?: string;
  preferredEndpointKey?: string;
}): PantavionExternalProviderEndpoint | null {
  const list = listExternalProviderEndpoints();

  if (input.preferredEndpointKey) {
    const preferred = list.find((endpoint) => endpoint.endpointKey === input.preferredEndpointKey);
    if (
      preferred &&
      preferred.supportedCapabilities.includes(input.capabilityKey) &&
      (input.operationKey ? preferred.supportedOperations.includes(input.operationKey) : true)
    ) {
      return preferred;
    }
  }

  const candidates = list
    .filter((endpoint) => endpoint.supportedCapabilities.includes(input.capabilityKey))
    .filter((endpoint) =>
      input.operationKey ? endpoint.supportedOperations.includes(input.operationKey) : true,
    )
    .sort((left, right) => {
      const rank = (status: PantavionExternalEndpointStatus): number => {
        switch (status) {
          case 'ready':
            return 0;
          case 'watch':
            return 1;
          case 'degraded':
            return 2;
          case 'offline':
            return 3;
          default:
            return 4;
        }
      };

      return rank(left.status) - rank(right.status);
    });

  return candidates[0] ?? null;
}

export function getExternalProviderEndpointRegistrySnapshot(): PantavionExternalProviderEndpointRegistrySnapshot {
  const list = listExternalProviderEndpoints();

  return {
    generatedAt: nowIso(),
    count: list.length,
    readyCount: list.filter((item) => item.status === 'ready').length,
    watchCount: list.filter((item) => item.status === 'watch').length,
    degradedCount: list.filter((item) => item.status === 'degraded').length,
    offlineCount: list.filter((item) => item.status === 'offline').length,
    endpointKeys: list.map((item) => item.endpointKey),
  };
}

export default listExternalProviderEndpoints;
