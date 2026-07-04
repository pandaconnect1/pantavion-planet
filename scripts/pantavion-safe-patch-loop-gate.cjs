const fs = require("fs");
const path = require("path");

const root = process.cwd();
const failures = [];

const required = [
  "scripts/pantavion-safe-patch-loop.cjs",
  "scripts/pantavion-safe-patch-loop-gate.cjs",
  "docs/continuity/pantavion-safe-patch-loop.md",
  "package.json"
];

function read(relativePath) {
  const full = path.join(root, relativePath);

  if (!fs.existsSync(full)) {
    failures.push("Missing required file: " + relativePath);
    return "";
  }

  return fs.readFileSync(full, "utf8");
}

for (const file of required) read(file);

const loop = read("scripts/pantavion-safe-patch-loop.cjs");
const pkgText = read("package.json");

const markers = [
  "pantavion_safe_patch_loop_v1",
  "agent:supervisor",
  "agent:safe-patch",
  "audit:safe-patch",
  "audit:capability-registry",
  "safe-patch-loop-report.json",
  "blocked_dirty_worktree",
  "founderApprovalStillRequiredForSensitiveActions"
];

for (const marker of markers) {
  if (!loop.includes(marker)) {
    failures.push("Loop missing marker: " + marker);
  }
}

let pkg = null;

try {
  pkg = JSON.parse(pkgText);
} catch {
  failures.push("package.json invalid JSON.");
}

if (pkg && pkg.scripts) {
  if (pkg.scripts["agent:loop"] !== "node scripts/pantavion-safe-patch-loop.cjs") {
    failures.push("package.json missing agent:loop.");
  }

  if (pkg.scripts["agent:loop:dry"] !== "node scripts/pantavion-safe-patch-loop.cjs --dry-run") {
    failures.push("package.json missing agent:loop:dry.");
  }

  if (pkg.scripts["audit:agent-loop"] !== "node scripts/pantavion-safe-patch-loop-gate.cjs") {
    failures.push("package.json missing audit:agent-loop.");
  }
}

const dangerous = loop.toLowerCase();

if (dangerous.includes("git add .")) failures.push("Loop must not contain git add dot.");
if (dangerous.includes("push --force")) failures.push("Loop must not force push.");
if (dangerous.includes("vercel --prod")) failures.push("Loop must not production deploy.");
if (dangerous.includes("rm -rf")) failures.push("Loop must not contain destructive rm.");

if (failures.length > 0) {
  console.error("PANTAVION SAFE PATCH LOOP GATE: FAILED");
  for (const failure of failures) console.error("- " + failure);
  process.exitCode = 1;
} else {
  console.log("PANTAVION SAFE PATCH LOOP GATE: PASSED");
  console.log("- loop script present");
  console.log("- dry-run mode present");
  console.log("- supervisor step present");
  console.log("- safe-patch step present");
  console.log("- audits/build steps present");
  console.log("- package scripts present");
}
