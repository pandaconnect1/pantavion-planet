const fs = require("fs");
const path = require("path");

const root = process.cwd();

const required = [
  "core/execution/pantavion-execution-kernel.ts",
  "app/api/pantavion/execute/route.ts",
  "app/api/pantavion/agents/runtime/founder-doctrine/route.ts",
  "app/api/pantavion/agents/runtime/code-writer/route.ts",
  "scripts/pantavion-founder-doctrine-ingest.cjs",
  "scripts/pantavion-agent-code-writer.cjs",
  "scripts/pantavion-founder-doctrine-gate.cjs",
  "data/pantavion-founder-doctrine/founder-doctrine-index.json",
  "data/pantavion-founder-doctrine/founder-doctrine-work-orders.json",
  "data/pantavion-founder-doctrine/founder-doctrine-code-targets.json",
  "data/pantavion-agent-code-writer/codewriter-plan.json",
  "data/pantavion-agent-code-writer/implementation-slices.json",
  "docs/continuity/pantavion-founder-doctrine-deep-intake.md",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const kernel = read("core/execution/pantavion-execution-kernel.ts");
const indexText = read("data/pantavion-founder-doctrine/founder-doctrine-index.json");
const workOrdersText = read("data/pantavion-founder-doctrine/founder-doctrine-work-orders.json");
const slicesText = read("data/pantavion-agent-code-writer/implementation-slices.json");
const planText = read("data/pantavion-agent-code-writer/codewriter-plan.json");
const packageText = read("package.json");

const requiredKernelMarkers = [
  "PANTAVION_EXECUTION_KERNEL_ID",
  "PANTAVION_CAPABILITY_REGISTRY",
  "parsePantavionIntent",
  "generatePantavionPlan",
  "executePantavionPlan",
  "runPantavionExecution",
  "Intent Structuring",
  "Website / App Blueprint",
  "DWG / Water Source Truth Gate"
];

for (const marker of requiredKernelMarkers) {
  if (!kernel.includes(marker)) failures.push("Execution kernel missing marker: " + marker);
}

let index = null;
let workOrders = null;
let slices = null;
let plan = null;
let pkg = null;

try { index = JSON.parse(indexText); } catch { failures.push("founder doctrine index invalid JSON"); }
try { workOrders = JSON.parse(workOrdersText); } catch { failures.push("founder work orders invalid JSON"); }
try { slices = JSON.parse(slicesText); } catch { failures.push("implementation slices invalid JSON"); }
try { plan = JSON.parse(planText); } catch { failures.push("codewriter plan invalid JSON"); }
try { pkg = JSON.parse(packageText); } catch { failures.push("package.json invalid JSON"); }

if (index) {
  if (!index.ok) failures.push("founder doctrine index not ok");
  if (index.sourceCount < 1) failures.push("founder doctrine indexed no sources");
}

if (workOrders) {
  if (!Array.isArray(workOrders.workOrders)) failures.push("workOrders must be an array");
  if (Array.isArray(workOrders.workOrders) && workOrders.workOrders.length < 5) {
    failures.push("founder doctrine must generate at least 5 work orders");
  }
}

if (slices) {
  if (!Array.isArray(slices.slices)) failures.push("slices must be an array");
  if (Array.isArray(slices.slices) && slices.slices.length < 5) {
    failures.push("code writer must generate at least 5 implementation slices");
  }
}

if (plan) {
  if (!plan.ok) failures.push("codewriter plan not ok");
  if (!Array.isArray(plan.blockedActions) || !plan.blockedActions.includes("git add .")) {
    failures.push("codewriter plan must block git add dot");
  }
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["agent:founder-doctrine"] !== "node scripts/pantavion-founder-doctrine-ingest.cjs") {
    failures.push("package.json missing agent:founder-doctrine");
  }

  if (pkg.scripts["agent:code-writer"] !== "node scripts/pantavion-agent-code-writer.cjs") {
    failures.push("package.json missing agent:code-writer");
  }

  if (pkg.scripts["audit:founder-doctrine"] !== "node scripts/pantavion-founder-doctrine-gate.cjs") {
    failures.push("package.json missing audit:founder-doctrine");
  }
}

const unsafe = kernel + "\n" + planText;

if (unsafe.includes("push --force")) failures.push("Unsafe force push text detected");
if (unsafe.includes("vercel --prod --yes")) failures.push("Unsafe automatic production deploy detected");

if (failures.length > 0) {
  console.error("PANTAVION FOUNDER DOCTRINE / EXECUTION GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION FOUNDER DOCTRINE / EXECUTION GATE: PASSED");
  console.log("- founder doctrine deep intake present");
  console.log("- work orders present");
  console.log("- code writer plan present");
  console.log("- real execution kernel present");
  console.log("- /api/pantavion/execute route present");
  console.log("- founder/code-writer routes present");
  console.log("- package scripts present");
}
