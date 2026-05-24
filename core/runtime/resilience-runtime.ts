export type PantavionResilienceMode = 'normal' | 'degraded' | 'fallback' | 'protected';

export interface PantavionResilienceState {
  mode: PantavionResilienceMode;
  reasons: string[];
  updatedAt: string;
}

export function createResilienceState(
  mode: PantavionResilienceMode = 'normal',
  reasons: string[] = [],
): PantavionResilienceState {
  return {
    mode,
    reasons,
    updatedAt: new Date().toISOString(),
  };
}