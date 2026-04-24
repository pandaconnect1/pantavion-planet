// core/storage/kernel-admission-store.ts

import { getKernelAdmissionHistory } from '../kernel/kernel-admission';

export type PantavionKernelAdmissionHistoryEntry =
  ReturnType<typeof getKernelAdmissionHistory>[number];

export interface PantavionKernelAdmissionStoreRecord {
  snapshotId: string;
  savedAt: string;
  itemCount: number;
  items: PantavionKernelAdmissionHistoryEntry[];
}

export interface PantavionKernelAdmissionStoreSnapshot {
  generatedAt: string;
  snapshotCount: number;
  latestSnapshotId?: string;
  latestItemCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class PantavionKernelAdmissionStore {
  private readonly snapshots: PantavionKernelAdmissionStoreRecord[] = [];

  saveHistorySnapshot(
    items: PantavionKernelAdmissionHistoryEntry[],
  ): PantavionKernelAdmissionStoreRecord {
    const record: PantavionKernelAdmissionStoreRecord = {
      snapshotId: createId('kas'),
      savedAt: nowIso(),
      itemCount: items.length,
      items: cloneValue(items),
    };

    this.snapshots.unshift(record);
    return cloneValue(record);
  }

  syncFromKernelAdmission(): PantavionKernelAdmissionStoreRecord {
    return this.saveHistorySnapshot(getKernelAdmissionHistory());
  }

  getLatest(): PantavionKernelAdmissionStoreRecord | null {
    return this.snapshots[0] ? cloneValue(this.snapshots[0]) : null;
  }

  listSnapshots(): PantavionKernelAdmissionStoreRecord[] {
    return this.snapshots.map((record) => cloneValue(record));
  }

  getSnapshot(): PantavionKernelAdmissionStoreSnapshot {
    const latest = this.snapshots[0];

    return {
      generatedAt: nowIso(),
      snapshotCount: this.snapshots.length,
      latestSnapshotId: latest?.snapshotId,
      latestItemCount: latest?.itemCount ?? 0,
    };
  }

  clear(): void {
    this.snapshots.length = 0;
  }
}

export function createKernelAdmissionStore(): PantavionKernelAdmissionStore {
  return new PantavionKernelAdmissionStore();
}

export const kernelAdmissionStore = createKernelAdmissionStore();

export function syncKernelAdmissionStore(): PantavionKernelAdmissionStoreRecord {
  return kernelAdmissionStore.syncFromKernelAdmission();
}

export function getKernelAdmissionStoreSnapshot(): PantavionKernelAdmissionStoreSnapshot {
  return kernelAdmissionStore.getSnapshot();
}

export function listKernelAdmissionSnapshots(): PantavionKernelAdmissionStoreRecord[] {
  return kernelAdmissionStore.listSnapshots();
}

export default kernelAdmissionStore;
