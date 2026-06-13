const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/autonomous-work-package-coordinator.ts"
];

const requiredSignals = [
  "PANTAVION_COLOSSUS_GRADE_IMPROVEMENT_WORK_PACKAGES",
  "PANTAVION_AUTONOMOUS_MASTER_WORK_PACKAGES",
  "wp-013-control-room-observability",
  "wp-014-evaluation-quality-gates",
  "wp-015-security-secret-data-scanner",
  "wp-016-real-provider-router-activation",
  "wp-017-source-atlas-memory",
  "wp-018-cost-control-budget-kernel",
  "wp-019-rollback-quarantine-coordinator",
  "wp-020-sandbox-execution-policy",
  "wp-021-cron-env-activation-guard",
  "wp-022-innovation-radar",
  "wp-023-global-superapp-differentiation",
  "wp-024-product-truth-integrity",
  "wp-025-human-founder-control",
  "pantavion_control_room_kernel",
  "pantavion_autonomous_evaluation_gates",
  "pantavion_secret_leak_scanner",
  "pantavion_provider_runtime_router",
  "pantavion_source_atlas",
  "pantavion_autonomous_cost_control",
  "pantavion_rollback_quarantine_coordinator",
  "pantavion_sandbox_execution_policy",
  "pantavion_cron_env_activation_guard",
  "pantavion_innovation_radar",
  "pantavion_global_superapp_differentiation",
  "pantavion_product_truth_integrity",
  "pantavion_founder_control_kernel"
];

const forbiddenSignals = [
  "git add .",
  "clone WeChat",
  "clone TikTok",
  "PANTAVION_GITHUB_TOKEN:",
  "PANTAVION_AUTONOMOUS_SECRET:",
  "CRON_SECRET:",
  "data/water-network-private/processed/water-network.geojson"
];

const errors = [];

for (const file of requiredFiles) {
  const full = path.join(process.cwd(), file);
  if (!fs.existsSync(full)) {
    errors.push(`Missing file: ${file}`);
    continue;
  }

  const text = fs.readFileSync(full, "utf8");

  for (const signal of requiredSignals) {
    if (!text.includes(signal)) errors.push(`Missing signal: ${signal}`);
  }

  for (const signal of forbiddenSignals) {
    if (text.toLowerCase().includes(signal.toLowerCase())) {
      errors.push(`Forbidden unsafe signal found: ${signal}`);
    }
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:master-backlog-improvements"]) {
  errors.push("Missing package script: audit:master-backlog-improvements");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) process.exit(1);
