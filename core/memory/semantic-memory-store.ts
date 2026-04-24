// core/memory/semantic-memory-store.ts

import { listCanonicalFacts } from './fact-registry';

export interface PantavionSemanticMemoryRecord {
  memoryKey: string;
  factId: string;
  factKey: string;
  userId: string;
  threadId: string;
  factType: string;
  confidence: number;
  sourceSummary: string;
  recordedAt: string;
  lastVerifiedAt: string;
  effectiveFrom: string;
  effectiveTo?: string;
  timeless: boolean;
  tags: string[];
}

export interface PantavionSemanticMemorySnapshot {
  generatedAt: string;
  semanticCount: number;
  highConfidenceCount: number;
  timelessCount: number;
  expiringCount: number;
  latestMemoryKey?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listSemanticMemories(): PantavionSemanticMemoryRecord[] {
  return listCanonicalFacts().map((fact, index) => ({
    memoryKey: `semantic_${index + 1}_${fact.factId}`,
    factId: fact.factId,
    factKey: fact.factKey,
    userId: fact.userId,
    threadId: fact.threadId,
    factType: fact.factType,
    confidence: fact.confidence,
    sourceSummary: fact.sourceSummary,
    recordedAt: fact.recordedAt,
    lastVerifiedAt: fact.lastVerifiedAt,
    effectiveFrom: fact.effectiveFrom,
    effectiveTo: fact.effectiveTo,
    timeless: !fact.effectiveTo,
    tags: [...fact.tags],
  }));
}

export function getSemanticMemorySnapshot(): PantavionSemanticMemorySnapshot {
  const list = listSemanticMemories();

  return {
    generatedAt: nowIso(),
    semanticCount: list.length,
    highConfidenceCount: list.filter((item) => item.confidence >= 0.9).length,
    timelessCount: list.filter((item) => item.timeless).length,
    expiringCount: list.filter((item) => !item.timeless).length,
    latestMemoryKey: list[0]?.memoryKey,
  };
}

export default listSemanticMemories;
