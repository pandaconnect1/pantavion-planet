const fs = require("fs");
const child_process = require("child_process");

const allowed = [
  ".github/workflows/pantavion-live-runtime.yml",
  ".pantavion-tsc.txt",
  "app/api/pantavion/intelligence/ecosystem-radar/",
  "app/api/pantavion/runtime/",
  "core/runtime/pantavion-runtime-heartbeat.ts",
  "scripts/pantavion-runtime-heartbeat.cjs",
];

const blocked = [
  "app/professional/infrastructure/water/",
  "data/water-network-private/",
  ".next/",
  "tsconfig.tsbuildinfo",
];

function run(command) {
  console.log(">> " + command);
  return child_process.execSync(command, { encoding: "utf8", stdio: "pipe" });
}

const status = run("git status --short --untracked-files=all");
const lines = status.split(/\r?\n/).filter(Boolean);
const staged = [];
const skipped = [];

for (const line of lines) {
  const file = line.slice(3).trim();
  const isAllowed = allowed.some((prefix) => file === prefix || file.startsWith(prefix));
  const isBlocked = blocked.some((prefix) => file === prefix || file.startsWith(prefix));

  if (isAllowed && !isBlocked && fs.existsSync(file)) {
    run(`git add "${file}"`);
    staged.push(file);
  } else {
    skipped.push({ file, reason: isBlocked ? "blocked protected/private area" : "not in safe allowlist" });
  }
}

fs.writeFileSync(
  "data/runtime-reports/latest-safe-git-autopilot.json",
  JSON.stringify({
    id: "pantavion_safe_git_autopilot_v1",
    generatedAt: new Date().toISOString(),
    staged,
    skipped,
  }, null, 2) + "\n",
  "utf8"
);

run("git add data/runtime-reports/latest-safe-git-autopilot.json");

console.log("STAGED:");
console.log(staged.join("\n") || "- none");

console.log("SKIPPED:");
console.log(JSON.stringify(skipped, null, 2));
