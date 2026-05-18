const fs = require("fs");
const path = require("path");

const root = process.cwd();

const requiredFiles = [
  "core/intelligence/pantavion-intelligence-ledger.ts",
  "app/api/pantavion/intelligence/cron/route.ts",
  "app/api/pantavion/intelligence/ledger/route.ts",
  "app/api/pantavion/intelligence/health/route.ts",
  "app/pantavion/intelligence/cloud/page.tsx",
  "scripts/pantavion-intelligence-cloud-runtime-gate.cjs",
  "docs/continuity/pantavion-intelligence-cloud-runtime.md",
  "vercel.json",
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

const ledger = read("core/intelligence/pantavion-intelligence-ledger.ts");
const cronRoute = read("app/api/pantavion/intelligence/cron/route.ts");
const ledgerRoute = read("app/api/pantavion/intelligence/ledger/route.ts");
const healthRoute = read("app/api/pantavion/intelligence/health/route.ts");
const cloudPage = read("app/pantavion/intelligence/cloud/page.tsx");
const packageJsonText = read("package.json");
const vercelJsonText = read("vercel.json");

const requiredMarkers = [
  "runPantavionCloudCronTick",
  "recordPantavionIntelligenceLedgerEvent",
  "getPantavionCloudCronStatus",
  "PANTAVION_INTELLIGENCE_LEDGER_ENDPOINT",
  "CRON_SECRET",
  "runtime_memory_non_durable",
  "external_endpoint_durable",
];

for (const marker of requiredMarkers) {
  if (!ledger.includes(marker)) failures.push("Ledger missing marker: " + marker);
}

if (!cronRoute.includes("runPantavionCloudCronTick")) {
  failures.push("cron route must execute cloud cron tick.");
}

if (!ledgerRoute.includes("readLocalLedgerEvents")) {
  failures.push("ledger route must expose tick ledger.");
}

if (!healthRoute.includes("getPantavionCloudCronStatus")) {
  failures.push("health route must expose cron status.");
}

if (!cloudPage.includes("24/365 Intelligence Scheduler and Tick Ledger")) {
  failures.push("cloud page must expose scheduler and ledger.");
}

let packageJson = null;
try {
  packageJson = JSON.parse(packageJsonText);
} catch {
  failures.push("package.json is invalid JSON.");
}

if (
  packageJson &&
  packageJson.scripts &&
  packageJson.scripts["audit:intelligence:cloud"] !== "node scripts/pantavion-intelligence-cloud-runtime-gate.cjs"
) {
  failures.push("package.json must include audit:intelligence:cloud script.");
}

let vercelJson = null;
try {
  vercelJson = JSON.parse(vercelJsonText);
} catch {
  failures.push("vercel.json is invalid JSON.");
}

if (vercelJson) {
  const crons = Array.isArray(vercelJson.crons) ? vercelJson.crons : [];
  const cron = crons.find((item) => item.path === "/api/pantavion/intelligence/cron");

  if (!cron) {
    failures.push("vercel.json must include cron path /api/pantavion/intelligence/cron.");
  } else if (cron.schedule !== "0 * * * *") {
    failures.push("vercel.json cron schedule must be 0 * * * * for hourly intelligence tick.");
  }
}

if (ledger.includes("git add .") || cronRoute.includes("git add .") || cloudPage.includes("git add .")) {
  failures.push("Cloud runtime files must not contain blanket git add.");
}

if (failures.length > 0) {
  console.error("PANTAVION INTELLIGENCE CLOUD RUNTIME GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION INTELLIGENCE CLOUD RUNTIME GATE: PASSED");
  console.log("- cron route present");
  console.log("- vercel cron configured");
  console.log("- ledger route present");
  console.log("- health route present");
  console.log("- visible cloud page present");
  console.log("- durable external endpoint support present");
  console.log("- local development ledger support present");
  console.log("- production non-durable fallback is explicitly marked, not hidden");
}

