const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "core/agents/pantavion-agent-supervisor.ts",
  "app/api/pantavion/agents/runtime/supervisor/route.ts",
  "scripts/pantavion-agent-supervisor.cjs",
  "scripts/pantavion-agent-supervisor-gate.cjs",
  "docs/continuity/pantavion-agent-supervisor.md",
  "package.json"
];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const core = read("core/agents/pantavion-agent-supervisor.ts");
const route = read("app/api/pantavion/agents/runtime/supervisor/route.ts");
const script = read("scripts/pantavion-agent-supervisor.cjs");
const pkgText = read("package.json");

const markers = [
  "PANTAVION_AGENT_SUPERVISOR_ID",
  "createPantavionAgentSupervisorReport",
  "nextSafeSlice",
  "approvalQueue",
  "Z3 requires founder approval",
  "Every implementation must include route"
];

for (const marker of markers) {
  if (!core.includes(marker)) failures.push("Supervisor core missing marker: " + marker);
}

if (!route.includes("/api/pantavion/agents/runtime/supervisor")) {
  failures.push("Supervisor route path marker missing.");
}

if (!script.includes("implementation-slices.json")) {
  failures.push("Supervisor script must read implementation slices.");
}

if (!script.includes("selected-implementation-slice.json")) {
  failures.push("Supervisor script must write selected implementation slice.");
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["agent:supervisor"] !== "node scripts/pantavion-agent-supervisor.cjs") {
    failures.push("package.json missing agent:supervisor.");
  }

  if (pkg.scripts["audit:agent-supervisor"] !== "node scripts/pantavion-agent-supervisor-gate.cjs") {
    failures.push("package.json missing audit:agent-supervisor.");
  }
}

const dangerousExecution = script.toLowerCase();

if (dangerousExecution.includes("push --force")) failures.push("Supervisor script must not force push.");
if (dangerousExecution.includes("vercel --prod")) failures.push("Supervisor script must not production deploy.");
if (dangerousExecution.includes("rm -rf")) failures.push("Supervisor script must not contain destructive rm.");

if (failures.length > 0) {
  console.error("PANTAVION AGENT SUPERVISOR GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION AGENT SUPERVISOR GATE: PASSED");
  console.log("- supervisor core present");
  console.log("- supervisor route present");
  console.log("- supervisor script present");
  console.log("- selected slice output present");
  console.log("- approval queue logic present");
  console.log("- package scripts present");
}
