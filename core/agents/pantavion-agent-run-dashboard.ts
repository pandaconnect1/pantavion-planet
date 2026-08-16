import * as fs from "node:fs";
import * as path from "node:path";

export const PANTAVION_AGENT_RUN_DASHBOARD_ID =
  "pantavion_agent_run_dashboard_v1";

const ROOT = process.cwd();

function readJson(relativePath: string) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    return {
      path: relativePath,
      present: false,
      parsed: false,
      data: null
    };
  }

  try {
    const stat = fs.statSync(fullPath);
    const raw = fs.readFileSync(fullPath, "utf8");

    return {
      path: relativePath,
      present: true,
      parsed: true,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
      data: JSON.parse(raw)
    };
  } catch (error) {
    return {
      path: relativePath,
      present: true,
      parsed: false,
      data: null,
      error: error instanceof Error ? error.message : "unknown_error"
    };
  }
}

function readJsonlTail(relativePath: string, limit = 8) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    return {
      path: relativePath,
      present: false,
      records: []
    };
  }

  const raw = fs.readFileSync(fullPath, "utf8");
  const records = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(-limit)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return { raw: line, parsed: false };
      }
    });

  return {
    path: relativePath,
    present: true,
    records
  };
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

export function getPantavionAgentRunDashboard() {
  const loopReport = readJson(
    ".pantavion/agent-runtime/safe-patch-loop-report.json"
  );

  const supervisorReport = readJson(
    ".pantavion/agent-runtime/supervisor-report.json"
  );

  const selectedSlice = readJson(
    ".pantavion/agent-runtime/selected-implementation-slice.json"
  );

  const runtimeState = readJson(
    ".pantavion/agent-runtime/state.json"
  );

  const safePatchReceipt = readJson(
    "data/pantavion-safe-patches/last-safe-patch-receipt.json"
  );

  const loop = record(loopReport.data);
  const receipt = record(safePatchReceipt.data);
  const slice = record(selectedSlice.data);

  const cards = [
    {
      id: "safe_patch_loop",
      title: "Safe Patch Loop",
      ok: loopReport.present && loopReport.parsed && loop.ok === true,
      status: String(loop.status || "missing"),
      detail: loopReport.present
        ? "Real loop report found."
        : "Missing. Run npm run agent:loop."
    },
    {
      id: "safe_patch_writer",
      title: "Safe Patch Writer",
      ok: safePatchReceipt.present && safePatchReceipt.parsed && receipt.ok === true,
      status: safePatchReceipt.present ? "receipt_present" : "missing",
      detail: safePatchReceipt.present
        ? "Safe patch receipt found."
        : "Missing. Run npm run agent:safe-patch."
    },
    {
      id: "selected_slice",
      title: "Selected Slice",
      ok: selectedSlice.present && selectedSlice.parsed,
      status: selectedSlice.present ? String(slice.status || slice.riskZone || "present") : "missing",
      detail: selectedSlice.present
        ? "Supervisor selected implementation slice exists."
        : "Missing. Run npm run agent:supervisor."
    },
    {
      id: "approval_boundary",
      title: "Founder Approval Boundary",
      ok: true,
      status: "active",
      detail:
        "Deploy, secrets, DWG/source truth, auth, billing and destructive repo actions remain approval-gated."
    }
  ];

  return {
    ok: cards.every((card) => card.ok || card.id === "approval_boundary"),
    id: PANTAVION_AGENT_RUN_DASHBOARD_ID,
    generatedAt: new Date().toISOString(),
    route: "/api/pantavion/agents/runtime/dashboard",
    page: "/pantavion/agents/dashboard",
    cards,
    files: {
      loopReport,
      supervisorReport,
      selectedSlice,
      runtimeState,
      safePatchReceipt
    },
    auditTail: readJsonlTail(".pantavion/agent-runtime/audit.jsonl", 8),
    truthRule:
      "Dashboard reads real runtime files. Missing files are shown as missing, not faked."
  };
}
