export function runPlan(plan: string[]) {
  const results = [];

  for (const step of plan) {
    results.push(`Executed: ${step}`);
  }

  return results;
}
