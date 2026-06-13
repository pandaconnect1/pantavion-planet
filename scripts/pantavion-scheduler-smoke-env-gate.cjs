const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/scheduler-smoke-check.ts",
  "app/api/internal/pantavion/scheduler-smoke/route.ts",
  "core/pantaai/runtime/production-env-check.ts",
  "app/api/internal/pantavion/production-env-check/route.ts"
];

const requiredSignals = [
  "pantavion_scheduler_smoke_check_c8b_v1",
  "pantavion_scheduler_smoke_route_c8b_v1",
  "pantavion_production_env_check_c8c_v1",
  "pantavion_production_env_check_route_c8c_v1",
  "appendPantavionRuntimeLedgerEvent",
  "audit_passed",
  "founder_gate_required",
  "PANTAVION_AUTONOMOUS_SECRET",
  "CRON_SECRET",
  "PANTAVION_GITHUB_TOKEN",
  "PANTAVION_GITHUB_OWNER",
  "PANTAVION_GITHUB_REPO",
  "PANTAVION_GITHUB_BASE_BRANCH",
  "Secrets are never returned"
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

const forbiddenSignals = [
  "process.env.PANTAVION_GITHUB_TOKEN,",
  "githubToken: process.env.PANTAVION_GITHUB_TOKEN",
  "autonomousSecret: process.env.PANTAVION_AUTONOMOUS_SECRET",
  "cronSecret: process.env.CRON_SECRET"
];

for (const signal of forbiddenSignals) {
  if (allText.includes(signal)) {
    errors.push(`Forbidden raw secret exposure pattern: ${signal}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:scheduler-smoke-env"]) {
  errors.push("Missing package script: audit:scheduler-smoke-env");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
