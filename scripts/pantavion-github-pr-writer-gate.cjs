const fs = require("fs");
const path = require("path");

const file = "core/pantaai/autonomous-code/github-autonomous-writer.ts";
const full = path.join(process.cwd(), file);
const text = fs.readFileSync(full, "utf8");

const requiredSignals = [
  "pantavion_github_autonomous_writer_c9a_v1",
  "pantavion_github_autonomous_writer_preflight_c9a_v1",
  "preflightAutonomousGithubPullRequest",
  "evaluateAutonomousMutation",
  "Raw/private infrastructure or geodata file paths are blocked",
  "Generated file appears to contain raw secret material",
  "Requires founder approval",
  "Required gates",
  "PANTAVION_GITHUB_TOKEN",
  "PANTAVION_GITHUB_OWNER",
  "PANTAVION_GITHUB_REPO",
  "PANTAVION_GITHUB_BASE_BRANCH",
  "PANTAVION_AUTONOMOUS_BRANCH_PREFIX"
];

const forbiddenSignals = [
  "git add .",
  "data/water-network-private/processed/water-network.geojson",
  "PANTAVION_GITHUB_TOKEN:",
  "PANTAVION_AUTONOMOUS_SECRET:",
  "CRON_SECRET:"
];

const errors = [];

for (const signal of requiredSignals) {
  if (!text.includes(signal)) {
    errors.push(`Missing signal: ${signal}`);
  }
}

for (const signal of forbiddenSignals) {
  if (text.includes(signal)) {
    errors.push(`Forbidden signal found: ${signal}`);
  }
}

if (!/\.\/protected-path-policy/.test(text)) {
  errors.push("Writer must import protected-path-policy.");
}

if (!/MAX_FILES_PER_PR/.test(text) || !/MAX_FILE_BYTES/.test(text)) {
  errors.push("Writer must enforce file count and size limits.");
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.scripts || !pkg.scripts["audit:github-pr-writer"]) {
  errors.push("Missing package script: audit:github-pr-writer");
}

console.log(JSON.stringify({
  ok: errors.length === 0,
  checkedFile: file,
  errors
}, null, 2));

if (errors.length > 0) {
  process.exit(1);
}
