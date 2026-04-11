import type { KernelState, KernelPriority } from "./types";
import { makeId, nowIso } from "./store";

function bumpRunnerModule(state: KernelState, success = true): KernelState {
  return {
    ...state,
    modules: state.modules.map((m) =>
      m.key === "runner"
        ? {
            ...m,
            state: "active",
            health: success ? "green" : "red",
            runs: m.runs + 1,
            changes: m.changes + 1,
            errors: success ? m.errors : m.errors + 1,
            lastRunAt: nowIso(),
          }
        : m
    ),
  };
}

export function addTaskEntry(
  state: KernelState,
  input: {
    title: string;
    area: string;
    priority: KernelPriority;
  }
): KernelState {
  const next: KernelState = {
    ...state,
    tasks: [
      {
        id: makeId("task"),
        title: input.title.trim(),
        area: input.area.trim(),
        priority: input.priority,
        status: "queued",
        createdAt: nowIso(),
      },
      ...state.tasks,
    ].slice(0, 200),
  };

  return bumpRunnerModule(next);
}

export function executeNextTask(state: KernelState): KernelState {
  const nextTask = state.tasks.find((t) => t.status === "queued");
  if (!nextTask) return state;

  const next: KernelState = {
    ...state,
    tasks: state.tasks.map((t) =>
      t.id === nextTask.id
        ? {
            ...t,
            status: "done",
            startedAt: nowIso(),
            endedAt: nowIso(),
            result: `Executed cleanly for ${t.area}`,
          }
        : t
    ),
    planner: state.planner.map((p) =>
      `Planner: ${p.title}` === nextTask.title && p.status !== "done"
        ? { ...p, status: "done" }
        : p
    ),
  };

  return bumpRunnerModule(next);
}
