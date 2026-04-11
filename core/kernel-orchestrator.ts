import { createPlan, classifyInput } from "./kernel-planner";
import { appendKernelRun } from "./kernel-store";
import type { KernelRunResult } from "./kernel-types";

function nowIso() {
  return new Date().toISOString();
}

export async function executeKernel(input: string) {
  const classification = classifyInput(input);
  const plan = createPlan(input, classification);

  const outputs = [
    "Request classified successfully.",
    `Primary module: ${classification.targetModule}`,
    `Delivery mode: ${classification.deliveryMode}`,
    `Plan steps prepared: ${plan.length}`
  ];

  const run: KernelRunResult = {
    id: crypto.randomUUID(),
    input,
    classification,
    plan,
    outputs,
    createdAt: nowIso()
  };

  const state = await appendKernelRun(run);

  return {
    run,
    stateSummary: {
      totalRuns: state.runs.length,
      totalMemories: state.memories.length,
      lastUpdatedAt: state.lastUpdatedAt
    }
  };
}
