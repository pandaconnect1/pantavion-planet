// core/memory/long-horizon-memory-store.ts

import { listCanonicalFacts } from './fact-registry';
import { listCommitments } from './commitment-registry';

export type PantavionLongHorizonClass =
  | 'timeless'
  | 'future-obligation'
  | 'long-lived-context';

export interface PantavionLongHorizonMemoryRecord {
  horizonKey: string;
  userId: string;
  threadId?: string;
  sourceType: 'fact' | 'commitment';
  horizonClass: PantavionLongHorizonClass;
  title: string;
  anchorTime: string;
  notes: string[];
}

export interface PantavionLongHorizonMemorySnapshot {
  generatedAt: string;
  longHorizonCount: number;
  timelessCount: number;
  futureObligationCount: number;
  longLivedContextCount: number;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function listLongHorizonMemories(): PantavionLongHorizonMemoryRecord[] {
  const facts = listCanonicalFacts().map((fact, index) => ({
    horizonKey: `long_fact_${index + 1}_${fact.factId}`,
    userId: fact.userId,
    threadId: fact.threadId,
    sourceType: 'fact' as const,
    horizonClass: !fact.effectiveTo ? 'timeless' as const : 'long-lived-context' as const,
    title: fact.factKey,
    anchorTime: fact.effectiveFrom,
    notes: [
      `factType=${fact.factType}`,
      `confidence=${fact.confidence}`,
    ],
  }));

  const commitments = listCommitments()
    .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
    .map((item, index) => ({
      horizonKey: `long_commitment_${index + 1}_${item.commitmentId}`,
      userId: item.userId,
      threadId: item.threadId,
      sourceType: 'commitment' as const,
      horizonClass: 'future-obligation' as const,
      title: item.title,
      anchorTime: item.dueAt ?? item.updatedAt,
      notes: [
        `priority=${item.priority}`,
        `status=${item.status}`,
      ],
    }));

  return [...facts, ...commitments].sort((left, right) =>
    right.anchorTime.localeCompare(left.anchorTime),
  );
}

export function getLongHorizonMemorySnapshot(): PantavionLongHorizonMemorySnapshot {
  const list = listLongHorizonMemories();

  return {
    generatedAt: nowIso(),
    longHorizonCount: list.length,
    timelessCount: list.filter((item) => item.horizonClass === 'timeless').length,
    futureObligationCount: list.filter((item) => item.horizonClass === 'future-obligation').length,
    longLivedContextCount: list.filter((item) => item.horizonClass === 'long-lived-context').length,
  };
}

export default listLongHorizonMemories;
