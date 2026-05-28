export type PantavionResilienceMode = "normal" | "degraded" | "fallback" | "protected" | "critical" | "emergency" | "offline-buffered";

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


export interface PantavionResilienceEvaluation {
  mode: PantavionResilienceMode;
  canContinue: boolean;
  recommendedActions: string[];
}

export type PantavionResilienceSnapshot = ReturnType<typeof getResilienceSnapshot>;

export interface PantavionResilienceRuntime {
  registerService(input: {
    serviceKey: string;
    family: string;
    status: "healthy" | "degraded" | "offline" | string;
    details?: string;
    metadata?: Record<string, unknown>;
  }): void;
}

const resilienceServices = new Map<string, unknown>();

export function evaluateResilience(input: Record<string, unknown> = {}): PantavionResilienceEvaluation {
  const snapshot = getResilienceSnapshot();

  return {
    mode: snapshot.mode,
    canContinue: snapshot.mode !== "fallback",
    recommendedActions: snapshot.degraded ? ["review-degraded-services"] : [],
  };
}

export const resilienceRuntime: PantavionResilienceRuntime = {
  registerService(input) {
    resilienceServices.set(input.serviceKey, input);
  },
};