import type { KernelState, KernelStateSummary, PriorityBand, RadarRing } from "./types";

export interface KernelStats {
  intakeCount: number;
  memoryCount: number;
  signalCount: number;
  planCount: number;
  taskCount: number;
  executionCount: number;

  memory: number;
  planner: number;
  tasksDone: number;
  radar: string;
  signals: number;
  audit: number;
  tasksQueued: number;
  healthyModules: number;

  priorityBand: PriorityBand | Lowercase<PriorityBand>;
  radarRing: RadarRing;
  healthStatus: string;
  activeGoalCount: number;
  recommendedCapabilities: string[];
}

export const buildKernelStateSummary = (state: KernelState): KernelStateSummary => {
  const lastPlan = state.plans[state.plans.length - 1];
  const lastOutput = state.outputs[state.outputs.length - 1];

  return {
    sessionId: state.session.id,
    status: state.health.status,
    counts: state.health.counters,
    priorityBand: state.priorities.band,
    radarRing: state.priorities.ring,
    activeGoalCount: state.continuity.activeGoals.length,
    recommendedCapabilities: state.capabilities.recommended,
    lastPlanId: lastPlan?.id,
    lastOutputType: lastOutput?.type,
    updatedAt: state.session.updatedAt,
  };
};

const countArray = (value: unknown): number => (Array.isArray(value) ? value.length : 0);

export const getKernelStats = (state: any): KernelStats => {
  const intake = Array.isArray(state?.intake) ? state.intake : [];
  const memoryEntries = Array.isArray(state?.memory?.entries) ? state.memory.entries : [];
  const signals = Array.isArray(state?.signals) ? state.signals : [];
  const plans = Array.isArray(state?.plans) ? state.plans : [];
  const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
  const executions = Array.isArray(state?.executions) ? state.executions : [];
  const audit = Array.isArray(state?.audit) ? state.audit : [];

  const tasksDone = tasks.filter((task: any) => task?.status === "completed").length;
  const tasksQueued = tasks.filter((task: any) =>
    ["pending", "running", "blocked"].includes(String(task?.status ?? "pending"))
  ).length;

  const radarRing =
    typeof state?.priorities?.ring === "string"
      ? state.priorities.ring
      : "archived";

  const priorityBand =
    typeof state?.priorities?.band === "string"
      ? state.priorities.band
      : "BACKGROUND";

  const healthyModules = Array.isArray(state?.modules)
    ? state.modules.filter((mod: any) => {
        if (!mod || typeof mod !== "object") return false;
        if (mod.enabled === false) return false;
        if (typeof mod.status === "string" && mod.status.toLowerCase() === "unhealthy") return false;
        return true;
      }).length
    : Array.isArray(state?.capabilities?.enabled)
    ? state.capabilities.enabled.length
    : 0;

  return {
    intakeCount: intake.length,
    memoryCount: memoryEntries.length,
    signalCount: signals.length,
    planCount: plans.length,
    taskCount: tasks.length,
    executionCount: executions.length,

    memory: memoryEntries.length,
    planner: plans.length,
    tasksDone,
    radar: radarRing,
    signals: signals.length,
    audit: audit.length,
    tasksQueued,
    healthyModules,

    priorityBand,
    radarRing,
    healthStatus:
      typeof state?.health?.status === "string"
        ? state.health.status
        : "healthy",
    activeGoalCount: countArray(state?.continuity?.activeGoals),
    recommendedCapabilities: Array.isArray(state?.capabilities?.recommended)
      ? state.capabilities.recommended.filter((x: unknown) => typeof x === "string")
      : [],
  };
};
