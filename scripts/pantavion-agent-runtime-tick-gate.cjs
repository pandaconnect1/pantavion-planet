const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/agents/pantavion-agent-runtime-tick.ts",
  "app/api/pantavion/agents/runtime/tick/route.ts",
  "scripts/pantavion-agent-tick.cjs",
  "scripts/pantavion-agent-daemon.cjs",
  "scripts/pantavion-agent-runtime-tick-gate.cjs",
  "docs/continuity/pantavion-agent-runtime-tick.md",
  "package.json"
];

const failures = [];

function read(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

for (const file of requiredFiles) read(file);

const core = read("core/agents/pantavion-agent-runtime-tick.ts");
const route = read("app/api/pantavion/agents/runtime/tick/route.ts");
const tickScript = read("scripts/pantavion-agent-tick.cjs");
const daemonScript = read("scripts/pantavion-agent-daemon.cjs");
const packageText = read("package.json");

const requiredMarkers = [
  "runPantavionAgentRuntimeTick",
  "readPantavionAgentRuntimeState",
  ".pantavion",
  "agent-runtime",
  "state.json",
  "appendPantavionAgentAuditRecord",
  "founderApprovalGate"
];

for (const marker of requiredMarkers) {
  if (!core.includes(marker)) failures.push("Tick core missing marker: " + marker);
}

if (!route.includes("runPantavionAgentRuntimeTick")) {
  failures.push("Tick route must execute runtime tick.");
}

if (!tickScript.includes("runTick")) {
  failures.push("agent:tick script must expose runTick.");
}

if (!daemonScript.includes("local_bounded_daemon")) {
  failures.push("agent:daemon must be bounded by default.");
}

if (tickScript.includes("git add .") || daemonScript.includes("git add .")) {
  failures.push("Tick/daemon scripts must not include blanket git add.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (packageJson && packageJson.scripts) {
  if (packageJson.scripts["agent:tick"] !== "node scripts/pantavion-agent-tick.cjs") {
    failures.push("package.json must include agent:tick script.");
  }

  if (packageJson.scripts["agent:daemon"] !== "node scripts/pantavion-agent-daemon.cjs") {
    failures.push("package.json must include agent:daemon script.");
  }

  if (
    packageJson.scripts["audit:agent-tick"] !==
    "node scripts/pantavion-agent-runtime-tick-gate.cjs"
  ) {
    failures.push("package.json must include audit:agent-tick script.");
  }
}

if (failures.length > 0) {
  console.error("PANTAVION AGENT RUNTIME TICK GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION AGENT RUNTIME TICK GATE: PASSED");
  console.log("- tick core present");
  console.log("- tick route present");
  console.log("- local tick script present");
  console.log("- bounded local daemon present");
  console.log("- state/audit contract present");
  console.log("- package scripts present");
}
