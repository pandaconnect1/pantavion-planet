const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/autonomous-work-package-coordinator.ts",
  "app/api/internal/pantavion/autonomous-work-package-queue/route.ts"
];

const requiredSignals = [
  "pantavion_autonomous_work_package_coordinator_c9e_v1",
  "pantavion_autonomous_work_package_queue_route_c9e_v1",
  "seedPantavionAutonomousWorkPackages",
  "claimNextPantavionWorkPackage",
  "completePantavionWorkPackage",
  "failPantavionWorkPackage",
  "summarizePantavionWorkPackageQueue",
  "acquirePantavionThreadLock",
  "releasePantavionThreadLock",
  "appendPantavionRuntimeLedgerEvent",
  "work_package_planned",
  "job_claimed",
  "protected_gate_required",
  "founder_gate_required",
  "wp-001-china-superapp-ecosystem",
  "wp-002-seven-continent-ecosystem",
  "wp-003-provider-router-expansion",
  "wp-004-pantadev-autonomous-coding",
  "wp-005-pantarag-memory-kernel",
  "wp-006-live-translation-kernel",
  "wp-007-social-universe-kernel",
  "wp-008-creator-media-studio",
  "wp-009-marketplace-work-income",
  "wp-010-pantapay-compliance",
  "wp-011-safety-legal-identity",
  "wp-012-sos-offgrid-safety",
  "Unauthorized work-package queue mutation blocked in production"
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

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:work-package-coordinator"]) {
  errors.push("Missing package script: audit:work-package-coordinator");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
