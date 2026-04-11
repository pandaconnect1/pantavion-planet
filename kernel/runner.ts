import type {
  ExecutionMode,
  ExecutionRecord,
  KernelOutput,
  KernelState,
  Plan,
  PlanStep,
} from "./types";
import { createKernelId, nowIso } from "./types";

export interface ExecutionRunResult {
  updatedPlan: Plan;
  record: ExecutionRecord;
  output: KernelOutput;
}

const completeStep = (
  step: PlanStep,
  mode: ExecutionMode
): { next: PlanStep; message: string; output?: string } => {
  if (mode === "dry_run" && (step.kind === "execute" || step.requiresApproval)) {
    return {
      next: { ...step, status: "blocked" },
      message: "Blocked in dry-run mode or waiting for approval.",
    };
  }

  return {
    next: { ...step, status: "completed" },
    message: "Step completed successfully.",
    output: step.description,
  };
};

export const runPlan = (
  plan: Plan,
  state: KernelState,
  mode: ExecutionMode = "dry_run"
): ExecutionRunResult => {
  const startedAt = nowIso();
  const stepResults: ExecutionRecord["stepResults"] = [];

  const updatedSteps = plan.steps.map((currentStep) => {
    const result = completeStep(currentStep, mode);
    stepResults.push({
      stepId: currentStep.id,
      status: result.next.status,
      message: result.message,
      output: result.output,
    });
    return result.next;
  });

  const blockedCount = stepResults.filter((result) => result.status === "blocked").length;
  const failedCount = stepResults.filter((result) => result.status === "failed").length;

  const status: ExecutionRecord["status"] =
    failedCount > 0 ? "failed" : blockedCount > 0 ? "blocked" : "completed";

  const finishedAt = nowIso();
  const updatedPlan: Plan = {
    ...plan,
    updatedAt: finishedAt,
    status: status === "completed" ? "completed" : status === "failed" ? "failed" : "running",
    steps: updatedSteps,
  };

  const record: ExecutionRecord = {
    id: createKernelId("exec"),
    planId: plan.id,
    mode,
    status,
    startedAt,
    finishedAt,
    stepResults,
    summary:
      mode === "dry_run"
        ? "Dry-run execution completed. No committed external side effects were performed."
        : "Commit execution completed under canonical kernel control.",
    error: failedCount > 0 ? "One or more plan steps failed." : undefined,
  };

  const latestMemoryCount = state.memory.entries.length;
  const latestSignalCount = state.signals.length;

  const output: KernelOutput = {
    id: createKernelId("out"),
    createdAt: finishedAt,
    type: "run",
    title: mode === "dry_run" ? "Kernel dry-run result" : "Kernel commit result",
    content: [
      "Plan executed by Pantavion Kernel Runner.",
      "Mode: " + mode,
      "Plan Goal: " + plan.goal,
      "Plan Status: " + updatedPlan.status,
      "Step Results: " + stepResults.length,
      "Blocked Steps: " + blockedCount,
      "Memory Count: " + latestMemoryCount,
      "Signal Count: " + latestSignalCount,
      record.summary,
    ].join("\n"),
    truthZone: "likely",
    relatedIds: [plan.id, record.id],
  };

  return {
    updatedPlan,
    record,
    output,
  };
};

/* PANTAVION_LEGACY_RUNNER_COMPAT */
const cloneRunnerCompat = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const addTaskEntry = (state: any, task: any): any => {
  const next = cloneRunnerCompat(state ?? {});
  next.tasks = Array.isArray(next.tasks) ? next.tasks : [];

  const normalized = {
    id: task?.id ?? createKernelId("step"),
    kind: task?.kind ?? "execute",
    title: task?.title ?? task?.label ?? "Legacy task entry",
    description:
      task?.description ??
      task?.summary ??
      "Legacy task entry added for compatibility with app/evolution/page.tsx",
    status: task?.status ?? "pending",
    requiresApproval: Boolean(task?.requiresApproval ?? false),
    metadata: task?.metadata ?? {},
  };

  next.tasks.push(normalized);
  return next;
};

