export type PantavionResilienceMode = "normal" | "degraded" | "fallback" | "protected";

export interface PantavionResilienceState {
  mode: PantavionResilienceMode;
  reasons: string[];
  updatedAt: string;
}

let currentResilienceState: PantavionResilienceState = createResilienceState();

export function createResilienceState(
  mode: PantavionResilienceMode = "normal",
  reasons: string[] = [],
): PantavionResilienceState {
  return {
    mode,
    reasons,
    updatedAt: new Date().toISOString(),
  };
}

export function setResilienceMode(
  mode: PantavionResilienceMode,
  reasons: string[] = [],
): PantavionResilienceState {
  currentResilienceState = createResilienceState(mode, reasons);
  return currentResilienceState;
}

export function getResilienceSnapshot() {
  return {
    ...currentResilienceState,
    healthy: currentResilienceState.mode === "normal",
    protected: currentResilienceState.mode === "protected",
    degraded:
      currentResilienceState.mode === "degraded" ||
      currentResilienceState.mode === "fallback",
  };
}