const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/runtime/work-package-pr-executor.ts",
  "app/api/internal/pantavion/work-package-pr-executor/route.ts"
];

const requiredSignals = [
  "pantavion_work_package_pr_executor_c9g_v1",
  "pantavion_work_package_pr_executor_route_c9g_v1",
  "executeClaimedPantavionWorkPackageAsPr",
  "createAutonomousGithubPullRequest",
  "preflightAutonomousGithubPullRequest",
  "loadPantavionWorkPackageQueue",
  "savePantavionWorkPackageQueue",
  "Work package converted into GitHub PR",
  "Work package PR dry run passed",
  "pr_created",
  "founder_gate_required",
  "github_pr",
  "dry_run"
];

const forbiddenSignals = [
  "git add .",
  "auto merge",
  "mergePullRequest",
  "deleteBranch",
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
  if (!allText.includes(signal)) errors.push(`Missing signal: ${signal}`);
}

for (const signal of forbiddenSignals) {
  if (allText.toLowerCase().includes(signal.toLowerCase())) {
    errors.push(`Forbidden unsafe signal found: ${signal}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:work-package-pr-executor"]) {
  errors.push("Missing package script: audit:work-package-pr-executor");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) process.exit(1);
