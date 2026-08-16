const fs = require("fs");

const runnerPath = "scripts/pantavion-autonomous-code-runner.cjs";
const runner = fs.existsSync(runnerPath) ? fs.readFileSync(runnerPath, "utf8") : "";
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

const checks = [];

function ok(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

ok("autonomous code runner present", fs.existsSync(runnerPath));
ok("runner v2 marker present", runner.includes("pantavion_autonomous_code_runner_v2"));
ok("windows shell runner present", runner.includes("shell: true"));
ok("agent supervisor step present", runner.includes("agent:supervisor"));
ok("safe patch step present", runner.includes("agent:safe-patch"));
ok("founder approval audit step present", runner.includes("audit:founder-approvals"));
ok("typescript step present", runner.includes("tsc --noEmit"));
ok("build step present", runner.includes("npm run build"));
ok("dirty worktree block present", runner.includes("blocked_dirty_worktree"));
ok("package agent:auto-code present", pkg.scripts && pkg.scripts["agent:auto-code"]);
ok("package audit:auto-code present", pkg.scripts && pkg.scripts["audit:auto-code"]);

const forbidden = ["git add .", "push --force", "vercel deploy --prod", "rm -rf"];

for (const token of forbidden) {
  ok(`forbidden absent ${token}`, !runner.includes(token));
}

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error("PANTAVION AUTONOMOUS CODE RUNNER GATE: FAILED");
  for (const check of failed) console.error("- " + check.label);
  process.exit(1);
}

console.log("PANTAVION AUTONOMOUS CODE RUNNER GATE: PASSED");
for (const check of checks) console.log("- " + check.label);
