const fs = require("fs");
const path = require("path");

const root = process.cwd();
const outDir = path.join(root, "data", "pantavion-agent-code-writer");
const planPath = path.join(outDir, "codewriter-plan.json");
const slicesPath = path.join(outDir, "implementation-slices.json");

function readJson(relativePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

const workOrdersFile = readJson("data/pantavion-founder-doctrine/founder-doctrine-work-orders.json", { workOrders: [] });
const codeTargetsFile = readJson("data/pantavion-founder-doctrine/founder-doctrine-code-targets.json", { codeTargets: [] });

const workOrders = Array.isArray(workOrdersFile.workOrders) ? workOrdersFile.workOrders : [];
const codeTargets = Array.isArray(codeTargetsFile.codeTargets) ? codeTargetsFile.codeTargets : [];

const slices = codeTargets.map((target, index) => {
  const workOrder = workOrders.find((item) => item.id === target.workOrderId);

  return {
    id: `slice_${String(index + 1).padStart(3, "0")}_${target.category}`,
    workOrderId: target.workOrderId,
    title: workOrder ? workOrder.title : `Implement ${target.category}`,
    priority: target.priority,
    riskZone: target.riskZone,
    approvalRequired: target.approvalRequired,
    implementationMode: target.implementationMode,
    targetFiles: target.targetFiles,
    requiredChecks: [
      "npx tsc --noEmit --pretty false",
      "npm run build",
      "npm run audit:agent-runtime",
      "npm run audit:agent-tick"
    ],
    nextAction:
      target.approvalRequired
        ? "Prepare design and request founder approval before writing sensitive code."
        : "Safe internal implementation slice can be generated after supervisor selection.",
    truthRule:
      "Every generated feature must include route, state/data, audit/verification and must not be fake UI."
  };
});

const plan = {
  ok: true,
  id: "pantavion_agent_code_writer_plan_v1",
  generatedAt: new Date().toISOString(),
  source:
    "Founder doctrine deep intake + canonical archive + two-year recovery backlog",
  rule:
    "Code Writer turns doctrine work orders into scoped implementation slices. It does not run git add dot, force push, expose secrets or bypass founder approval.",
  currentRealCodeWritten: [
    "core/execution/pantavion-execution-kernel.ts",
    "app/api/pantavion/execute/route.ts",
    "app/api/pantavion/agents/runtime/founder-doctrine/route.ts",
    "app/api/pantavion/agents/runtime/code-writer/route.ts"
  ],
  blockedActions: [
    "git add .",
    "force push",
    "production deploy without founder approval",
    "billing without approval",
    "auth/user-data migration without approval",
    "DWG/source-truth transformation without approval",
    "secrets in committed files"
  ],
  totalSlices: slices.length,
  safeInternalSlices: slices.filter((slice) => !slice.approvalRequired).length,
  approvalQueue: slices.filter((slice) => slice.approvalRequired).length
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + "\n", "utf8");
fs.writeFileSync(slicesPath, JSON.stringify({ ok: true, slices }, null, 2) + "\n", "utf8");

console.log(JSON.stringify({
  ok: true,
  wrote: [
    "data/pantavion-agent-code-writer/codewriter-plan.json",
    "data/pantavion-agent-code-writer/implementation-slices.json"
  ],
  totalSlices: slices.length,
  safeInternalSlices: plan.safeInternalSlices,
  approvalQueue: plan.approvalQueue
}, null, 2));
