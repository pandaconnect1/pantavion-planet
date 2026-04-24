// core/memory/commitment-registry.ts

export type PantavionCommitmentPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type PantavionCommitmentStatus =
  | 'open'
  | 'scheduled'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface PantavionCommitmentRecord {
  commitmentId: string;
  userId: string;
  threadId: string;
  requestedBy: string;
  title: string;
  expectedOutcome: string;
  dueAt?: string;
  createdAt: string;
  updatedAt: string;
  priority: PantavionCommitmentPriority;
  status: PantavionCommitmentStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionCommitmentInput {
  userId: string;
  threadId: string;
  requestedBy: string;
  title: string;
  expectedOutcome: string;
  dueAt?: string;
  priority?: PantavionCommitmentPriority;
  status?: PantavionCommitmentStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionCommitmentRegistrySnapshot {
  generatedAt: string;
  commitmentCount: number;
  openCount: number;
  scheduledCount: number;
  readyCount: number;
  completedCount: number;
  latestCommitmentId?: string;
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

export class PantavionCommitmentRegistry {
  private readonly commitments = new Map<string, PantavionCommitmentRecord>();

  createCommitment(input: PantavionCommitmentInput): PantavionCommitmentRecord {
    const timestamp = nowIso();

    const record: PantavionCommitmentRecord = {
      commitmentId: createId('com'),
      userId: input.userId,
      threadId: input.threadId,
      requestedBy: input.requestedBy,
      title: input.title,
      expectedOutcome: input.expectedOutcome,
      dueAt: input.dueAt,
      createdAt: timestamp,
      updatedAt: timestamp,
      priority: input.priority ?? 'medium',
      status: input.status ?? (input.dueAt ? 'scheduled' : 'open'),
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.commitments.set(record.commitmentId, record);
    return cloneValue(record);
  }

  updateCommitment(input: {
    commitmentId: string;
    status?: PantavionCommitmentStatus;
    dueAt?: string;
    expectedOutcome?: string;
  }): PantavionCommitmentRecord | null {
    const existing = this.commitments.get(input.commitmentId);
    if (!existing) {
      return null;
    }

    const updated: PantavionCommitmentRecord = {
      ...existing,
      updatedAt: nowIso(),
      status: input.status ?? existing.status,
      dueAt: input.dueAt ?? existing.dueAt,
      expectedOutcome: input.expectedOutcome ?? existing.expectedOutcome,
    };

    this.commitments.set(updated.commitmentId, updated);
    return cloneValue(updated);
  }

  listCommitments(): PantavionCommitmentRecord[] {
    return [...this.commitments.values()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => cloneValue(item));
  }

  listCommitmentsByUser(userId: string): PantavionCommitmentRecord[] {
    return this.listCommitments().filter((item) => item.userId === userId);
  }

  getSnapshot(): PantavionCommitmentRegistrySnapshot {
    const list = this.listCommitments();

    return {
      generatedAt: nowIso(),
      commitmentCount: list.length,
      openCount: list.filter((item) => item.status === 'open').length,
      scheduledCount: list.filter((item) => item.status === 'scheduled').length,
      readyCount: list.filter((item) => item.status === 'ready').length,
      completedCount: list.filter((item) => item.status === 'completed').length,
      latestCommitmentId: list[0]?.commitmentId,
    };
  }

  clear(): void {
    this.commitments.clear();
  }
}

export function createCommitmentRegistry(): PantavionCommitmentRegistry {
  return new PantavionCommitmentRegistry();
}

export const commitmentRegistry = createCommitmentRegistry();

export function createCommitment(
  input: PantavionCommitmentInput,
): PantavionCommitmentRecord {
  return commitmentRegistry.createCommitment(input);
}

export function updateCommitment(input: {
  commitmentId: string;
  status?: PantavionCommitmentStatus;
  dueAt?: string;
  expectedOutcome?: string;
}): PantavionCommitmentRecord | null {
  return commitmentRegistry.updateCommitment(input);
}

export function listCommitments(): PantavionCommitmentRecord[] {
  return commitmentRegistry.listCommitments();
}

export function listCommitmentsByUser(userId: string): PantavionCommitmentRecord[] {
  return commitmentRegistry.listCommitmentsByUser(userId);
}

export function getCommitmentRegistrySnapshot(): PantavionCommitmentRegistrySnapshot {
  return commitmentRegistry.getSnapshot();
}

export default commitmentRegistry;
