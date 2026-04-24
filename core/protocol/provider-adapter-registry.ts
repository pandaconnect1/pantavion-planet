// core/protocol/provider-adapter-registry.ts

import * as ProtocolGatewayModule from './protocol-gateway';

type UnknownRecord = Record<string, unknown>;
type AnyFn = (...args: unknown[]) => unknown;

export type PantavionProviderAdapterFamily =
  | 'internal'
  | 'runtime'
  | 'memory'
  | 'reporting'
  | 'voice'
  | 'resilience'
  | 'research'
  | 'external';

export type PantavionProviderAdapterAvailability =
  | 'ready'
  | 'degraded'
  | 'offline'
  | 'maintenance'
  | 'retired';

export type PantavionProviderTrustTier =
  | 'system'
  | 'high'
  | 'trusted'
  | 'bounded';

export type PantavionProviderAdapterSyncStatus =
  | 'pending'
  | 'synced'
  | 'skipped';

export interface PantavionProviderAdapterMetadata {
  [key: string]: unknown;
}

export interface PantavionProviderAdapterRecord {
  adapterKey: string;
  displayName: string;
  family: PantavionProviderAdapterFamily;
  providerKind: 'internal' | 'hybrid' | 'external';
  availability: PantavionProviderAdapterAvailability;
  trustTier: PantavionProviderTrustTier;
  authModes: string[];
  executionModes: string[];
  truthModes: string[];
  supportedCapabilities: string[];
  supportedOperations: string[];
  metadata: PantavionProviderAdapterMetadata;
  createdAt: string;
  updatedAt: string;
  syncStatus: PantavionProviderAdapterSyncStatus;
  lastSyncedAt?: string;
}

export interface PantavionProviderAdapterRegistrationInput {
  adapterKey: string;
  displayName: string;
  family: PantavionProviderAdapterFamily;
  providerKind?: 'internal' | 'hybrid' | 'external';
  availability?: PantavionProviderAdapterAvailability;
  trustTier?: PantavionProviderTrustTier;
  authModes?: string[];
  executionModes?: string[];
  truthModes?: string[];
  supportedCapabilities?: string[];
  supportedOperations?: string[];
  metadata?: PantavionProviderAdapterMetadata;
}

export interface PantavionProviderAdapterRegistrySnapshot {
  generatedAt: string;
  entryCount: number;
  readyCount: number;
  degradedCount: number;
  offlineCount: number;
  maintenanceCount: number;
  retiredCount: number;
  syncedCount: number;
  adapterKeys: string[];
}

export interface PantavionProviderGatewaySyncResult {
  attempted: number;
  synced: number;
  skipped: number;
  adapterKeys: string[];
  lastSyncedAt?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function pickFunction(source: UnknownRecord, keys: string[]): AnyFn | undefined {
  for (const key of keys) {
    const candidate = source[key];
    if (typeof candidate === 'function') {
      return candidate as AnyFn;
    }
  }

  for (const nestedValue of Object.values(source)) {
    if (!nestedValue || typeof nestedValue !== 'object') {
      continue;
    }

    const nested = nestedValue as UnknownRecord;
    for (const key of keys) {
      const candidate = nested[key];
      if (typeof candidate === 'function') {
        return candidate as AnyFn;
      }
    }
  }

  return undefined;
}

export class PantavionProviderAdapterRegistry {
  private readonly adapters = new Map<string, PantavionProviderAdapterRecord>();

  registerAdapter(
    input: PantavionProviderAdapterRegistrationInput,
  ): PantavionProviderAdapterRecord {
    const existing = this.adapters.get(input.adapterKey);
    const timestamp = nowIso();

    if (existing) {
      const updated: PantavionProviderAdapterRecord = {
        ...existing,
        displayName: safeText(input.displayName, existing.displayName),
        family: input.family ?? existing.family,
        providerKind: input.providerKind ?? existing.providerKind,
        availability: input.availability ?? existing.availability,
        trustTier: input.trustTier ?? existing.trustTier,
        authModes: uniqStrings(input.authModes ?? existing.authModes),
        executionModes: uniqStrings(input.executionModes ?? existing.executionModes),
        truthModes: uniqStrings(input.truthModes ?? existing.truthModes),
        supportedCapabilities: uniqStrings(
          input.supportedCapabilities ?? existing.supportedCapabilities,
        ),
        supportedOperations: uniqStrings(
          input.supportedOperations ?? existing.supportedOperations,
        ),
        metadata: {
          ...existing.metadata,
          ...(input.metadata ?? {}),
        },
        updatedAt: timestamp,
        syncStatus: 'pending',
      };

      this.adapters.set(updated.adapterKey, updated);
      return cloneValue(updated);
    }

    const created: PantavionProviderAdapterRecord = {
      adapterKey: input.adapterKey,
      displayName: input.displayName,
      family: input.family,
      providerKind: input.providerKind ?? 'internal',
      availability: input.availability ?? 'ready',
      trustTier: input.trustTier ?? 'trusted',
      authModes: uniqStrings(input.authModes ?? ['service']),
      executionModes: uniqStrings(input.executionModes ?? ['sync', 'async']),
      truthModes: uniqStrings(input.truthModes ?? ['deterministic']),
      supportedCapabilities: uniqStrings(input.supportedCapabilities ?? []),
      supportedOperations: uniqStrings(input.supportedOperations ?? []),
      metadata: cloneValue(input.metadata ?? {}),
      createdAt: timestamp,
      updatedAt: timestamp,
      syncStatus: 'pending',
    };

    this.adapters.set(created.adapterKey, created);
    return cloneValue(created);
  }

  getAdapter(adapterKey: string): PantavionProviderAdapterRecord | null {
    const adapter = this.adapters.get(adapterKey);
    return adapter ? cloneValue(adapter) : null;
  }

  listAdapters(): PantavionProviderAdapterRecord[] {
    return [...this.adapters.values()]
      .sort((left, right) => left.adapterKey.localeCompare(right.adapterKey))
      .map((adapter) => cloneValue(adapter));
  }

  clear(): void {
    this.adapters.clear();
  }

  getSnapshot(): PantavionProviderAdapterRegistrySnapshot {
    const list = this.listAdapters();

    return {
      generatedAt: nowIso(),
      entryCount: list.length,
      readyCount: list.filter((item) => item.availability === 'ready').length,
      degradedCount: list.filter((item) => item.availability === 'degraded').length,
      offlineCount: list.filter((item) => item.availability === 'offline').length,
      maintenanceCount: list.filter((item) => item.availability === 'maintenance').length,
      retiredCount: list.filter((item) => item.availability === 'retired').length,
      syncedCount: list.filter((item) => item.syncStatus === 'synced').length,
      adapterKeys: list.map((item) => item.adapterKey),
    };
  }

  async syncToGateway(): Promise<PantavionProviderGatewaySyncResult> {
    const moduleLike = ProtocolGatewayModule as unknown as UnknownRecord;
    const registerFn = pickFunction(moduleLike, [
      'registerAdapter',
      'registerProtocolAdapter',
      'addAdapter',
      'upsertAdapter',
    ]);

    const adapterList = this.listAdapters();
    let attempted = 0;
    let synced = 0;
    let skipped = 0;
    const syncTimestamp = nowIso();

    for (const adapter of adapterList) {
      if (adapter.availability === 'retired') {
        skipped += 1;
        continue;
      }

      attempted += 1;

      if (!registerFn) {
        const skippedAdapter: PantavionProviderAdapterRecord = {
          ...adapter,
          syncStatus: 'skipped',
          lastSyncedAt: syncTimestamp,
        };

        this.adapters.set(skippedAdapter.adapterKey, skippedAdapter);
        skipped += 1;
        continue;
      }

      try {
        await Promise.resolve(
          registerFn({
            adapterKey: adapter.adapterKey,
            displayName: adapter.displayName,
            family: adapter.family,
            supportedOperations: adapter.supportedOperations,
            supportedCapabilities: adapter.supportedCapabilities,
            truthModes: adapter.truthModes,
            executionModes: adapter.executionModes,
            authModes: adapter.authModes,
            trustFloor:
              adapter.trustTier === 'system' || adapter.trustTier === 'high'
                ? 'trusted'
                : 'basic',
            approvalTier:
              adapter.trustTier === 'system' ? 'admin' : 'review',
            metadata: {
              availability: adapter.availability,
              providerKind: adapter.providerKind,
              ...adapter.metadata,
            },
          }),
        );

        const syncedAdapter: PantavionProviderAdapterRecord = {
          ...adapter,
          syncStatus: 'synced',
          lastSyncedAt: syncTimestamp,
        };

        this.adapters.set(syncedAdapter.adapterKey, syncedAdapter);
        synced += 1;
      } catch {
        const skippedAdapter: PantavionProviderAdapterRecord = {
          ...adapter,
          syncStatus: 'skipped',
          lastSyncedAt: syncTimestamp,
        };

        this.adapters.set(skippedAdapter.adapterKey, skippedAdapter);
        skipped += 1;
      }
    }

    return {
      attempted,
      synced,
      skipped,
      adapterKeys: this.listAdapters().map((item) => item.adapterKey),
      lastSyncedAt: syncTimestamp,
    };
  }
}

export function createProviderAdapterRegistry(): PantavionProviderAdapterRegistry {
  return new PantavionProviderAdapterRegistry();
}

export const providerAdapterRegistry = createProviderAdapterRegistry();

export function registerProviderAdapter(
  input: PantavionProviderAdapterRegistrationInput,
): PantavionProviderAdapterRecord {
  return providerAdapterRegistry.registerAdapter(input);
}

export function getProviderAdapter(
  adapterKey: string,
): PantavionProviderAdapterRecord | null {
  return providerAdapterRegistry.getAdapter(adapterKey);
}

export function listProviderAdapters(): PantavionProviderAdapterRecord[] {
  return providerAdapterRegistry.listAdapters();
}

export function getProviderAdapterRegistrySnapshot(): PantavionProviderAdapterRegistrySnapshot {
  return providerAdapterRegistry.getSnapshot();
}

export async function syncProviderAdaptersToGateway(): Promise<PantavionProviderGatewaySyncResult> {
  return providerAdapterRegistry.syncToGateway();
}

export function clearProviderAdapterRegistry(): void {
  providerAdapterRegistry.clear();
}

export default providerAdapterRegistry;
