export interface PantavionVoiceRuntimeRequest {
  requestId: string;
  locale?: string;
  inputMode: 'speech-to-text' | 'text-to-speech' | 'live-translation' | 'duplex';
  metadata: Record<string, unknown>;
}

export function createVoiceRuntimeRequest(input: {
  requestId: string;
  inputMode: PantavionVoiceRuntimeRequest['inputMode'];
  locale?: string;
  metadata?: Record<string, unknown>;
}): PantavionVoiceRuntimeRequest {
  return {
    requestId: input.requestId,
    inputMode: input.inputMode,
    locale: input.locale,
    metadata: input.metadata ?? {},
  };
}

export interface PantavionVoiceSessionRecord {
  sessionId: string;
  locale: string;
  mode: string;
  metadata: Record<string, unknown>;
}

export interface PantavionVoiceTurnProcessOutput {
  turn: {
    status: "pending" | "completed" | "failed";
    intent: string;
    text?: string;
  };
}

export interface PantavionVoiceRuntime {
  createSession(input: {
    locale: string;
    mode: string;
    metadata?: Record<string, unknown>;
  }): PantavionVoiceSessionRecord;
  processTurn(input: {
    sessionId: string;
    identity?: unknown;
    turn: {
      text: string;
      intent: string;
      metadata?: Record<string, unknown>;
    };
  }): Promise<PantavionVoiceTurnProcessOutput>;
}

export const voiceRuntime: PantavionVoiceRuntime = {
  createSession(input) {
    return {
      sessionId: `voice_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      locale: input.locale,
      mode: input.mode,
      metadata: input.metadata ?? {},
    };
  },

  async processTurn(input) {
    return {
      turn: {
        status: "completed",
        intent: input.turn.intent,
        text: input.turn.text,
      },
    };
  },
};