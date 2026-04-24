// core/protocol/provider-health-registry.ts

import {
  listProviderAdapters,
  type PantavionProviderAdapterAvailability,
  type PantavionProviderAdapterRecord,
} from './provider-adapter-registry';

export type PantavionProviderHealthStatus =
  | 'healthy'
  | 'watch'
  | 'degraded'
  | 'offline';

export interface PantavionProviderHealthRecord {
  adapterKey: string;
  status: PantavionProviderHealthStatus;
  successRate: number;
  latencyMs: number;
  lastCheckedAt: string;
  incidents: number;
  notes: string[];
}

export interface PantavionProviderHealthRegistrySnapshot {
  generatedAt: string;
  totalCount: number;
  healthyCount: number;
  watchCount: number;
  degradedCount: number;
  offlineCount: number;
  adapterKeys: string[];
}

export interface PantavionProviderHealthUpsertInput {
  adapterKey: string;
  status: PantavionProviderHealthStatus;
  successRate: number;
  latencyMs: number;
  incidents?: number;
  notes?: string[];
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

function mapAvailabilityToHealth(
  availability: PantavionProviderAdapterAvailability,
): PantavionProviderHealthStatus {
  switch (availability) {
    case 'ready':
      return 'healthy';
    case 'maintenance':
      return 'watch';
    case 'degraded':
      return 'degraded';
    case 'offline':
    case 'retired':
      return 'offline';
    default:
      return 'watch';
  }
}

function defaultHealthForAdapter(
  adapter: PantavionProviderAdapterRecord,
): PantavionProviderHealthRecord {
  const status = mapAvailabilityToHealth(adapter.availability);

  return {
    adapterKey: adapter.adapterKey,
    status,
    successRate:
      status === 'healthy'
        ? 0.995
        : status === 'watch'
          ? 0.975
          : status === 'degraded'
            ? 0.92
            : 0.5,
    latencyMs:
      status === 'healthy'
        ? 35
        : status === 'watch'
          ? 75
          : status === 'degraded'
            ? 190
            : 900,
    lastCheckedAt: nowIso(),
    incidents:
      status === 'healthy'
        ? 0
        : status === 'watch'
          ? 1
          : status === 'degraded'
            ? 3
            : 7,
    notes: [
      `Derived from provider availability=${adapter.availability}.`,
    ],
  };
}

export class PantavionProviderHealthRegistry {
  private readonly records = new Map<string, PantavionProviderHealthRecord>();

  upsert(
    input: PantavionProviderHealthUpsertInput,
  ): PantavionProviderHealthRecord {
    const record: PantavionProviderHealthRecord = {
      adapterKey: input.adapterKey,
      status: input.status,
      successRate: input.successRate,
      latencyMs: input.latencyMs,
      lastCheckedAt: nowIso(),
      incidents: input.incidents ?? 0,
      notes: uniqStrings(input.notes ?? []),
    };

    this.records.set(record.adapterKey, record);
    return cloneValue(record);
  }

  get(adapterKey: string): PantavionProviderHealthRecord | null {
    const record = this.records.get(adapterKey);
    return record ? cloneValue(record) : null;
  }

  list(): PantavionProviderHealthRecord[] {
    return [...this.records.values()]
      .sort((left, right) => left.adapterKey.localeCompare(right.adapterKey))
      .map((record) => cloneValue(record));
  }

  seedFromProviderRegistry(): PantavionProviderHealthRecord[] {
    const adapters = listProviderAdapters();
    const seeded: PantavionProviderHealthRecord[] = [];

    for (const adapter of adapters) {
      const record = defaultHealthForAdapter(adapter);
      this.records.set(record.adapterKey, record);
      seeded.push(cloneValue(record));
    }

    return seeded;
  }

  clear(): void {
    this.records.clear();
  }

  getSnapshot(): PantavionProviderHealthRegistrySnapshot {
    const list = this.list();

    return {
      generatedAt: nowIso(),
      totalCount: list.length,
      healthyCount: list.filter((item) => item.status === 'healthy').length,
      watchCount: list.filter((item) => item.status === 'watch').length,
      degradedCount: list.filter((item) => item.status === 'degraded').length,
      offlineCount: list.filter((item) => item.status === 'offline').length,
      adapterKeys: list.map((item) => item.adapterKey),
    };
  }
}

export function createProviderHealthRegistry(): PantavionProviderHealthRegistry {
  return new PantavionProviderHealthRegistry();
}

export const providerHealthRegistry = createProviderHealthRegistry();

export function upsertProviderHealth(
  input: PantavionProviderHealthUpsertInput,
): PantavionProviderHealthRecord {
  return providerHealthRegistry.upsert(input);
}

export function getProviderHealth(
  adapterKey: string,
): PantavionProviderHealthRecord | null {
  return providerHealthRegistry.get(adapterKey);
}

export function listProviderHealth(): PantavionProviderHealthRecord[] {
  return providerHealthRegistry.list();
}

export function seedProviderHealthFromRegistry(): PantavionProviderHealthRecord[] {
  return providerHealthRegistry.seedFromProviderRegistry();
}

export function getProviderHealthRegistrySnapshot(): PantavionProviderHealthRegistrySnapshot {
  return providerHealthRegistry.getSnapshot();
}

export function clearProviderHealthRegistry(): void {
  providerHealthRegistry.clear();
}

export default providerHealthRegistry;
