// core/memory/memory-event-log.ts

export type PantavionMemoryActorRole =
  | 'user'
  | 'ai'
  | 'system'
  | 'operator';

export type PantavionMemoryEventClass =
  | 'user-message'
  | 'ai-message'
  | 'system-note'
  | 'action-record'
  | 'fact-record'
  | 'reminder-record'
  | 'commitment-record';

export interface PantavionMemoryEventRecord {
  eventId: string;
  userId: string;
  threadId: string;
  sessionId: string;
  actorRole: PantavionMemoryActorRole;
  eventClass: PantavionMemoryEventClass;
  createdAt: string;
  updatedAt: string;
  timezone: string;
  title?: string;
  content: string;
  summary: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface PantavionMemoryEventInput {
  userId: string;
  threadId: string;
  sessionId: string;
  actorRole: PantavionMemoryActorRole;
  eventClass: PantavionMemoryEventClass;
  timezone?: string;
  title?: string;
  content: string;
  summary?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface PantavionMemoryEventLogSnapshot {
  generatedAt: string;
  eventCount: number;
  userCount: number;
  threadCount: number;
  latestEventId?: string;
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

export class PantavionMemoryEventLog {
  private readonly events: PantavionMemoryEventRecord[] = [];

  appendEvent(input: PantavionMemoryEventInput): PantavionMemoryEventRecord {
    const timestamp = nowIso();

    const record: PantavionMemoryEventRecord = {
      eventId: createId('mev'),
      userId: input.userId,
      threadId: input.threadId,
      sessionId: input.sessionId,
      actorRole: input.actorRole,
      eventClass: input.eventClass,
      createdAt: timestamp,
      updatedAt: timestamp,
      timezone: input.timezone ?? 'UTC',
      title: input.title?.trim() || undefined,
      content: input.content,
      summary: input.summary?.trim() || input.content.slice(0, 160),
      tags: uniqStrings(input.tags ?? []),
      metadata: cloneValue(input.metadata ?? {}),
    };

    this.events.unshift(record);
    return cloneValue(record);
  }

  listEvents(): PantavionMemoryEventRecord[] {
    return this.events.map((item) => cloneValue(item));
  }

  listEventsByUser(userId: string): PantavionMemoryEventRecord[] {
    return this.events
      .filter((item) => item.userId === userId)
      .map((item) => cloneValue(item));
  }

  listEventsByThread(threadId: string): PantavionMemoryEventRecord[] {
    return this.events
      .filter((item) => item.threadId === threadId)
      .map((item) => cloneValue(item));
  }

  getSnapshot(): PantavionMemoryEventLogSnapshot {
    const users = new Set(this.events.map((item) => item.userId));
    const threads = new Set(this.events.map((item) => item.threadId));

    return {
      generatedAt: nowIso(),
      eventCount: this.events.length,
      userCount: users.size,
      threadCount: threads.size,
      latestEventId: this.events[0]?.eventId,
    };
  }

  clear(): void {
    this.events.length = 0;
  }
}

export function createMemoryEventLog(): PantavionMemoryEventLog {
  return new PantavionMemoryEventLog();
}

export const memoryEventLog = createMemoryEventLog();

export function appendMemoryEvent(
  input: PantavionMemoryEventInput,
): PantavionMemoryEventRecord {
  return memoryEventLog.appendEvent(input);
}

export function listMemoryEvents(): PantavionMemoryEventRecord[] {
  return memoryEventLog.listEvents();
}

export function listMemoryEventsByUser(userId: string): PantavionMemoryEventRecord[] {
  return memoryEventLog.listEventsByUser(userId);
}

export function listMemoryEventsByThread(threadId: string): PantavionMemoryEventRecord[] {
  return memoryEventLog.listEventsByThread(threadId);
}

export function getMemoryEventLogSnapshot(): PantavionMemoryEventLogSnapshot {
  return memoryEventLog.getSnapshot();
}

export default memoryEventLog;
