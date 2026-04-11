import type { KernelState } from "./types";

export function getKernelStats(state: KernelState) {
  return {
    memory: state.memory.length,
    planner: state.planner.length,
    tasksQueued: state.tasks.filter((t) => t.status === "queued").length,
    tasksDone: state.tasks.filter((t) => t.status === "done").length,
    signals: state.signals.length,
    radar: state.radar.length,
    audit: state.audit.length,
    healthyModules: state.modules.filter((m) => m.health === "green").length,
  };
}
