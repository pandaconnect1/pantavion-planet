const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "core/pantaai/autonomous-code/code-generation-worker.ts",
  "app/api/internal/pantavion/code-generation-worker/route.ts",
];

const requiredMarkers = [
  "pantavion_code_generation_worker_c4_v1",
  "pantavion_code_generation_worker_route_c4_v1",
];

const requiredSignals = [
  "scanPantavionCapabilityGaps",
  "routePantavionAgentTask",
  "advisePantavionToolSubstitution",
  "createAutonomousGithubPullRequest",
  "local_scaffold",
  "github_pr",
  "no copied external brand",
  "No fake active feature",
];

const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(process.cwd(), file))) {
    errors.push(`Missing file: ${file}`);
  }
}

const allText = requiredFiles
  .filter((file) => fs.existsSync(path.join(process.cwd(), file)))
  .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
  .join("\n");

for (const marker of requiredMarkers) {
  if (!allText.includes(marker)) {
    errors.push(`Missing marker: ${marker}`);
  }
}

for (const signal of requiredSignals) {
  if (!allText.toLowerCase().includes(signal.toLowerCase())) {
    errors.push(`Missing signal: ${signal}`);
  }
}

const forbidden = [
  "git add .",
  "auto merge",
  "skip founder",
  "public raw water",
  "ignore secrets",
];

for (const item of forbidden) {
  if (allText.toLowerCase().includes(item)) {
    errors.push(`Forbidden unsafe text found: ${item}`);
  }
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:code-generation-worker"]) {
  errors.push("Missing package script: audit:code-generation-worker");
}

const vercel = fs.existsSync("vercel.json")
  ? JSON.parse(fs.readFileSync("vercel.json", "utf8"))
  : {};
const crons = Array.isArray(vercel.crons) ? vercel.crons : [];
if (!crons.some((cron) => cron.path === "/api/internal/pantavion/code-generation-worker")) {
  errors.push("Missing Vercel cron for code-generation-worker.");
}

const report = {
  ok: errors.length === 0,
  checkedFiles: requiredFiles.length,
  requiredMarkers: requiredMarkers.length,
  errors,
};

console.log(JSON.stringify(report, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
