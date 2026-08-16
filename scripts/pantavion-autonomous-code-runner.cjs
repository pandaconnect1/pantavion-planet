const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ID = "pantavion_autonomous_code_runner_v2";
const ROOT = process.cwd();
const runtimeDir = path.join(ROOT, ".pantavion", "agent-runtime");
const reportPath = path.join(runtimeDir, "autonomous-code-runner-report.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function tail(value, max = 6000) {
  const text = String(value || "");
  return text.length <= max ? text : text.slice(text.length - max);
}

function runStep(label, command) {
  const startedAt = new Date().toISOString();
  const started = Date.now();

  const result = spawnSync(command, {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20
  });

  return {
    label,
    command,
    ok: result.status === 0,
    status: result.status,
    signal: result.signal || null,
    error: result.error ? result.error.message : "",
    durationMs: Date.now() - started,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr)
  };
}

function gitStatusShort() {
  const result = spawnSync("git status --short", {
    cwd: ROOT,
    encoding: "utf8",
    shell: true,
    windowsHide: true
  });

  return {
    ok: result.status === 0,
    text: String(result.stdout || "").trim(),
    error: tail(result.stderr || result.stdout || (result.error ? result.error.message : ""))
  };
}

function changedFiles(statusText) {
  return String(statusText || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => ({
      status: line.slice(0, 2).trim(),
      file: line.slice(3).trim()
    }));
}

function writeReport(report) {
  ensureDir(runtimeDir);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

function finish(report, exitCode) {
  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
  process.exit(exitCode);
}

function main() {
  ensureDir(runtimeDir);

  const startStatus = gitStatusShort();

  if (!startStatus.ok) {
    finish(
      {
        ok: false,
        id: ID,
        createdAt: new Date().toISOString(),
        status: "failed_git_status",
        error: startStatus.error
      },
      1
    );
  }

  if (startStatus.text) {
    finish(
      {
        ok: false,
        id: ID,
        createdAt: new Date().toISOString(),
        status: "blocked_dirty_worktree",
        error: "Autonomous runner requires clean git status before writing code.",
        gitStatusStart: startStatus.text,
        changedFilesStart: changedFiles(startStatus.text),
        safety: {
          commitsBlockedByDefault: true,
          pushBlockedByDefault: true,
          deployBlocked: true,
          secretsBlocked: true,
          riskyActionsGoToFounderApprovalDashboard: true
        }
      },
      1
    );
  }

  const steps = [
    ["agent supervisor chooses safe implementation slice", "npm run agent:supervisor"],
    ["safe patch writer writes scoped source files", "npm run agent:safe-patch"],
    ["safe patch audit", "npm run audit:safe-patch"],
    ["capability registry audit", "npm run audit:capability-registry"],
    ["founder approvals route audit", "npm run audit:founder-approvals"],
    ["typescript check", "npx tsc --noEmit --pretty false"],
    ["production build", "npm run build"]
  ];

  const executed = [];

  for (const [label, command] of steps) {
    const result = runStep(label, command);
    executed.push(result);

    if (!result.ok) {
      const endStatus = gitStatusShort();

      finish(
        {
          ok: false,
          id: ID,
          createdAt: new Date().toISOString(),
          status: "failed",
          failedStep: label,
          steps: executed,
          gitStatusStart: startStatus.text,
          gitStatusEnd: endStatus.text,
          changedFilesEnd: changedFiles(endStatus.text),
          safety: {
            commitsBlockedByDefault: true,
            pushBlockedByDefault: true,
            deployBlocked: true,
            secretsBlocked: true,
            riskyActionsGoToFounderApprovalDashboard: true
          },
          truthRule:
            "Pantavion stops on failed audit/typecheck/build and reports the exact failed step."
        },
        1
      );
    }
  }

  const endStatus = gitStatusShort();

  finish(
    {
      ok: true,
      id: ID,
      createdAt: new Date().toISOString(),
      status: "completed",
      steps: executed,
      gitStatusStart: startStatus.text,
      gitStatusEnd: endStatus.text,
      changedFilesEnd: changedFiles(endStatus.text),
      nextHumanAction:
        "Review generated scoped files. Commit only approved scoped files.",
      safety: {
        commitsBlockedByDefault: true,
        pushBlockedByDefault: true,
        deployBlocked: true,
        secretsBlocked: true,
        riskyActionsGoToFounderApprovalDashboard: true
      },
      truthRule:
        "Safe code generation may run automatically. Z3/Z4 actions require founder approval."
    },
    0
  );
}

main();
