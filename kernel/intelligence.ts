import type { KernelState, RadarRing } from "./types";
import { makeId, nowIso } from "./store";

function score(impact: number, confidence: number, urgency: number) {
  return impact * 3 + confidence * 2 + urgency * 2;
}

function ringFromScore(value: number): RadarRing {
  if (value >= 27) return "adopt";
  if (value >= 22) return "trial";
  if (value >= 16) return "watch";
  return "hold";
}

function sortSignalsByPriority(state: KernelState) {
  return [...state.signals].sort((a, b) => {
    const aScore = score(a.impact, a.confidence, a.urgency);
    const bScore = score(b.impact, b.confidence, b.urgency);
    return bScore - aScore;
  });
}

function updateModuleState(state: KernelState, moduleKey: string): KernelState["modules"] {
  return state.modules.map((m) =>
    m.key === moduleKey
      ? {
          ...m,
          state: "active",
          health: "green",
          changes: m.changes + 1,
          lastRunAt: nowIso(),
        }
      : m,
  );
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
  },
): KernelState {
  const cleanName = input.name.trim();
  const cleanCategory = input.category.trim();
  const cleanDescription = input.description.trim();

  if (!cleanName || !cleanCategory || !cleanDescription) {
    return state;
  }

  const nextSignal = {
    id: makeId("sig"),
    name: cleanName,
    category: cleanCategory,
    description: cleanDescription,
    impact: input.impact,
    confidence: input.confidence,
    urgency: input.urgency,
    createdAt: nowIso(),
  };

  const nextSignals = [nextSignal, ...state.signals].slice(0, 200);
  const top = nextSignals[0];
  if (!top) return state;

  const value = score(top.impact, top.confidence, top.urgency);

  return {
    ...state,
    signals: nextSignals,
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
    modules: updateModuleState(state, "radar"),
  };
}

export function promoteTopSignal(state: KernelState): KernelState {
  const ranked = sortSignalsByPriority(state);
  const top = ranked[0];

  if (!top) {
    return state;
  }

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
      ...state.radar.filter((entry) => entry.signalId !== top.id),
    ].slice(0, 200),
    modules: updateModuleState(state, "radar"),
  };
}
