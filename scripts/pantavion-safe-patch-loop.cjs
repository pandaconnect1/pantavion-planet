const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const LOOP_ID = "pantavion_safe_patch_loop_v1";

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

const dryRun =
  process.argv.includes("--dry-run") ||
  process.env.PANTAVION_AGENT_LOOP_DRY_RUN === "1";

const reportPath = path.join(
  root,
  ".pantavion",
  "agent-runtime",
  "safe-patch-loop-report.json"
);

function run(command, args, label, required = true) {
  if (dryRun) {
    return {
      label,
      command: [command, ...args].join(" "),
      ok: true,
      skipped: true,
      reason: "dry_run"
    };
  }

  const startedAt = Date.now();

  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  const record = {
    label,
    command: [command, ...args].join(" "),
    ok: result.status === 0,
    status: result.status,
    durationMs: Date.now() - startedAt,
    stdoutTail: String(result.stdout || "").slice(-3000),
    stderrTail: String(result.stderr || "").slice(-3000)
  };

  if (required && !record.ok) {
    const error = new Error(`Pantavion loop step failed: ${label}`);
    error.step = record;
    throw error;
  }

  return record;
}

function npmRun(script, label, required = true) {
  return run(npmCmd, ["run", script], label, required);
}

function typecheck() {
  return run(npxCmd, ["tsc", "--noEmit", "--pretty", "false"], "typecheck", true);
}

function gitStatus() {
  const result = spawnSync("git", ["status", "--short"], {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  return String(result.stdout || "").trim();
}

function writeReport(report) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

const report = {
  ok: false,
  id: LOOP_ID,
  createdAt: new Date().toISOString(),
  dryRun,
  status: "starting",
  steps: [],
  safety: {
    bounded: true,
    commitsBlocked: true,
    pushBlocked: true,
    deployBlocked: true,
    secretsBlocked: true,
    founderApprovalStillRequiredForSensitiveActions: true
  },
  gitStatusStart: gitStatus(),
  gitStatusEnd: null
};

try {
  if (report.gitStatusStart && !dryRun) {
    report.status = "blocked_dirty_worktree";
    throw new Error("Pantavion loop requires clean git status before running.");
  }

  report.steps.push(npmRun("agent:supervisor", "agent_supervisor", true));
  report.steps.push(npmRun("agent:safe-patch", "agent_safe_patch", true));
  report.steps.push(npmRun("audit:safe-patch", "audit_safe_patch", true));
  report.steps.push(npmRun("audit:capability-registry", "audit_capability_registry", true));
  report.steps.push(typecheck());
  report.steps.push(npmRun("build", "build", true));

  report.gitStatusEnd = gitStatus();
  report.ok = true;
  report.status = dryRun ? "dry_run_completed" : "completed";
} catch (error) {
  report.ok = false;
  report.status = report.status === "blocked_dirty_worktree" ? report.status : "failed";
  report.error = error instanceof Error ? error.message : "unknown_error";

  if (error && error.step) {
    report.failedStep = error.step;
  }

  process.exitCode = 1;
} finally {
  writeReport(report);

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        id: report.id,
        status: report.status,
        dryRun: report.dryRun,
        report: ".pantavion/agent-runtime/safe-patch-loop-report.json"
      },
      null,
      2
    )
  );
}
