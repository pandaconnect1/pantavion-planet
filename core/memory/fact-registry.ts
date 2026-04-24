// core/memory/fact-registry.ts

export type PantavionFactType =
  | 'preference'
  | 'goal'
  | 'decision'
  | 'project-truth'
  | 'identity'
  | 'locale'
  | 'routing-truth'
  | 'other';

export interface PantavionCanonicalFactRecord {
  factId: string;
  factKey: string;
  userId: string;
  threadId: string;
  factType: PantavionFactType;
  value: unknown;
  confidence: number;
  sourceSummary: string;
  recordedAt: string;
  lastVerifiedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionCanonicalFactInput {
  factKey: string;
  userId: string;
  threadId: string;
  factType: PantavionFactType;
  value: unknown;
  confidence?: number;
  sourceSummary: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionFactRegistrySnapshot {
  generatedAt: string;
  factCount: number;
  userCount: number;
  latestFactId?: string;
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

function clampConfidence(value: number | undefined): number {
  const input = typeof value === 'number' && Number.isFinite(value) ? value : 0.8;
  if (input < 0) {
    return 0;
  }
  if (input > 1) {
    return 1;
  }
  return input;
}

export class PantavionFactRegistry {
  private readonly factsByKey = new Map<string, PantavionCanonicalFactRecord>();

  upsertFact(input: PantavionCanonicalFactInput): PantavionCanonicalFactRecord {
    const existing = this.factsByKey.get(input.factKey);
    const timestamp = nowIso();

    if (existing) {
      const updated: PantavionCanonicalFactRecord = {
        ...existing,
        userId: input.userId,
        threadId: input.threadId,
        factType: input.factType,
        value: cloneValue(input.value),
        confidence: clampConfidence(input.confidence),
        sourceSummary: input.sourceSummary,
        lastVerifiedAt: timestamp,
        effectiveFrom: input.effectiveFrom ?? existing.effectiveFrom,
        effectiveTo: input.effectiveTo,
        tags: uniqStrings(input.tags ?? existing.tags),
        metadata: {
          ...existing.metadata,
          ...(input.metadata ?? {}),
        },
      };

      this.factsByKey.set(updated.factKey, updated);
      return cloneValue(updated);
    }

    const created: PantavionCanonicalFactRecord = {
      factId: createId('fac'),
      factKey: input.factKey,
      userId: input.userId,
      threadId: input.threadId,
      factType: input.factType,
      value: cloneValue(input.value),
      confidence: clampConfidence(input.confidence),
      sourceSummary: input.sourceSummary,
      recordedAt: timestamp,
      lastVerifiedAt: timestamp,
      effectiveFrom: input.effectiveFrom ?? timestamp,
      effectiveTo: input.effectiveTo,
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.factsByKey.set(created.factKey, created);
    return cloneValue(created);
  }

  listFacts(): PantavionCanonicalFactRecord[] {
    return [...this.factsByKey.values()]
      .sort((left, right) => right.lastVerifiedAt.localeCompare(left.lastVerifiedAt))
      .map((item) => cloneValue(item));
  }

  listFactsByUser(userId: string): PantavionCanonicalFactRecord[] {
    return this.listFacts().filter((item) => item.userId === userId);
  }

  listFactsByThread(threadId: string): PantavionCanonicalFactRecord[] {
    return this.listFacts().filter((item) => item.threadId === threadId);
  }

  getSnapshot(): PantavionFactRegistrySnapshot {
    const list = this.listFacts();
    const users = new Set(list.map((item) => item.userId));

    return {
      generatedAt: nowIso(),
      factCount: list.length,
      userCount: users.size,
      latestFactId: list[0]?.factId,
    };
  }

  clear(): void {
    this.factsByKey.clear();
  }
}

export function createFactRegistry(): PantavionFactRegistry {
  return new PantavionFactRegistry();
}

export const factRegistry = createFactRegistry();

export function upsertCanonicalFact(
  input: PantavionCanonicalFactInput,
): PantavionCanonicalFactRecord {
  return factRegistry.upsertFact(input);
}

export function listCanonicalFacts(): PantavionCanonicalFactRecord[] {
  return factRegistry.listFacts();
}

export function listCanonicalFactsByUser(userId: string): PantavionCanonicalFactRecord[] {
  return factRegistry.listFactsByUser(userId);
}

export function listCanonicalFactsByThread(threadId: string): PantavionCanonicalFactRecord[] {
  return factRegistry.listFactsByThread(threadId);
}

export function getFactRegistrySnapshot(): PantavionFactRegistrySnapshot {
  return factRegistry.getSnapshot();
}

export default factRegistry;
