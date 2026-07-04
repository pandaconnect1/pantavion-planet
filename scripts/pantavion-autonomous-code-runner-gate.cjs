const fs = require("fs");

const checks = [];

function ok(label, condition) {
  checks.push({ label, ok: Boolean(condition) });
}

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

const runnerPath = "scripts/pantavion-autonomous-code-runner.cjs";
const runner = read(runnerPath);
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));

ok("autonomous code runner present", fs.existsSync(runnerPath));
ok("runner id marker present", runner.includes("pantavion_autonomous_code_runner_v1"));
ok("agent supervisor step present", runner.includes("agent:supervisor"));
ok("safe patch writer step present", runner.includes("agent:safe-patch"));
ok("safe patch audit present", runner.includes("audit:safe-patch"));
ok("capability registry audit present", runner.includes("audit:capability-registry"));
ok("typescript check present", runner.includes("tsc"));
ok("production build present", runner.includes("npm") && runner.includes("build"));
ok("founder approval boundary present", runner.includes("founderApprovalStillRequiredForSensitiveActions"));
ok("report path present", runner.includes("autonomous-code-runner-report.json"));
ok("package script agent:auto-code present", pkg.scripts && pkg.scripts["agent:auto-code"]);
ok("package script audit:auto-code present", pkg.scripts && pkg.scripts["audit:auto-code"]);

const forbiddenInRunner = [
  "git add .",
  "push --force",
  "vercel deploy --prod",
  "rm -rf",
  "Remove-Item -Recurse -Force"
];

for (const token of forbiddenInRunner) {
  ok("forbidden token absent: " + token, !runner.includes(token));
}

const failed = checks.filter((check) => !check.ok);

if (failed.length) {
  console.error("PANTAVION AUTONOMOUS CODE RUNNER GATE: FAILED");
  for (const check of failed) {
    console.error("- " + check.label);
  }
  process.exit(1);
}

console.log("PANTAVION AUTONOMOUS CODE RUNNER GATE: PASSED");
for (const check of checks) {
  console.log("- " + check.label);
}
