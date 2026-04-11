import type { KernelState } from "./types";
import { makeId, nowIso } from "./store";

function score(impact: number, confidence: number, urgency: number) {
  return impact * 3 + confidence * 2 + urgency * 2;
}

function ringFromScore(value: number) {
  if (value >= 27) return "adopt";
  if (value >= 22) return "trial";
  if (value >= 16) return "watch";
  return "hold";
}

export function addSignalEntry(
  state: KernelState,
  input: {
    name: string;
    category: string;
    description: string;
    impact: number;
    confidence: number;
    urgency: number;
  }
): KernelState {
  return {
    ...state,
    signals: [
      {
        id: makeId("sig"),
        name: input.name.trim(),
        category: input.category.trim(),
        description: input.description.trim(),
        impact: input.impact,
        confidence: input.confidence,
        urgency: input.urgency,
        createdAt: nowIso(),
      },
      ...state.signals,
    ].slice(0, 200),
    modules: state.modules.map((m) =>
      m.key === "intelligence"
        ? {
            ...m,
            state: "active",
            health: "green",
            changes: m.changes + 1,
            lastRunAt: nowIso(),
          }
        : m
    ),
  };
}

export function promoteTopSignal(state: KernelState): KernelState {
  const top = [...state.signals]
    .filter((s) => !state.radar.some((r) => r.signalId === s.id))
    .sort(
      (a, b) =>
        score(b.impact, b.confidence, b.urgency) -
        score(a.impact, a.confidence, a.urgency)
    )[0];

  if (!top) return state;

  const value = score(top.impact, top.confidence, top.urgency);

  return {
    ...state,
    radar: [
      {
        id: makeId("radar"),
        signalId: top.id,
        label: top.name,
        category: top.category,
        score: value,
        ring: ringFromScore(value),
        createdAt: nowIso(),
      },
      ...state.radar,
    ].slice(0, 200),
    modules: state.modules.map((m) =>
      m.key === "radar"
        ? {
            ...m,
            state: "active",
            health: "green",
            changes: m.changes + 1,
            lastRunAt: nowIso(),
          }
        : m
    ),
  };
}
