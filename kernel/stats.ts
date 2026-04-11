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

export const getKernelStats = (state: any): KernelStats => {
  const intakeCount = Array.isArray(state?.intake) ? state.intake.length : 0;
  const memoryCount = Array.isArray(state?.memory?.entries) ? state.memory.entries.length : 0;
  const signalCount = Array.isArray(state?.signals) ? state.signals.length : 0;
  const planCount = Array.isArray(state?.plans) ? state.plans.length : 0;
  const taskCount = Array.isArray(state?.tasks) ? state.tasks.length : 0;
  const executionCount = Array.isArray(state?.executions) ? state.executions.length : 0;

  const completedTasks = Array.isArray(state?.tasks)
    ? state.tasks.filter((task: any) => task?.status === "completed").length
    : 0;

  const radarRing =
    typeof state?.priorities?.ring === "string"
      ? state.priorities.ring
      : "archived";

  const priorityBand =
    typeof state?.priorities?.band === "string"
      ? state.priorities.band
      : "BACKGROUND";

  return {
    intakeCount,
    memoryCount,
    signalCount,
    planCount,
    taskCount,
    executionCount,

    memory: memoryCount,
    planner: planCount,
    tasksDone: completedTasks,
    radar: radarRing,

    priorityBand,
    radarRing,
    healthStatus:
      typeof state?.health?.status === "string"
        ? state.health.status
        : "healthy",
    activeGoalCount: Array.isArray(state?.continuity?.activeGoals)
      ? state.continuity.activeGoals.length
      : 0,
    recommendedCapabilities: Array.isArray(state?.capabilities?.recommended)
      ? state.capabilities.recommended.filter((x: unknown) => typeof x === "string")
      : [],
  };
};
