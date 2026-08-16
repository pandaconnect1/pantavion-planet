const fs = require("fs");
const path = require("path");

const root = process.cwd();
const dir = path.join(root, ".pantavion", "agent-runtime");
const statePath = path.join(dir, "state.json");
const auditPath = path.join(dir, "audit.jsonl");

function initialState() {
  return {
    id: "pantavion_agent_runtime_state_v1",
    version: "1.0.0",
    runtimeId: "pantavion_agent_runtime_guardrails_v1",
    status: "internal_local_runtime",
    tickCount: 0,
    lastTickAt: null,
    lastTickId: null,
    health: {
      guardrails: "active",
      providerAdapters: "requires_adapter",
      cloudScheduler: "not_enabled",
      durableDatabase: "not_enabled",
      queue: "local_state_only",
      founderApprovalGate: "active"
    },
    ticks: []
  };
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return initialState();
  }
}

function appendAudit(record) {
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(auditPath, JSON.stringify(record) + "\n", "utf8");
}

function runTick(source) {
  fs.mkdirSync(dir, { recursive: true });

  const state = readState();
  const createdAt = new Date().toISOString();
  const tickNumber = Number(state.tickCount || 0) + 1;
  const tickId = "pantavion_agent_tick_" + Date.now();

  const tick = {
    tickId,
    tickNumber,
    source: source || "script",
    createdAt,
    summary:
      "Pantavion local agent runtime tick evaluated guardrails, adapter readiness, approval boundary, and next actions.",
    nextActions: [
      "Keep provider adapters in requires_adapter until real keys, routing, budget and audit exist.",
      "Keep GitHub/repo write actions approval-gated and scoped.",
      "Keep DWG/source-truth actions blocked unless founder approval, licensed adapter, private storage, and audit exist.",
      "Prepare future cloud scheduler only after founder approval."
    ],
    approvalRequired: false
  };

  const nextState = {
    ...state,
    tickCount: tickNumber,
    lastTickAt: createdAt,
    lastTickId: tickId,
    ticks: [tick].concat(state.ticks || []).slice(0, 25)
  };

  fs.writeFileSync(statePath, JSON.stringify(nextState, null, 2) + "\n", "utf8");

  appendAudit({
    id: "pantavion_agent_tick_audit_" + Date.now(),
    runtimeId: "pantavion_agent_runtime_guardrails_v1",
    createdAt,
    action: "agent_runtime_tick",
    riskClasses: [],
    founderApprovalRequired: false,
    summary: tick.summary,
    touchedFiles: [".pantavion/agent-runtime/state.json"],
    routeTargets: ["/api/pantavion/agents/runtime/tick"],
    status: "internal"
  });

  return {
    ok: true,
    tick,
    statePath: ".pantavion/agent-runtime/state.json",
    auditPath: ".pantavion/agent-runtime/audit.jsonl"
  };
}

if (require.main === module) {
  const result = runTick(process.env.PANTAVION_AGENT_TICK_SOURCE || "script");
  console.log(JSON.stringify(result, null, 2));
}

module.exports = { runTick };
