const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/autonomous-code/autonomous-repair-pr-creator.ts",
  "app/api/internal/pantavion/autonomous-repair-pr/route.ts"
];

const requiredSignals = [
  "pantavion_autonomous_repair_pr_creator_c9d_v1",
  "pantavion_autonomous_repair_pr_route_c9d_v1",
  "createPantavionRepairPullRequest",
  "createAutonomousGithubPullRequest",
  "preflightAutonomousGithubPullRequest",
  "loadPantavionRepairQueue",
  "savePantavionRepairQueue",
  "Repair PR created for autonomous repair job",
  "Repair PR dry run passed preflight",
  "pr_created",
  "error_recorded",
  "founder_gate_required",
  "execute",
  "Unauthorized repair PR execution"
];

const forbiddenSignals = [
  "git add .",
  "auto merge",
  "mergePullRequest",
  "deleteBranch",
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
if (!pkg.scripts || !pkg.scripts["audit:autonomous-repair-pr"]) {
  errors.push("Missing package script: audit:autonomous-repair-pr");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
