import type { KernelState } from "./types";
import { addAuditEntry } from "./audit";
import { queuePlannedWork } from "./planner";
import { addTaskEntry, executeNextTask } from "./runner";
import { promoteTopSignal } from "./intelligence";
import { nowIso } from "./store";

export function runEvolutionCycle(state: KernelState): KernelState {
  let next = state;

  const planned = next.planner.find((p) => p.status === "planned");
  const hasQueuedTask = next.tasks.some((t) => t.status === "queued");

  if (planned && !hasQueuedTask) {
    next = queuePlannedWork(next);
    next = addTaskEntry(next, {
      title: `Planner: ${planned.title}`,
      area: planned.domain,
      priority: planned.priority,
    });
    next = addAuditEntry(next, "planner.queued", planned.id, `Queued planner item: ${planned.title}`);
  }

  next = executeNextTask(next);
  next = promoteTopSignal(next);

  next = {
    ...next,
    modules: next.modules.map((m) =>
      m.key === "evolution"
        ? {
            ...m,
            state: "active",
            health: "green",
            runs: m.runs + 1,
            changes: m.changes + 1,
            lastRunAt: nowIso(),
          }
        : m
    ),
  };

  next = addAuditEntry(next, "evolution.run", "kernel", "Ran evolution cycle.");

  return next;
}
