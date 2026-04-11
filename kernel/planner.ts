import type { KernelState, KernelPriority } from "./types";
import { makeId, nowIso } from "./store";

function bumpPlannerModule(state: KernelState): KernelState {
  return {
    ...state,
    modules: state.modules.map((m) =>
      m.key === "planner"
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

export function addPlannerEntry(
  state: KernelState,
  input: {
    title: string;
    detail: string;
    domain: string;
    priority: KernelPriority;
  }
): KernelState {
  const next: KernelState = {
    ...state,
    planner: [
      {
        id: makeId("plan"),
        title: input.title.trim(),
        detail: input.detail.trim(),
        domain: input.domain.trim(),
        priority: input.priority,
        status: "planned",
        createdAt: nowIso(),
      },
      ...state.planner,
    ].slice(0, 200),
  };

  return bumpPlannerModule(next);
}

export function queuePlannedWork(state: KernelState): KernelState {
  const planned = state.planner.find((p) => p.status === "planned");
  if (!planned) return state;

  return {
    ...state,
    planner: state.planner.map((p) =>
      p.id === planned.id ? { ...p, status: "queued" } : p
    ),
  };
}
