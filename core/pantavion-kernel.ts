import { createPlan } from "./pantavion-planner";
import { runPlan } from "./pantavion-runner";
import { addMemory } from "./pantavion-memory";

export function kernelExecute(input: string) {
  addMemory("directive", input);

  const plan = createPlan(input);
  const results = runPlan(plan);

  addMemory("task", JSON.stringify(results));

  return {
    input,
    plan,
    results
  };
}
