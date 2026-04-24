// core/protocol/external-provider-session-store.ts

export type PantavionExternalBridgeSessionStatus =
  | 'open'
  | 'completed'
  | 'blocked';

export type PantavionExternalBridgeSessionMode =
  | 'simulated'
  | 'bridge-ready'
  | 'live-ready'
  | 'blocked';

export interface PantavionExternalBridgeSessionRecord {
  sessionId: string;
  startedAt: string;
  updatedAt: string;
  status: PantavionExternalBridgeSessionStatus;
  mode: PantavionExternalBridgeSessionMode;
  capabilityKey: string;
  operationKey: string;
  adapterKey?: string;
  endpointKey?: string;
  requestPayload: unknown;
  responsePayload?: unknown;
  notes: string[];
}

export interface PantavionExternalBridgeSessionSnapshot {
  generatedAt: string;
  count: number;
  openCount: number;
  completedCount: number;
  blockedCount: number;
  latestSessionId?: string;
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

export class PantavionExternalBridgeSessionStore {
  private readonly sessions = new Map<string, PantavionExternalBridgeSessionRecord>();

  beginSession(input: {
    capabilityKey: string;
    operationKey: string;
    adapterKey?: string;
    endpointKey?: string;
    requestPayload: unknown;
    mode: PantavionExternalBridgeSessionMode;
    notes?: string[];
  }): PantavionExternalBridgeSessionRecord {
    const timestamp = nowIso();

    const record: PantavionExternalBridgeSessionRecord = {
      sessionId: createId('ebs'),
      startedAt: timestamp,
      updatedAt: timestamp,
      status: input.mode === 'blocked' ? 'blocked' : 'open',
      mode: input.mode,
      capabilityKey: input.capabilityKey,
      operationKey: input.operationKey,
      adapterKey: input.adapterKey,
      endpointKey: input.endpointKey,
      requestPayload: cloneValue(input.requestPayload),
      responsePayload: undefined,
      notes: uniqStrings(input.notes ?? []),
    };

    this.sessions.set(record.sessionId, record);
    return cloneValue(record);
  }

  completeSession(input: {
    sessionId: string;
    responsePayload: unknown;
    notes?: string[];
  }): PantavionExternalBridgeSessionRecord | null {
    const existing = this.sessions.get(input.sessionId);
    if (!existing) {
      return null;
    }

    const updated: PantavionExternalBridgeSessionRecord = {
      ...existing,
      updatedAt: nowIso(),
      status: existing.status === 'blocked' ? 'blocked' : 'completed',
      responsePayload: cloneValue(input.responsePayload),
      notes: uniqStrings([...existing.notes, ...(input.notes ?? [])]),
    };

    this.sessions.set(updated.sessionId, updated);
    return cloneValue(updated);
  }

  listSessions(): PantavionExternalBridgeSessionRecord[] {
    return [...this.sessions.values()]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map((item) => cloneValue(item));
  }

  getSnapshot(): PantavionExternalBridgeSessionSnapshot {
    const list = this.listSessions();

    return {
      generatedAt: nowIso(),
      count: list.length,
      openCount: list.filter((item) => item.status === 'open').length,
      completedCount: list.filter((item) => item.status === 'completed').length,
      blockedCount: list.filter((item) => item.status === 'blocked').length,
      latestSessionId: list[0]?.sessionId,
    };
  }

  clear(): void {
    this.sessions.clear();
  }
}

export function createExternalBridgeSessionStore(): PantavionExternalBridgeSessionStore {
  return new PantavionExternalBridgeSessionStore();
}

export const externalBridgeSessionStore = createExternalBridgeSessionStore();

export function beginExternalBridgeSession(input: {
  capabilityKey: string;
  operationKey: string;
  adapterKey?: string;
  endpointKey?: string;
  requestPayload: unknown;
  mode: PantavionExternalBridgeSessionMode;
  notes?: string[];
}): PantavionExternalBridgeSessionRecord {
  return externalBridgeSessionStore.beginSession(input);
}

export function completeExternalBridgeSession(input: {
  sessionId: string;
  responsePayload: unknown;
  notes?: string[];
}): PantavionExternalBridgeSessionRecord | null {
  return externalBridgeSessionStore.completeSession(input);
}

export function listExternalBridgeSessions(): PantavionExternalBridgeSessionRecord[] {
  return externalBridgeSessionStore.listSessions();
}

export function getExternalBridgeSessionSnapshot(): PantavionExternalBridgeSessionSnapshot {
  return externalBridgeSessionStore.getSnapshot();
}

export default externalBridgeSessionStore;
