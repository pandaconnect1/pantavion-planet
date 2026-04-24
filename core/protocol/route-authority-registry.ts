// core/protocol/route-authority-registry.ts

export interface PantavionRouteAuthorityEntry {
  capabilityKey: string;
  operationKey: string;
  primaryAdapterKey: string;
  primaryEndpointKey: string;
  backupAdapterKeys: string[];
  backupEndpointKeys: string[];
  forbiddenAdapterKeys: string[];
  authorityReason: string;
}

export interface PantavionRouteAuthorityRegistrySnapshot {
  generatedAt: string;
  count: number;
  keys: string[];
}

function nowIso(): string {
  return new Date().toISOString();
}

const ROUTE_AUTHORITY_ENTRIES: PantavionRouteAuthorityEntry[] = [
  {
    capabilityKey: 'external-provider-routing',
    operationKey: 'dispatch-to-provider',
    primaryAdapterKey: 'pantavion-external-provider-bridge',
    primaryEndpointKey: 'bridge-external-routing',
    backupAdapterKeys: ['pantavion-kernel-governor'],
    backupEndpointKeys: ['bridge-governed-kernel'],
    forbiddenAdapterKeys: [],
    authorityReason: 'External routing must prefer the external bridge as primary lane.',
  },
  {
    capabilityKey: 'voice-turn-processing',
    operationKey: 'process-turn',
    primaryAdapterKey: 'pantavion-voice-runtime',
    primaryEndpointKey: 'bridge-voice-stream',
    backupAdapterKeys: ['pantavion-kernel-governor'],
    backupEndpointKeys: ['bridge-governed-kernel'],
    forbiddenAdapterKeys: [],
    authorityReason: 'Voice turn processing must prefer voice runtime as primary lane.',
  },
  {
    capabilityKey: 'research-intake',
    operationKey: 'collect-sources',
    primaryAdapterKey: 'pantavion-research-intake',
    primaryEndpointKey: 'bridge-research-evidence',
    backupAdapterKeys: ['pantavion-kernel-governor'],
    backupEndpointKeys: ['bridge-governed-kernel'],
    forbiddenAdapterKeys: [],
    authorityReason: 'Research intake prefers verified research endpoint.',
  },
  {
    capabilityKey: 'report-export',
    operationKey: 'export',
    primaryAdapterKey: 'pantavion-reporting-export',
    primaryEndpointKey: 'bridge-export-render',
    backupAdapterKeys: ['pantavion-kernel-governor'],
    backupEndpointKeys: ['bridge-governed-kernel'],
    forbiddenAdapterKeys: [],
    authorityReason: 'Report export prefers deterministic export renderer.',
  },
  {
    capabilityKey: 'kernel-decisioning',
    operationKey: 'decide',
    primaryAdapterKey: 'pantavion-kernel-governor',
    primaryEndpointKey: 'bridge-governed-kernel',
    backupAdapterKeys: ['pantavion-reporting-export'],
    backupEndpointKeys: ['bridge-export-render'],
    forbiddenAdapterKeys: [],
    authorityReason: 'Kernel decisioning must remain under governed kernel authority.',
  },
];

export function listRouteAuthorityEntries(): PantavionRouteAuthorityEntry[] {
  return JSON.parse(JSON.stringify(ROUTE_AUTHORITY_ENTRIES)) as PantavionRouteAuthorityEntry[];
}

export function getRouteAuthorityEntry(
  capabilityKey: string,
  operationKey: string,
): PantavionRouteAuthorityEntry | null {
  const item = ROUTE_AUTHORITY_ENTRIES.find(
    (entry) =>
      entry.capabilityKey === capabilityKey &&
      entry.operationKey === operationKey,
  );

  return item ? (JSON.parse(JSON.stringify(item)) as PantavionRouteAuthorityEntry) : null;
}

export function getRouteAuthorityRegistrySnapshot(): PantavionRouteAuthorityRegistrySnapshot {
  const list = listRouteAuthorityEntries();

  return {
    generatedAt: nowIso(),
    count: list.length,
    keys: list.map((item) => `${item.capabilityKey}:${item.operationKey}`),
  };
}

export default listRouteAuthorityEntries;
