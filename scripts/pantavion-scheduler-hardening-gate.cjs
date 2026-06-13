const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/scheduler-guard.ts",
  "app/api/internal/pantavion/autonomous-engineering/route.ts"
];

const requiredSignals = [
  "pantavion_scheduler_guard_c8a_v1",
  "pantavion_autonomous_scheduler_hardened_route_c8a_v1",
  "PANTAVION_AUTONOMOUS_SECRET",
  "CRON_SECRET",
  "kernel_wake",
  "founder_gate_required",
  "protected_gate_required",
  "production",
  "water",
  "payments",
  "identity",
  "private_data",
  "github_pr",
  "observe"
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

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:scheduler-hardening"]) {
  errors.push("Missing package script: audit:scheduler-hardening");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
