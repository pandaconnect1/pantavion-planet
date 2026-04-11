import type { KernelEvolutionSnapshot, KernelState } from "./types";
import { nowIso } from "./types";

export const buildKernelEvolutionSnapshot = (
  state: KernelState
): KernelEvolutionSnapshot => {
  const maturity: KernelEvolutionSnapshot["maturity"] =
    state.executions.length >= 10
      ? "colossus"
      : state.plans.length >= 5
      ? "orchestrating"
      : state.signals.length >= 3
      ? "expanding"
      : "baseline";

  return {
    generatedAt: nowIso(),
    maturity,
    activeGoalCount: state.continuity.activeGoals.length,
    memoryCount: state.memory.entries.length,
    signalCount: state.signals.length,
    planCount: state.plans.length,
    executionCount: state.executions.length,
    recommendedNextMoves: [
      "Canonicalize kernel paths and route imports.",
      "Extend multimodal intake beyond text.",
      "Attach capability registry and workspace routing.",
      "Harden audit, policy gating, and degraded-mode behavior.",
    ],
  };
};

/* PANTAVION_LEGACY_EVOLUTION_COMPAT */
const cloneEvolutionCompat = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

export const runEvolutionCycle = (state: any): any => {
  const next = cloneEvolutionCompat(state ?? {});

  next.health = next.health ?? {};
  next.health.status = next.health.status ?? "healthy";
  next.health.lastUpdated = nowIso();
  next.health.counters = next.health.counters ?? {
    intakes: Array.isArray(next.intake) ? next.intake.length : 0,
    memories: Array.isArray(next.memory?.entries) ? next.memory.entries.length : 0,
    signals: Array.isArray(next.signals) ? next.signals.length : 0,
    plans: Array.isArray(next.plans) ? next.plans.length : 0,
    executions: Array.isArray(next.executions) ? next.executions.length : 0,
  };

  next.continuity = next.continuity ?? {};
  next.continuity.activeGoals = Array.isArray(next.continuity.activeGoals)
    ? next.continuity.activeGoals
    : [];
  next.continuity.lockedBaselines = Array.isArray(next.continuity.lockedBaselines)
    ? next.continuity.lockedBaselines
    : [];
  next.continuity.openThreads = Array.isArray(next.continuity.openThreads)
    ? next.continuity.openThreads
    : [];
  next.continuity.preferences = Array.isArray(next.continuity.preferences)
    ? next.continuity.preferences
    : [];

  next.evolution = buildKernelEvolutionSnapshot(next as KernelState);

  return next;
};
