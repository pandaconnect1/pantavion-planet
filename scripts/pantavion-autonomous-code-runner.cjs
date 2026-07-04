const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const PANTAVION_AUTONOMOUS_CODE_RUNNER_ID =
  "pantavion_autonomous_code_runner_v1";

const ROOT = process.cwd();
const runtimeDir = path.join(ROOT, ".pantavion", "agent-runtime");
const reportPath = path.join(runtimeDir, "autonomous-code-runner-report.json");

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function bin(name) {
  if (process.platform === "win32") {
    if (name === "npm") return "npm.cmd";
    if (name === "npx") return "npx.cmd";
  }
  return name;
}

function tail(value, max = 5000) {
  const text = String(value || "");
  if (text.length <= max) return text;
  return text.slice(text.length - max);
}

function runStep(label, command, args) {
  const startedAt = new Date().toISOString();
  const started = Date.now();

  const result = spawnSync(bin(command), args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 20
  });

  return {
    label,
    command: [command].concat(args).join(" "),
    ok: result.status === 0,
    status: result.status,
    durationMs: Date.now() - started,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdoutTail: tail(result.stdout),
    stderrTail: tail(result.stderr)
  };
}

function gitStatusShort() {
  const result = spawnSync(bin("git"), ["status", "--short"], {
    cwd: ROOT,
    encoding: "utf8",
    shell: false,
    windowsHide: true
  });

  if (result.status !== 0) {
    return {
      ok: false,
      text: "",
      error: tail(result.stderr || result.stdout)
    };
  }

  return {
    ok: true,
    text: String(result.stdout || "").trim(),
    error: ""
  };
}

function parseChangedFiles(statusText) {
  return String(statusText || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map((line) => {
      const status = line.slice(0, 2).trim();
      const file = line.slice(3).trim();
      return { status, file };
    });
}

function writeReport(report) {
  ensureDir(runtimeDir);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
}

function main() {
  ensureDir(runtimeDir);

  const initialStatus = gitStatusShort();

  if (!initialStatus.ok) {
    const report = {
      ok: false,
      id: PANTAVION_AUTONOMOUS_CODE_RUNNER_ID,
      createdAt: new Date().toISOString(),
      status: "failed_git_status",
      error: initialStatus.error,
      safety: {
        bounded: true,
        commitsBlockedByDefault: true,
        pushBlockedByDefault: true,
        deployBlocked: true,
        secretsBlocked: true,
        destructiveActionsBlocked: true,
        founderApprovalStillRequiredForSensitiveActions: true
      }
    };

    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  if (initialStatus.text) {
    const report = {
      ok: false,
      id: PANTAVION_AUTONOMOUS_CODE_RUNNER_ID,
      createdAt: new Date().toISOString(),
      status: "blocked_dirty_worktree",
      error: "Autonomous code runner requires clean git status before it writes new code.",
      gitStatusStart: initialStatus.text,
      changedFilesStart: parseChangedFiles(initialStatus.text),
      safety: {
        bounded: true,
        commitsBlockedByDefault: true,
        pushBlockedByDefault: true,
        deployBlocked: true,
        secretsBlocked: true,
        destructiveActionsBlocked: true,
        founderApprovalStillRequiredForSensitiveActions: true
      }
    };

    writeReport(report);
    console.log(JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const steps = [
    {
      label: "agent supervisor chooses safe implementation slice",
      command: "npm",
      args: ["run", "agent:supervisor"]
    },
    {
      label: "safe patch writer writes scoped source files",
      command: "npm",
      args: ["run", "agent:safe-patch"]
    },
    {
      label: "safe patch audit",
      command: "npm",
      args: ["run", "audit:safe-patch"]
    },
    {
      label: "capability registry audit",
      command: "npm",
      args: ["run", "audit:capability-registry"]
    },
    {
      label: "typescript check",
      command: "npx",
      args: ["tsc", "--noEmit", "--pretty", "false"]
    },
    {
      label: "production build",
      command: "npm",
      args: ["run", "build"]
    }
  ];

  const executed = [];

  for (const step of steps) {
    const result = runStep(step.label, step.command, step.args);
    executed.push(result);

    if (!result.ok) {
      const endStatus = gitStatusShort();
      const report = {
        ok: false,
        id: PANTAVION_AUTONOMOUS_CODE_RUNNER_ID,
        createdAt: new Date().toISOString(),
        status: "failed",
        failedStep: result.label,
        steps: executed,
        gitStatusStart: initialStatus.text,
        gitStatusEnd: endStatus.text,
        changedFilesEnd: parseChangedFiles(endStatus.text),
        safety: {
          bounded: true,
          commitsBlockedByDefault: true,
          pushBlockedByDefault: true,
          deployBlocked: true,
          secretsBlocked: true,
          destructiveActionsBlocked: true,
          founderApprovalStillRequiredForSensitiveActions: true
        },
        truthRule:
          "Autonomous runner writes only through existing safe patch scripts and stops on failed audit, typecheck or build."
      };

      writeReport(report);
      console.log(JSON.stringify(report, null, 2));
      process.exit(1);
    }
  }

  const finalStatus = gitStatusShort();

  const report = {
    ok: true,
    id: PANTAVION_AUTONOMOUS_CODE_RUNNER_ID,
    createdAt: new Date().toISOString(),
    status: "completed",
    steps: executed,
    gitStatusStart: initialStatus.text,
    gitStatusEnd: finalStatus.text,
    changedFilesEnd: parseChangedFiles(finalStatus.text),
    safety: {
      bounded: true,
      commitsBlockedByDefault: true,
      pushBlockedByDefault: true,
      deployBlocked: true,
      secretsBlocked: true,
      destructiveActionsBlocked: true,
      founderApprovalStillRequiredForSensitiveActions: true
    },
    nextHumanAction:
      "Review git status. Commit only scoped generated files after founder approval.",
    truthRule:
      "Pantavion generated or refreshed code through the controlled safe patch path. Missing/failed steps are reported, not hidden."
  };

  writeReport(report);
  console.log(JSON.stringify(report, null, 2));
}

main();
