export function createPlan(input: string) {
  const plan = [];

  if (input.includes("build") || input.includes("χτίσε")) {
    plan.push("analyze request");
    plan.push("define modules");
    plan.push("create file structure");
    plan.push("generate code");
    plan.push("validate");
  }

  if (input.includes("voice")) {
    plan.push("setup voice engine");
  }

  if (input.includes("app")) {
    plan.push("setup backend");
    plan.push("setup frontend");
  }

  return plan;
}
