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