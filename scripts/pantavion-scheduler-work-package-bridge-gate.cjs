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
  "work_package_planned",
  "job_claimed",
  "bridgeMarker",
  "workPackageBridge"
];

const errors = [];

for (const file of requiredFiles) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) errors.push(`Missing file: ${file}`);
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const signal of requiredSignals) {
  if (!allText.includes(signal)) errors.push(`Missing signal: ${signal}`);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts) pkg.scripts = {};
if (!pkg.scripts["audit:scheduler-work-package-bridge"]) {
  errors.push("Missing package script: audit:scheduler-work-package-bridge");
}

console.log(JSON.stringify({ ok: errors.length === 0, errors }, null, 2));
if (errors.length > 0) process.exit(1);
