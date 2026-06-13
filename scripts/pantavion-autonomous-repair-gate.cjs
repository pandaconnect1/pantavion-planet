const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/autonomous-code/autonomous-repair-loop.ts",
  "app/api/internal/pantavion/autonomous-repair/route.ts"
];

const requiredSignals = [
  "pantavion_autonomous_repair_loop_c9b_v1",
  "pantavion_autonomous_repair_route_c9b_v1",
  "recordPantavionFailureAndCreateRepairJob",
  "summarizePantavionRepairQueue",
  "build_failed",
  "typecheck_failed",
  "audit_failed",
  "github_actions_failed",
  "vercel_failed",
  "pr_preflight_failed",
  "runtime_error",
  "quarantined",
  "founder_gate_required",
  "appendPantavionRuntimeLedgerEvent",
  "evaluateAutonomousMutation",
  "requiresFounderApproval",
  "requiredGates"
];

const forbiddenSignals = [
  "git add .",
  "public raw water",
  "ignore secrets",
  "auto merge without gate",
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

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:autonomous-repair"]) {
  errors.push("Missing package script: audit:autonomous-repair");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
