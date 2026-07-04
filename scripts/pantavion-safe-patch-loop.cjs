const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = process.cwd();
const LOOP_ID = "pantavion_safe_patch_loop_v1";

const dryRun =
  process.argv.includes("--dry-run") ||
  process.env.PANTAVION_AGENT_LOOP_DRY_RUN === "1";

const forceSafePatch = process.env.PANTAVION_AGENT_LOOP_FORCE_SAFE_PATCH === "1";

const reportPath = path.join(
  root,
  ".pantavion",
  "agent-runtime",
  "safe-patch-loop-report.json"
);

const selectedSlicePath = path.join(
  root,
  ".pantavion",
  "agent-runtime",
  "selected-implementation-slice.json"
);

const supportedWriterTargets = [
  "core/capabilities/pantavion-capability-registry.ts",
  "app/api/pantavion/capabilities/route.ts",
  "scripts/pantavion-capability-registry-gate.cjs",
  "docs/continuity/pantavion-safe-patch-writer.md"
];

function now() {
  return new Date().toISOString();
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function runShell(commandText, label, required = true) {
  if (dryRun) {
    return {
      label,
      command: commandText,
      ok: true,
      skipped: true,
      reason: "dry_run"
    };
  }

  const startedAt = Date.now();

  const command = process.platform === "win32" ? "cmd.exe" : "sh";
  const args =
    process.platform === "win32"
      ? ["/d", "/s", "/c", commandText]
      : ["-lc", commandText];

  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: false
  });

  const record = {
    label,
    command: commandText,
    ok: result.status === 0 && !result.error,
    status: result.status,
    error: result.error ? String(result.error.message || result.error) : null,
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
  return runShell(`npm run ${script}`, label, required);
}

function typecheck() {
  return runShell("npx tsc --noEmit --pretty false", "typecheck", true);
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

function isSafeSlice(slice) {
  return Boolean(
    slice &&
      slice.approvalRequired !== true &&
      (slice.riskZone === "Z1" || slice.riskZone === "Z2")
  );
}

function decideSafePatch(selectedSlice) {
  const missingSupportedTargets = supportedWriterTargets.filter((target) => !exists(target));
  const selectedSliceSafe = isSafeSlice(selectedSlice);

  const reasons = [];

  if (!selectedSliceSafe) {
    reasons.push("selected_slice_not_safe_or_missing");
  }

  if (missingSupportedTargets.length === 0 && !forceSafePatch) {
    reasons.push("no_missing_supported_targets");
  }

  const shouldRun =
    forceSafePatch ||
    (selectedSliceSafe && missingSupportedTargets.length > 0);

  return {
    shouldRun,
    forceSafePatch,
    selectedSliceSafe,
    missingSupportedTargets,
    reasons
  };
}

const report = {
  ok: false,
  id: LOOP_ID,
  createdAt: now(),
  dryRun,
  forceSafePatch,
  status: "starting",
  steps: [],
  selectedSlice: null,
  safePatchDecision: null,
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

  const selectedSlice = readJson(selectedSlicePath, null);
  report.selectedSlice = selectedSlice;

  const decision = decideSafePatch(selectedSlice);
  report.safePatchDecision = decision;

  if (decision.shouldRun) {
    report.steps.push(npmRun("agent:safe-patch", "agent_safe_patch", true));
  } else {
    report.steps.push({
      label: "agent_safe_patch",
      ok: true,
      skipped: true,
      reason: decision.reasons.join(", ")
    });
  }

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
        safePatchDecision: report.safePatchDecision,
        report: ".pantavion/agent-runtime/safe-patch-loop-report.json"
      },
      null,
      2
    )
  );
}
