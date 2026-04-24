// core/storage/kernel-artifact-store.ts

import {
  runKernelArtifactGeneration,
  type PantavionKernelRunArtifact,
} from '../kernel/kernel-run-artifact';

export interface PantavionKernelArtifactStoreRecord {
  recordId: string;
  savedAt: string;
  artifact: PantavionKernelRunArtifact;
}

export interface PantavionKernelArtifactStoreSnapshot {
  generatedAt: string;
  entryCount: number;
  latestArtifactId?: string;
  readinessStatuses: string[];
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

export class PantavionKernelArtifactStore {
  private readonly records = new Map<string, PantavionKernelArtifactStoreRecord>();

  saveArtifact(
    artifact: PantavionKernelRunArtifact,
  ): PantavionKernelArtifactStoreRecord {
    const record: PantavionKernelArtifactStoreRecord = {
      recordId: createId('kar'),
      savedAt: nowIso(),
      artifact: cloneValue(artifact),
    };

    this.records.set(artifact.artifactId, record);
    return cloneValue(record);
  }

  getArtifact(
    artifactId: string,
  ): PantavionKernelArtifactStoreRecord | null {
    const record = this.records.get(artifactId);
    return record ? cloneValue(record) : null;
  }

  listArtifacts(): PantavionKernelArtifactStoreRecord[] {
    return [...this.records.values()]
      .sort((left, right) => right.savedAt.localeCompare(left.savedAt))
      .map((record) => cloneValue(record));
  }

  getSnapshot(): PantavionKernelArtifactStoreSnapshot {
    const list = this.listArtifacts();

    return {
      generatedAt: nowIso(),
      entryCount: list.length,
      latestArtifactId: list[0]?.artifact.artifactId,
      readinessStatuses: uniqStrings(list.map((record) => record.artifact.readinessStatus)),
    };
  }

  clear(): void {
    this.records.clear();
  }
}

export function createKernelArtifactStore(): PantavionKernelArtifactStore {
  return new PantavionKernelArtifactStore();
}

export const kernelArtifactStore = createKernelArtifactStore();

export function saveKernelArtifact(
  artifact: PantavionKernelRunArtifact,
): PantavionKernelArtifactStoreRecord {
  return kernelArtifactStore.saveArtifact(artifact);
}

export async function generateAndStoreKernelArtifact(): Promise<PantavionKernelArtifactStoreRecord> {
  const artifact = await runKernelArtifactGeneration();
  return saveKernelArtifact(artifact);
}

export function getKernelArtifactStoreSnapshot(): PantavionKernelArtifactStoreSnapshot {
  return kernelArtifactStore.getSnapshot();
}

export function listKernelArtifacts(): PantavionKernelArtifactStoreRecord[] {
  return kernelArtifactStore.listArtifacts();
}

export default kernelArtifactStore;
