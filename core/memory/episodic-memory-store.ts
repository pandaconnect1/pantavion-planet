// core/memory/episodic-memory-store.ts

import { listMemoryEvents } from './memory-event-log';

export type PantavionEpisodicSalience =
  | 'low'
  | 'medium'
  | 'high';

export interface PantavionEpisodicMemoryRecord {
  memoryKey: string;
  sourceEventId: string;
  userId: string;
  threadId: string;
  eventClass: string;
  occurredAt: string;
  title?: string;
  summary: string;
  salience: PantavionEpisodicSalience;
  tags: string[];
}

export interface PantavionEpisodicMemorySnapshot {
  generatedAt: string;
  episodicCount: number;
  highSalienceCount: number;
  mediumSalienceCount: number;
  lowSalienceCount: number;
  latestMemoryKey?: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function buildSalience(input: {
  eventClass: string;
  tags: string[];
  title?: string;
}): PantavionEpisodicSalience {
  if (
    input.eventClass === 'fact-record' ||
    input.eventClass === 'commitment-record' ||
    input.tags.includes('vision') ||
    input.tags.includes('canonical')
  ) {
    return 'high';
  }

  if (
    input.eventClass === 'reminder-record' ||
    input.eventClass === 'action-record' ||
    input.tags.includes('memory') ||
    input.tags.includes('continuity')
  ) {
    return 'medium';
  }

  return 'low';
}

export function listEpisodicMemories(): PantavionEpisodicMemoryRecord[] {
  return listMemoryEvents().map((event, index) => ({
    memoryKey: `episodic_${index + 1}_${event.eventId}`,
    sourceEventId: event.eventId,
    userId: event.userId,
    threadId: event.threadId,
    eventClass: event.eventClass,
    occurredAt: event.createdAt,
    title: event.title,
    summary: event.summary,
    salience: buildSalience({
      eventClass: event.eventClass,
      tags: event.tags,
      title: event.title,
    }),
    tags: [...event.tags],
  }));
}

export function getEpisodicMemorySnapshot(): PantavionEpisodicMemorySnapshot {
  const list = listEpisodicMemories();

  return {
    generatedAt: nowIso(),
    episodicCount: list.length,
    highSalienceCount: list.filter((item) => item.salience === 'high').length,
    mediumSalienceCount: list.filter((item) => item.salience === 'medium').length,
    lowSalienceCount: list.filter((item) => item.salience === 'low').length,
    latestMemoryKey: list[0]?.memoryKey,
  };
}

export default listEpisodicMemories;
