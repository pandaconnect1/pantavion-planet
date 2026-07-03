const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const root = process.cwd();
const runtimeDir = path.join(root, ".pantavion", "agent-runtime");
const reportPath = path.join(runtimeDir, "supervisor-report.json");
const selectedPath = path.join(runtimeDir, "selected-implementation-slice.json");

function exec(command) {
  try {
    return cp.execSync(command, {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return "";
  }
}

function readJson(relativePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  } catch {
    return fallback;
  }
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function priorityScore(priority) {
  if (priority === "P0") return 0;
  if (priority === "P1") return 1;
  if (priority === "P2") return 2;
  return 3;
}

function riskScore(zone) {
  if (zone === "Z1") return 0;
  if (zone === "Z2") return 1;
  if (zone === "Z3") return 2;
  return 3;
}

function isSafe(slice) {
  return slice && slice.approvalRequired !== true && (slice.riskZone === "Z1" || slice.riskZone === "Z2");
}

function targetsComplete(slice) {
  const targets = Array.isArray(slice.targetFiles) ? slice.targetFiles : [];
  if (targets.length === 0) return false;
  return targets.every((target) => exists(target));
}

const slicesFile = readJson("data/pantavion-agent-code-writer/implementation-slices.json", { slices: [] });
const slices = Array.isArray(slicesFile.slices) ? slicesFile.slices : [];

const ordered = [...slices].sort((a, b) => {
  const p = priorityScore(a.priority) - priorityScore(b.priority);
  if (p !== 0) return p;
  const r = riskScore(a.riskZone) - riskScore(b.riskZone);
  if (r !== 0) return r;
  return String(a.id || "").localeCompare(String(b.id || ""));
});

const safeInternal = ordered.filter(isSafe);
const approvalQueue = ordered.filter((slice) => slice.approvalRequired === true);
const completedTargetSlices = ordered.filter(targetsComplete);
const pendingSafe = safeInternal.filter((slice) => !targetsComplete(slice));
const nextSafeSlice = pendingSafe[0] || safeInternal[0] || null;

const gitStatusShort = exec("git status --short");
const report = {
  ok: true,
  id: "pantavion_agent_supervisor_work_order_executor_v1",
  generatedAt: new Date().toISOString(),
  status: "supervisor_report",
  repo: {
    clean: !gitStatusShort,
    branch: exec("git branch --show-current"),
    head: exec("git log --oneline -1"),
    statusShort: gitStatusShort
  },
  summary: {
    totalSlices: ordered.length,
    safeInternalSlices: safeInternal.length,
    approvalRequiredSlices: approvalQueue.length,
    completedTargetSlices: completedTargetSlices.length,
    pendingTargetSlices: Math.max(0, ordered.length - completedTargetSlices.length)
  },
  nextSafeSlice,
  approvalQueue: approvalQueue.slice(0, 20),
  blockedActions: [
    "No blanket git add.",
    "No force push.",
    "No production deploy without founder approval.",
    "No secrets in committed files.",
    "No billing/auth/user-data/DWG/source-truth/SOS production action without founder approval."
  ],
  executionRules: [
    "Z1 can become automatic after green checks.",
    "Z2 can produce safe internal patches and preview plans.",
    "Z3 requires founder approval.",
    "Z4 remains blocked/manual only.",
    "Every implementation must include route, state or data, audit and verification."
  ],
  nextPatchRecommendation:
    "Patch 10 should add Safe Patch Writer for the selected Z1/Z2 implementation slice."
};

fs.mkdirSync(runtimeDir, { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");

if (nextSafeSlice) {
  fs.writeFileSync(selectedPath, JSON.stringify(nextSafeSlice, null, 2) + "\n", "utf8");
}

console.log(JSON.stringify({
  ok: true,
  wrote: [
    ".pantavion/agent-runtime/supervisor-report.json",
    nextSafeSlice ? ".pantavion/agent-runtime/selected-implementation-slice.json" : null
  ].filter(Boolean),
  summary: report.summary,
  nextSafeSlice: nextSafeSlice
    ? {
        id: nextSafeSlice.id,
        title: nextSafeSlice.title,
        priority: nextSafeSlice.priority,
        riskZone: nextSafeSlice.riskZone,
        approvalRequired: nextSafeSlice.approvalRequired,
        targetFiles: nextSafeSlice.targetFiles
      }
    : null
}, null, 2));
