const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

function absolute(relativePath) {
  return path.join(root, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath));
}

function read(relativePath) {
  if (!exists(relativePath)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(absolute(relativePath), "utf8").replace(/^\uFEFF/, "");
}

function assertIncludes(relativePath, marker, message) {
  const content = read(relativePath);
  if (!content.includes(marker)) {
    failures.push(message + " (" + relativePath + ")");
  }
}

const requiredFiles = [
  "package.json",
  "vercel.json",
  "scripts/pantavion-implementation-gate.cjs",
  "core/kernel/pantavion-implementation-engine.ts",
  "app/api/pantavion/intelligence/cron/route.ts",
  "scripts/pantavion-vscode-real-implementation-gate.cjs",
  ".github/workflows/pantavion-runtime-safety.yml",
  ".vscode/tasks.json",
  "core/runtime/secure-scheduled-worker.ts",
  "supabase/migrations/20260824134053_create_secure_scheduled_worker.sql",
  "scripts/pantavion-secure-scheduled-worker-gate.cjs",
];

for (const file of requiredFiles) {
  if (!exists(file)) failures.push("Missing required file: " + file);
}

let packageJson = null;
const packageJsonText = read("package.json");

try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is not valid JSON.");
}

if (packageJson) {
  if (
    packageJson.scripts?.["audit:implementation"] !==
    "node scripts/pantavion-implementation-gate.cjs"
  ) {
    failures.push("package.json must preserve audit:implementation.");
  }

  if (packageJson.scripts?.typecheck !== "tsc --noEmit") {
    failures.push("package.json must include a real typecheck script.");
  }

  const verifyScript = packageJson.scripts?.["verify:runtime-safety"] || "";
  const requiredVerifyParts = [
    "npm run audit:implementation",
    "node scripts/pantavion-vscode-real-implementation-gate.cjs",
    "npm run typecheck",
    "npm run build",
  ];

  for (const part of requiredVerifyParts) {
    if (!verifyScript.includes(part)) {
      failures.push("verify:runtime-safety missing step: " + part);
    }
  }
}

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "pantavion_implementation_engine_v1",
  "Implementation engine contract marker is missing",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No fake UI",
  "Implementation engine must block fake UI",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No visual-only features",
  "Implementation engine must block visual-only features",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No fake connected systems",
  "Implementation engine must block fake connected systems",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No dead buttons",
  "Implementation engine must block dead buttons",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No static-only completion claims",
  "Implementation engine must block static-only claims",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No button without route API runtime function or disabled beta boundary",
  "Implementation engine must block visible buttons without runtime path",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "No architecture-only claim as implemented product behavior",
  "Implementation engine must block architecture-only implementation claims",
);

assertIncludes(
  "core/kernel/pantavion-implementation-engine.ts",
  "pantavionRealityNonNegotiables",
  "Implementation engine must expose reality non-negotiables",
);

const cronRoute = read("app/api/pantavion/intelligence/cron/route.ts");

if (!cronRoute.includes("CRON_SECRET")) {
  failures.push("Cron route must use CRON_SECRET.");
}

if (cronRoute.includes("unprotected_until_cron_secret_is_configured")) {
  failures.push("Cron route must not allow unprotected production cron without CRON_SECRET.");
}

if (!cronRoute.includes('process.env.NODE_ENV === "production"')) {
  failures.push("Cron route must explicitly identify the production boundary.");
}

if (!cronRoute.includes("blocked_missing_cron_secret")) {
  failures.push("Cron route must fail closed when CRON_SECRET is missing.");
}

if (!cronRoute.includes("blocked_invalid_cron_secret")) {
  failures.push("Cron route must fail closed when CRON_SECRET is invalid.");
}

if (!cronRoute.includes("timingSafeEqual")) {
  failures.push("Cron route must compare the secret with a timing-safe operation.");
}

if (!cronRoute.includes("runSecureScheduledWorker")) {
  failures.push("Cron route must execute through the secure scheduled-worker wrapper.");
}

if (
  cronRoute.includes("PANTAVION_ALLOW_VERCEL_CRON_USER_AGENT") ||
  cronRoute.includes("vercel-cron/1.0")
) {
  failures.push("Cron route must not authorize production requests by user-agent.");
}

const workflow = read(".github/workflows/pantavion-runtime-safety.yml");
const workflowMarkers = [
  "npm run audit:water:network-lock",
  "npm run audit:implementation",
  "npm run audit:scheduled-worker",
  "node scripts/pantavion-vscode-real-implementation-gate.cjs",
  "npm run typecheck",
  "npm run build",
  "pull_request",
  "push",
  "workflow_dispatch",
];

for (const marker of workflowMarkers) {
  if (!workflow.includes(marker)) {
    failures.push("Runtime safety workflow missing marker: " + marker);
  }
}

if (
  !workflow.includes("npm ci") &&
  !workflow.includes("npm install --no-audit --no-fund")
) {
  failures.push("Runtime safety workflow must install dependencies with npm ci or npm install --no-audit --no-fund.");
}

const vscodeTasks = read(".vscode/tasks.json");
if (!vscodeTasks.includes("Pantavion: verify runtime safety")) {
  failures.push("VS Code tasks must include Pantavion runtime safety task.");
}
if (!vscodeTasks.includes("npm run verify:runtime-safety")) {
  failures.push("VS Code runtime safety task must run verify:runtime-safety.");
}

const checkedTexts = [
  packageJsonText,
  workflow,
  vscodeTasks,
  cronRoute,
];

const unsafeGitAddAll = ["git", "add", "."].join(" ");

for (const text of checkedTexts) {
  if (text.includes(unsafeGitAddAll)) {
    failures.push("Runtime safety files must not contain unsafe broad git add command.");
  }
}

const sensitiveMarkers = [
  ["water-network-private", "processed", "water-network.geojson"].join("/"),
  ["raw", "DWG", "public"].join(" "),
  ["raw", "DXF", "public"].join(" "),
  ["raw", "KMZ", "public"].join(" "),
];

for (const marker of sensitiveMarkers) {
  for (const text of checkedTexts) {
    if (text.includes(marker)) {
      failures.push("Forbidden private infrastructure exposure marker found: " + marker);
    }
  }
}

if (failures.length > 0) {
  console.error("PANTAVION VS CODE REAL IMPLEMENTATION GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION VS CODE REAL IMPLEMENTATION GATE: PASSED");
  console.log("- real implementation gate present");
  console.log("- static/fake/dead-button doctrine checked");
  console.log("- audit/build/typecheck chain required");
  console.log("- cron secret production boundary checked");
  console.log("- GitHub Actions runtime safety workflow checked");
  console.log("- VS Code runtime safety task checked");
}