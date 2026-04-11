import type { KernelState, MemoryEntry } from "./types";
import { makeId, nowIso } from "./store";

function bumpMemoryModule(state: KernelState): KernelState {
  return {
    ...state,
    modules: state.modules.map((m) =>
      m.key === "memory"
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

export function addMemoryEntry(
  state: KernelState,
  input: {
    text: string;
    tags?: string[];
    kind?: MemoryEntry["kind"];
  }
): KernelState {
  const next: KernelState = {
    ...state,
    memory: [
      {
        id: makeId("mem"),
        text: input.text.trim(),
        tags: (input.tags ?? []).filter(Boolean),
        kind: input.kind ?? "context",
        createdAt: nowIso(),
      },
      ...state.memory,
    ].slice(0, 200),
  };

  return bumpMemoryModule(next);
}
