const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

const root = process.cwd();
const outDir = path.join(root, "data", "runtime-reports");
fs.mkdirSync(outDir, { recursive: true });

function run(command) {
  console.log(">> " + command);
  try {
    const output = child_process.execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: "pipe",
      shell: true,
    });
    return { command, ok: true, output };
  } catch (error) {
    return {
      command,
      ok: false,
      output: String(error.stdout || "") + "\n" + String(error.stderr || ""),
    };
  }
}

const steps = [];

if (fs.existsSync(path.join(root, "scripts", "pantavion-kernel-compat-repair.cjs"))) {
  steps.push(run("node scripts/pantavion-kernel-compat-repair.cjs"));
}

steps.push(run("npm run audit:continuity-runtime"));
steps.push(run("npm run runtime:heartbeat"));
steps.push(run("npm run radar:report"));
steps.push(run("npx tsc --noEmit"));
steps.push(run("npm run build"));

const failed = steps.filter((step) => !step.ok);

const report = {
  id: "pantavion_github_autonomy_supervisor_v1",
  generatedAt: new Date().toISOString(),
  ok: failed.length === 0,
  mode: "github_cloud_supervisor",
  pcRequired: false,
  founderApprovalRequiredForDangerousActions: true,
  steps: steps.map((step) => ({
    command: step.command,
    ok: step.ok,
    outputPreview: step.output.slice(0, 4000),
  })),
};

fs.writeFileSync(
  path.join(outDir, "latest-autonomy-supervisor-report.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

fs.writeFileSync(
  path.join(outDir, "latest-autonomy-supervisor.log"),
  steps.map((step) => [
    "COMMAND: " + step.command,
    "OK: " + step.ok,
    step.output,
    "\n---\n",
  ].join("\n")).join("\n"),
  "utf8"
);

if (failed.length > 0) {
  console.error("PANTAVION AUTONOMY SUPERVISOR: FAILED");
  for (const step of failed) {
    console.error("- " + step.command);
  }
  process.exitCode = 1;
} else {
  console.log("PANTAVION AUTONOMY SUPERVISOR: PASSED");
}
