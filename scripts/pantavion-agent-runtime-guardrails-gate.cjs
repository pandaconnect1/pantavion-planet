const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "AGENTS.md",
  "core/agents/pantavion-agent-runtime-guardrails.ts",
  "app/api/pantavion/agents/runtime/status/route.ts",
  "app/api/pantavion/agents/runtime/scan/route.ts",
  "app/api/pantavion/agents/runtime/approval/route.ts",
  "scripts/pantavion-agent-runtime-guardrails-gate.cjs",
  "docs/continuity/pantavion-agent-runtime-guardrails.md",
  "package.json",
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

const agents = read("AGENTS.md");
const core = read("core/agents/pantavion-agent-runtime-guardrails.ts");
const statusRoute = read("app/api/pantavion/agents/runtime/status/route.ts");
const scanRoute = read("app/api/pantavion/agents/runtime/scan/route.ts");
const approvalRoute = read("app/api/pantavion/agents/runtime/approval/route.ts");
const packageText = read("package.json");

const requiredCoreMarkers = [
  "PANTAVION_AGENT_RUNTIME_ID",
  "providerRegistry",
  "protocolFabric",
  "repoGuardrails",
  "sensitiveChangeClasses",
  "classifyPantavionChange",
  "runPantavionRepoSafetyScan",
  "appendPantavionAgentAuditRecord",
  "createPantavionFounderApprovalRequest",
  "requires_adapter",
];

for (const marker of requiredCoreMarkers) {
  if (!core.includes(marker)) failures.push("Core missing marker: " + marker);
}

if (!agents.includes("No `git add .`")) {
  failures.push("AGENTS.md must explicitly forbid git add dot.");
}

if (!agents.includes("founder approval")) {
  failures.push("AGENTS.md must require founder approval for sensitive changes.");
}

if (!statusRoute.includes("getPantavionAgentRuntimeStatus")) {
  failures.push("status route must expose runtime status.");
}

if (!scanRoute.includes("runPantavionRepoSafetyScan")) {
  failures.push("scan route must execute repo safety scan.");
}

if (!approvalRoute.includes("createPantavionFounderApprovalRequest")) {
  failures.push("approval route must create founder approval request.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (
  packageJson &&
  packageJson.scripts &&
  packageJson.scripts["audit:agent-runtime"] !==
    "node scripts/pantavion-agent-runtime-guardrails-gate.cjs"
) {
  failures.push("package.json must include audit:agent-runtime script.");
}

if (core.includes("git add .") && !core.includes('"git add ."')) {
  failures.push("Core must not instruct blanket git add as a next command.");
}

if (failures.length > 0) {
  console.error("PANTAVION AGENT RUNTIME GUARDRAILS GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION AGENT RUNTIME GUARDRAILS GATE: PASSED");
  console.log("- AGENTS.md canonical contract present");
  console.log("- provider registry present");
  console.log("- protocol fabric present");
  console.log("- sensitive-change classifier present");
  console.log("- repo safety scan route present");
  console.log("- founder approval route present");
  console.log("- filesystem audit jsonl present by runtime action");
}
