// core/storage/kernel-state-store.ts

export type PantavionKernelStateKind =
  | 'state'
  | 'snapshot'
  | 'report'
  | 'artifact'
  | 'admission-history'
  | 'manifest'
  | 'lock';

export interface PantavionKernelStateMetadata {
  [key: string]: unknown;
}

export interface PantavionKernelStateRecord<T = unknown> {
  id: string;
  key: string;
  kind: PantavionKernelStateKind;
  createdAt: string;
  updatedAt: string;
  revision: number;
  tags: string[];
  payload: T;
  metadata: PantavionKernelStateMetadata;
}

export interface PantavionKernelStateStoreSnapshot {
  generatedAt: string;
  entryCount: number;
  keys: string[];
  latestUpdatedAt?: string;
}

export interface PantavionKernelStateUpsertInput<T = unknown> {
  key: string;
  kind: PantavionKernelStateKind;
  payload: T;
  tags?: string[];
  metadata?: PantavionKernelStateMetadata;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function uniqStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class PantavionKernelStateStore {
  private readonly recordsByKey = new Map<string, PantavionKernelStateRecord>();

  upsert<T>(input: PantavionKernelStateUpsertInput<T>): PantavionKernelStateRecord<T> {
    const existing = this.recordsByKey.get(input.key);
    const timestamp = nowIso();

    if (existing) {
      const updated: PantavionKernelStateRecord<T> = {
        ...existing,
        kind: input.kind,
        updatedAt: timestamp,
        revision: existing.revision + 1,
        tags: uniqStrings(input.tags ?? existing.tags),
        payload: cloneValue(input.payload),
        metadata: {
          ...existing.metadata,
          ...(input.metadata ?? {}),
        },
      };

      this.recordsByKey.set(input.key, updated as PantavionKernelStateRecord);
      return cloneValue(updated);
    }

    const created: PantavionKernelStateRecord<T> = {
      id: createId('kst'),
      key: input.key,
      kind: input.kind,
      createdAt: timestamp,
      updatedAt: timestamp,
      revision: 1,
      tags: uniqStrings(input.tags ?? []),
      payload: cloneValue(input.payload),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.recordsByKey.set(input.key, created as PantavionKernelStateRecord);
    return cloneValue(created);
  }

  getByKey<T = unknown>(key: string): PantavionKernelStateRecord<T> | null {
    const record = this.recordsByKey.get(key);
    return record ? cloneValue(record as PantavionKernelStateRecord<T>) : null;
  }

  list<T = unknown>(): PantavionKernelStateRecord<T>[] {
    return [...this.recordsByKey.values()]
      .sort((left, right) => left.key.localeCompare(right.key))
      .map((record) => cloneValue(record as PantavionKernelStateRecord<T>));
  }

  remove(key: string): boolean {
    return this.recordsByKey.delete(key);
  }

  clear(): void {
    this.recordsByKey.clear();
  }

  getSnapshot(): PantavionKernelStateStoreSnapshot {
    const records = [...this.recordsByKey.values()];
    const latestUpdatedAt =
      records.length > 0
        ? records
            .map((record) => record.updatedAt)
            .sort((left, right) => right.localeCompare(left))[0]
        : undefined;

    return {
      generatedAt: nowIso(),
      entryCount: records.length,
      keys: records.map((record) => record.key).sort((left, right) => left.localeCompare(right)),
      latestUpdatedAt,
    };
  }

  exportText(): string {
    return JSON.stringify(
      {
        generatedAt: nowIso(),
        snapshot: this.getSnapshot(),
        records: this.list(),
      },
      null,
      2,
    );
  }
}

export function createKernelStateStore(): PantavionKernelStateStore {
  return new PantavionKernelStateStore();
}

export const kernelStateStore = createKernelStateStore();

export function saveKernelState<T>(
  input: PantavionKernelStateUpsertInput<T>,
): PantavionKernelStateRecord<T> {
  return kernelStateStore.upsert(input);
}

export function getKernelState<T = unknown>(
  key: string,
): PantavionKernelStateRecord<T> | null {
  return kernelStateStore.getByKey<T>(key);
}

export function listKernelState<T = unknown>(): PantavionKernelStateRecord<T>[] {
  return kernelStateStore.list<T>();
}

export function getKernelStateStoreSnapshot(): PantavionKernelStateStoreSnapshot {
  return kernelStateStore.getSnapshot();
}

export function exportKernelStateStore(): string {
  return kernelStateStore.exportText();
}

export default kernelStateStore;
