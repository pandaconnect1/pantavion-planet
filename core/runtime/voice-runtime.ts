// core/runtime/voice-runtime.ts

type UnknownRecord = Record<string, unknown>;

export interface PantavionResolvedIdentityPosture {
  actorId?: string;
  role?: string;
  scopes?: string[];
  metadata?: UnknownRecord;
}

export interface PantavionVoiceSessionRecord {
  sessionId: string;
  status: 'active' | 'paused' | 'ended';
  locale: string;
  mode: string;
  startedAt: string;
  updatedAt: string;
  metadata: UnknownRecord;
  lastTurnAt?: string;
  lastIntent?: string;
}

export interface PantavionVoiceTurnInput {
  text?: string;
  intent?: string;
  metadata?: UnknownRecord;
}

export interface PantavionVoiceSessionCreateInput {
  locale?: string;
  mode?: string;
  metadata?: UnknownRecord;
}

export interface PantavionVoiceTurnProcessOutput {
  status: 'completed' | 'blocked';
  sessionId: string;
  intent: string;
  outputText: string;
  confidence: number;
  metadata: UnknownRecord;
  turn: {
    status: 'completed' | 'blocked';
    intent: string;
    outputText: string;
    confidence: number;
  };
}

export interface PantavionVoiceRuntimeSnapshot {
  generatedAt: string;
  runtimeKey: string;
  sessionCount: number;
  activeCount: number;
  pausedCount: number;
  endedCount: number;
}

export interface PantavionVoiceRuntimeConfig {
  runtimeKey: string;
}

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === 'object' ? (value as UnknownRecord) : {};
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

export class PantavionVoiceRuntime {
  private readonly config: PantavionVoiceRuntimeConfig;
  private readonly sessions = new Map<string, PantavionVoiceSessionRecord>();

  constructor(config: Partial<PantavionVoiceRuntimeConfig> = {}) {
    this.config = {
      runtimeKey: config.runtimeKey ?? 'voice-runtime',
    };
  }

  createSession(
    input: PantavionVoiceSessionCreateInput,
  ): PantavionVoiceSessionRecord {
    const timestamp = nowIso();

    const session: PantavionVoiceSessionRecord = {
      sessionId: createId('vcs'),
      status: 'active',
      locale: input.locale ?? 'und',
      mode: input.mode ?? 'interpreter',
      startedAt: timestamp,
      updatedAt: timestamp,
      metadata: asRecord(input.metadata),
    };

    this.sessions.set(session.sessionId, session);
    return session;
  }

  processTurn(input: {
    sessionId: string;
    turn: PantavionVoiceTurnInput;
    identity?: PantavionResolvedIdentityPosture | null;
  }): PantavionVoiceTurnProcessOutput {
    const session = this.sessions.get(input.sessionId);

    if (!session) {
      return {
        status: 'blocked',
        sessionId: input.sessionId,
        intent: 'missing-session',
        outputText: '',
        confidence: 0,
        metadata: {
          reason: 'Voice session not found.',
          identityPresent: Boolean(input.identity),
        },
        turn: {
          status: 'blocked',
          intent: 'missing-session',
          outputText: '',
          confidence: 0,
        },
      };
    }

    const updated: PantavionVoiceSessionRecord = {
      ...session,
      updatedAt: nowIso(),
      lastTurnAt: nowIso(),
      lastIntent: readString(input.turn.intent, 'voice-turn'),
    };

    this.sessions.set(input.sessionId, updated);

    const intent = readString(input.turn.intent, 'voice-turn');
    const outputText = readString(input.turn.text, '');

    return {
      status: 'completed',
      sessionId: input.sessionId,
      intent,
      outputText,
      confidence: 0.92,
      metadata: {
        runtimeKey: this.config.runtimeKey,
        identityPresent: Boolean(input.identity),
        mode: updated.mode,
      },
      turn: {
        status: 'completed',
        intent,
        outputText,
        confidence: 0.92,
      },
    };
  }

  pauseSession(sessionId: string): PantavionVoiceSessionRecord | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const updated: PantavionVoiceSessionRecord = {
      ...session,
      status: 'paused',
      updatedAt: nowIso(),
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  endSession(sessionId: string): PantavionVoiceSessionRecord | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const updated: PantavionVoiceSessionRecord = {
      ...session,
      status: 'ended',
      updatedAt: nowIso(),
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  listSessions(): PantavionVoiceSessionRecord[] {
    return [...this.sessions.values()].sort((left, right) =>
      left.updatedAt.localeCompare(right.updatedAt),
    );
  }

  getSnapshot(): PantavionVoiceRuntimeSnapshot {
    const sessions = this.listSessions();

    return {
      generatedAt: nowIso(),
      runtimeKey: this.config.runtimeKey,
      sessionCount: sessions.length,
      activeCount: sessions.filter((item) => item.status === 'active').length,
      pausedCount: sessions.filter((item) => item.status === 'paused').length,
      endedCount: sessions.filter((item) => item.status === 'ended').length,
    };
  }
}

export function createVoiceRuntime(
  config: Partial<PantavionVoiceRuntimeConfig> = {},
): PantavionVoiceRuntime {
  return new PantavionVoiceRuntime(config);
}

export const voiceRuntime = createVoiceRuntime();

export function createVoiceSession(
  input: PantavionVoiceSessionCreateInput,
): PantavionVoiceSessionRecord {
  return voiceRuntime.createSession(input);
}

export function startVoiceSession(
  input: PantavionVoiceSessionCreateInput,
): PantavionVoiceSessionRecord {
  return voiceRuntime.createSession(input);
}

export async function processVoiceTurn(input: {
  sessionId: string;
  turn: PantavionVoiceTurnInput;
  identity?: PantavionResolvedIdentityPosture | null;
}): Promise<PantavionVoiceTurnProcessOutput> {
  return voiceRuntime.processTurn(input);
}

export function pauseVoiceSession(
  sessionId: string,
): PantavionVoiceSessionRecord | null {
  return voiceRuntime.pauseSession(sessionId);
}

export function endVoiceSession(
  sessionId: string,
): PantavionVoiceSessionRecord | null {
  return voiceRuntime.endSession(sessionId);
}

export function listVoiceSessions(): PantavionVoiceSessionRecord[] {
  return voiceRuntime.listSessions();
}

export function getVoiceRuntimeSnapshot(): PantavionVoiceRuntimeSnapshot {
  return voiceRuntime.getSnapshot();
}

export default voiceRuntime;
