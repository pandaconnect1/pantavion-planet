const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/scheduler-work-package-bridge.ts",
  "app/api/internal/pantavion/autonomous-engineering/route.ts"
];

const requiredSignals = [
  "pantavion_scheduler_work_package_bridge_c9f_v1",
  "runPantavionSchedulerWorkPackageBridge",
  "claimNextPantavionWorkPackage",
  "seedPantavionAutonomousWorkPackages",
  "summarizePantavionWorkPackageQueue",
  "work_package_planned",
  "job_claimed",
  "protected_gate_required",
  "authorized",
  "writeMode",
  "github_pr",
  "draft",
  "observe",
  "bridgeMarker",
  "workPackageBridge"
];

const forbiddenSignals = [
  "git add .",
  "auto merge",
  "mergePullRequest",
  "deleteBranch",
  "clone WeChat",
  "clone TikTok",
  "data/water-network-private/processed/water-network.geojson",
  "PANTAVION_GITHUB_TOKEN:",
  "PANTAVION_AUTONOMOUS_SECRET:",
  "CRON_SECRET:"
];

const errors = [];

for (const file of requiredFiles) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    errors.push(`Missing file: ${file}`);
    continue;
  }

  const text = fs.readFileSync(full, "utf8");

  if (file.endsWith("route.ts") && /^export const pantavion_.*_marker_v1\s*=/m.test(text)) {
    errors.push(`Route has forbidden exported marker: ${file}`);
  }
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const signal of requiredSignals) {
  if (!allText.includes(signal)) {
    errors.push(`Missing signal: ${signal}`);
  }
}

for (const signal of forbiddenSignals) {
  if (allText.toLowerCase().includes(signal.toLowerCase())) {
    errors.push(`Forbidden unsafe signal found: ${signal}`);
  }
}

if (!allText.includes("effectiveMode")) {
  errors.push("Scheduler GET must use decision.effectiveMode.");
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:scheduler-work-package-bridge"]) {
  errors.push("Missing package script: audit:scheduler-work-package-bridge");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
