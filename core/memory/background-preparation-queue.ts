// core/memory/background-preparation-queue.ts

export type PantavionPreparationType =
  | 'draft'
  | 'summary'
  | 'research-pack'
  | 'comparison'
  | 'follow-up-plan'
  | 'checklist'
  | 'custom';

export type PantavionPreparationStatus =
  | 'queued'
  | 'running'
  | 'ready'
  | 'completed'
  | 'blocked'
  | 'cancelled';

export interface PantavionBackgroundPreparationJob {
  preparationJobId: string;
  userId: string;
  threadId: string;
  linkedCommitmentId?: string;
  queuedAt: string;
  plannedFor?: string;
  preparationType: PantavionPreparationType;
  title: string;
  description: string;
  status: PantavionPreparationStatus;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionBackgroundPreparationInput {
  userId: string;
  threadId: string;
  linkedCommitmentId?: string;
  plannedFor?: string;
  preparationType: PantavionPreparationType;
  title: string;
  description: string;
  status?: PantavionPreparationStatus;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionBackgroundPreparationSnapshot {
  generatedAt: string;
  jobCount: number;
  queuedCount: number;
  runningCount: number;
  readyCount: number;
  completedCount: number;
  blockedCount: number;
  latestJobId?: string;
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

export class PantavionBackgroundPreparationQueue {
  private readonly jobs = new Map<string, PantavionBackgroundPreparationJob>();

  queueJob(
    input: PantavionBackgroundPreparationInput,
  ): PantavionBackgroundPreparationJob {
    const record: PantavionBackgroundPreparationJob = {
      preparationJobId: createId('prp'),
      userId: input.userId,
      threadId: input.threadId,
      linkedCommitmentId: input.linkedCommitmentId,
      queuedAt: nowIso(),
      plannedFor: input.plannedFor,
      preparationType: input.preparationType,
      title: input.title,
      description: input.description,
      status: input.status ?? 'queued',
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.jobs.set(record.preparationJobId, record);
    return cloneValue(record);
  }

  updateJob(input: {
    preparationJobId: string;
    status?: PantavionPreparationStatus;
    plannedFor?: string;
  }): PantavionBackgroundPreparationJob | null {
    const existing = this.jobs.get(input.preparationJobId);
    if (!existing) {
      return null;
    }

    const updated: PantavionBackgroundPreparationJob = {
      ...existing,
      status: input.status ?? existing.status,
      plannedFor: input.plannedFor ?? existing.plannedFor,
    };

    this.jobs.set(updated.preparationJobId, updated);
    return cloneValue(updated);
  }

  listJobs(): PantavionBackgroundPreparationJob[] {
    return [...this.jobs.values()]
      .sort((left, right) => right.queuedAt.localeCompare(left.queuedAt))
      .map((item) => cloneValue(item));
  }

  listJobsByUser(userId: string): PantavionBackgroundPreparationJob[] {
    return this.listJobs().filter((item) => item.userId === userId);
  }

  getSnapshot(): PantavionBackgroundPreparationSnapshot {
    const list = this.listJobs();

    return {
      generatedAt: nowIso(),
      jobCount: list.length,
      queuedCount: list.filter((item) => item.status === 'queued').length,
      runningCount: list.filter((item) => item.status === 'running').length,
      readyCount: list.filter((item) => item.status === 'ready').length,
      completedCount: list.filter((item) => item.status === 'completed').length,
      blockedCount: list.filter((item) => item.status === 'blocked').length,
      latestJobId: list[0]?.preparationJobId,
    };
  }

  clear(): void {
    this.jobs.clear();
  }
}

export function createBackgroundPreparationQueue(): PantavionBackgroundPreparationQueue {
  return new PantavionBackgroundPreparationQueue();
}

export const backgroundPreparationQueue = createBackgroundPreparationQueue();

export function queueBackgroundPreparation(
  input: PantavionBackgroundPreparationInput,
): PantavionBackgroundPreparationJob {
  return backgroundPreparationQueue.queueJob(input);
}

export function updateBackgroundPreparation(input: {
  preparationJobId: string;
  status?: PantavionPreparationStatus;
  plannedFor?: string;
}): PantavionBackgroundPreparationJob | null {
  return backgroundPreparationQueue.updateJob(input);
}

export function listBackgroundPreparationJobs(): PantavionBackgroundPreparationJob[] {
  return backgroundPreparationQueue.listJobs();
}

export function listBackgroundPreparationJobsByUser(
  userId: string,
): PantavionBackgroundPreparationJob[] {
  return backgroundPreparationQueue.listJobsByUser(userId);
}

export function getBackgroundPreparationSnapshot(): PantavionBackgroundPreparationSnapshot {
  return backgroundPreparationQueue.getSnapshot();
}

export default backgroundPreparationQueue;
