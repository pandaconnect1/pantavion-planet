// core/memory/thread-registry.ts

export type PantavionThreadStatus =
  | 'active'
  | 'paused'
  | 'archived';

export type PantavionThreadResolutionState =
  | 'unresolved'
  | 'in-progress'
  | 'resolved';

export interface PantavionThreadRecord {
  threadId: string;
  userId: string;
  title: string;
  parentThreadId?: string;
  continuationOfThreadId?: string;
  mergedIntoThreadId?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  lastRecalledAt?: string;
  resolvedAt?: string;
  archivedAt?: string;
  status: PantavionThreadStatus;
  resolutionState: PantavionThreadResolutionState;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionThreadCreateInput {
  userId: string;
  title: string;
  parentThreadId?: string;
  continuationOfThreadId?: string;
  status?: PantavionThreadStatus;
  resolutionState?: PantavionThreadResolutionState;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionThreadRegistrySnapshot {
  generatedAt: string;
  threadCount: number;
  activeCount: number;
  pausedCount: number;
  archivedCount: number;
  unresolvedCount: number;
  resolvedCount: number;
  latestThreadId?: string;
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

export class PantavionThreadRegistry {
  private readonly threads = new Map<string, PantavionThreadRecord>();

  createThread(input: PantavionThreadCreateInput): PantavionThreadRecord {
    const timestamp = nowIso();

    const record: PantavionThreadRecord = {
      threadId: createId('thr'),
      userId: input.userId,
      title: input.title,
      parentThreadId: input.parentThreadId,
      continuationOfThreadId: input.continuationOfThreadId,
      mergedIntoThreadId: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
      lastMessageAt: timestamp,
      lastRecalledAt: undefined,
      resolvedAt: undefined,
      archivedAt: undefined,
      status: input.status ?? 'active',
      resolutionState: input.resolutionState ?? 'unresolved',
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.threads.set(record.threadId, record);
    return cloneValue(record);
  }

  getThread(threadId: string): PantavionThreadRecord | null {
    const record = this.threads.get(threadId);
    return record ? cloneValue(record) : null;
  }

  listThreads(): PantavionThreadRecord[] {
    return [...this.threads.values()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => cloneValue(item));
  }

  listThreadsByUser(userId: string): PantavionThreadRecord[] {
    return this.listThreads().filter((item) => item.userId === userId);
  }

  touchThread(input: {
    threadId: string;
    status?: PantavionThreadStatus;
    resolutionState?: PantavionThreadResolutionState;
    mergedIntoThreadId?: string;
    markRecalled?: boolean;
  }): PantavionThreadRecord | null {
    const existing = this.threads.get(input.threadId);
    if (!existing) {
      return null;
    }

    const timestamp = nowIso();

    const updated: PantavionThreadRecord = {
      ...existing,
      updatedAt: timestamp,
      lastMessageAt: timestamp,
      status: input.status ?? existing.status,
      resolutionState: input.resolutionState ?? existing.resolutionState,
      mergedIntoThreadId: input.mergedIntoThreadId ?? existing.mergedIntoThreadId,
      lastRecalledAt: input.markRecalled ? timestamp : existing.lastRecalledAt,
      resolvedAt:
        (input.resolutionState ?? existing.resolutionState) === 'resolved'
          ? (existing.resolvedAt ?? timestamp)
          : existing.resolvedAt,
      archivedAt:
        (input.status ?? existing.status) === 'archived'
          ? (existing.archivedAt ?? timestamp)
          : existing.archivedAt,
    };

    this.threads.set(updated.threadId, updated);
    return cloneValue(updated);
  }

  getSnapshot(): PantavionThreadRegistrySnapshot {
    const list = this.listThreads();

    return {
      generatedAt: nowIso(),
      threadCount: list.length,
      activeCount: list.filter((item) => item.status === 'active').length,
      pausedCount: list.filter((item) => item.status === 'paused').length,
      archivedCount: list.filter((item) => item.status === 'archived').length,
      unresolvedCount: list.filter((item) => item.resolutionState !== 'resolved').length,
      resolvedCount: list.filter((item) => item.resolutionState === 'resolved').length,
      latestThreadId: list[0]?.threadId,
    };
  }

  clear(): void {
    this.threads.clear();
  }
}

export function createThreadRegistry(): PantavionThreadRegistry {
  return new PantavionThreadRegistry();
}

export const threadRegistry = createThreadRegistry();

export function createThread(
  input: PantavionThreadCreateInput,
): PantavionThreadRecord {
  return threadRegistry.createThread(input);
}

export function getThread(threadId: string): PantavionThreadRecord | null {
  return threadRegistry.getThread(threadId);
}

export function listThreads(): PantavionThreadRecord[] {
  return threadRegistry.listThreads();
}

export function listThreadsByUser(userId: string): PantavionThreadRecord[] {
  return threadRegistry.listThreadsByUser(userId);
}

export function touchThread(input: {
  threadId: string;
  status?: PantavionThreadStatus;
  resolutionState?: PantavionThreadResolutionState;
  mergedIntoThreadId?: string;
  markRecalled?: boolean;
}): PantavionThreadRecord | null {
  return threadRegistry.touchThread(input);
}

export function getThreadRegistrySnapshot(): PantavionThreadRegistrySnapshot {
  return threadRegistry.getSnapshot();
}

export default threadRegistry;
