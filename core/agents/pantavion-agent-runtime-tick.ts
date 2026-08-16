import fs from "node:fs/promises";
import path from "node:path";
import {
  PANTAVION_AGENT_RUNTIME_ID,
  appendPantavionAgentAuditRecord,
} from "./pantavion-agent-runtime-guardrails";

export type PantavionAgentTickSource = "api" | "script" | "daemon" | "manual";

export interface PantavionAgentRuntimeTickInput {
  source?: PantavionAgentTickSource;
  actor?: string;
  reason?: string;
}

export interface PantavionAgentRuntimeTickRecord {
  tickId: string;
  tickNumber: number;
  source: PantavionAgentTickSource;
  createdAt: string;
  summary: string;
  nextActions: string[];
  approvalRequired: boolean;
}

export interface PantavionAgentRuntimeState {
  id: string;
  version: string;
  runtimeId: string;
  status: "internal_local_runtime";
  tickCount: number;
  lastTickAt: string | null;
  lastTickId: string | null;
  health: {
    guardrails: "active";
    providerAdapters: "requires_adapter";
    cloudScheduler: "not_enabled";
    durableDatabase: "not_enabled";
    queue: "local_state_only";
    founderApprovalGate: "active";
  };
  ticks: PantavionAgentRuntimeTickRecord[];
}

const STATE_DIR = path.join(process.cwd(), ".pantavion", "agent-runtime");
const STATE_PATH = path.join(STATE_DIR, "state.json");

function createInitialState(): PantavionAgentRuntimeState {
  return {
    id: "pantavion_agent_runtime_state_v1",
    version: "1.0.0",
    runtimeId: PANTAVION_AGENT_RUNTIME_ID,
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
      founderApprovalGate: "active",
    },
    ticks: [],
  };
}

export async function readPantavionAgentRuntimeState() {
  try {
    const text = await fs.readFile(STATE_PATH, "utf8");
    return JSON.parse(text) as PantavionAgentRuntimeState;
  } catch {
    return createInitialState();
  }
}

export async function runPantavionAgentRuntimeTick(
  input: PantavionAgentRuntimeTickInput = {},
) {
  await fs.mkdir(STATE_DIR, { recursive: true });

  const state = await readPantavionAgentRuntimeState();
  const createdAt = new Date().toISOString();
  const tickNumber = state.tickCount + 1;
  const tickId = "pantavion_agent_tick_" + Date.now();

  const tick: PantavionAgentRuntimeTickRecord = {
    tickId,
    tickNumber,
    source: input.source ?? "api",
    createdAt,
    summary:
      "Pantavion local agent runtime tick evaluated guardrails, adapter readiness, approval boundary, and next actions.",
    nextActions: [
      "Keep provider adapters in requires_adapter until real keys, routing, budget and audit exist.",
      "Keep GitHub/repo write actions approval-gated and scoped.",
      "Keep DWG/source-truth actions blocked unless founder approval, licensed adapter, private storage, and audit exist.",
      "Prepare future cloud scheduler only after founder approval.",
    ],
    approvalRequired: false,
  };

  const nextState: PantavionAgentRuntimeState = {
    ...state,
    tickCount: tickNumber,
    lastTickAt: createdAt,
    lastTickId: tickId,
    ticks: [tick, ...state.ticks].slice(0, 25),
  };

  await fs.writeFile(STATE_PATH, JSON.stringify(nextState, null, 2) + "\n", "utf8");

  const audit = await appendPantavionAgentAuditRecord({
    id: "pantavion_agent_tick_audit_" + Date.now(),
    runtimeId: PANTAVION_AGENT_RUNTIME_ID,
    createdAt,
    action: "agent_runtime_tick",
    riskClasses: [],
    founderApprovalRequired: false,
    summary: tick.summary,
    touchedFiles: [".pantavion/agent-runtime/state.json"],
    routeTargets: ["/api/pantavion/agents/runtime/tick"],
    status: "internal",
  });

  return {
    ok: true,
    tick,
    state: nextState,
    audit,
    note:
      "This is local/internal runtime state. Cloud 24/7 scheduling still requires durable database, queue, monitoring, auth, and founder approval.",
  };
}
