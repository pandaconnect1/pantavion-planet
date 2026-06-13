import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export type PantavionRuntimeLedgerEventType =
  | "kernel_wake"
  | "job_claimed"
  | "gap_detected"
  | "code_generated"
  | "adapter_planned"
  | "work_package_planned"
  | "audit_passed"
  | "audit_failed"
  | "build_passed"
  | "build_failed"
  | "pr_created"
  | "protected_gate_required"
  | "founder_gate_required"
  | "provider_required"
  | "connector_required"
  | "error_recorded";

export type PantavionRuntimeLedgerSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export type PantavionRuntimeLedgerEvent = {
  readonly id: string;
  readonly runId: string;
  readonly createdAt: string;
  readonly eventType: PantavionRuntimeLedgerEventType;
  readonly severity: PantavionRuntimeLedgerSeverity;
  readonly kernelFamily: string;
  readonly message: string;
  readonly protectedDomains: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

export type PantavionRuntimeLedgerSnapshot = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly events: readonly PantavionRuntimeLedgerEvent[];
};

export type PantavionRuntimeLedgerAppendInput = {
  readonly runId?: string;
  readonly eventType: PantavionRuntimeLedgerEventType;
  readonly severity?: PantavionRuntimeLedgerSeverity;
  readonly kernelFamily: string;
  readonly message: string;
  readonly protectedDomains?: readonly string[];
  readonly metadata?: Record<string, unknown>;
};

const LEDGER_FILE = path.join(
  process.cwd(),
  ".pantavion",
  "runtime-ledger",
  "ledger.json",
);

function nowIso(): string {
  return new Date().toISOString();
}

function ensureLedgerDir(): void {
  fs.mkdirSync(path.dirname(LEDGER_FILE), { recursive: true });
}

export function loadPantavionRuntimeLedger(): PantavionRuntimeLedgerSnapshot {
  try {
    if (!fs.existsSync(LEDGER_FILE)) {
      return {
        version: 1,
        updatedAt: nowIso(),
        events: [],
      };
    }

    const parsed = JSON.parse(fs.readFileSync(LEDGER_FILE, "utf8")) as PantavionRuntimeLedgerSnapshot;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      events: Array.isArray(parsed.events) ? parsed.events : [],
    };
  } catch {
    return {
      version: 1,
      updatedAt: nowIso(),
      events: [],
    };
  }
}

export function savePantavionRuntimeLedger(snapshot: PantavionRuntimeLedgerSnapshot): void {
  ensureLedgerDir();
  fs.writeFileSync(
    LEDGER_FILE,
    JSON.stringify(
      {
        version: 1,
        updatedAt: nowIso(),
        events: snapshot.events.slice(-1000),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

export function appendPantavionRuntimeLedgerEvent(
  input: PantavionRuntimeLedgerAppendInput,
): PantavionRuntimeLedgerEvent {
  const snapshot = loadPantavionRuntimeLedger();

  const event: PantavionRuntimeLedgerEvent = {
    id: randomUUID(),
    runId: input.runId ?? randomUUID(),
    createdAt: nowIso(),
    eventType: input.eventType,
    severity: input.severity ?? "info",
    kernelFamily: input.kernelFamily,
    message: input.message,
    protectedDomains: input.protectedDomains ?? [],
    metadata: input.metadata,
  };

  savePantavionRuntimeLedger({
    version: 1,
    updatedAt: nowIso(),
    events: [...snapshot.events, event],
  });

  return event;
}

export function summarizePantavionRuntimeLedger() {
  const snapshot = loadPantavionRuntimeLedger();

  const byType = snapshot.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] ?? 0) + 1;
    return acc;
  }, {});

  const byKernel = snapshot.events.reduce<Record<string, number>>((acc, event) => {
    acc[event.kernelFamily] = (acc[event.kernelFamily] ?? 0) + 1;
    return acc;
  }, {});

  const protectedEvents = snapshot.events.filter((event) => event.protectedDomains.length > 0);

  return {
    ok: true,
    version: snapshot.version,
    updatedAt: snapshot.updatedAt,
    totalEvents: snapshot.events.length,
    protectedEvents: protectedEvents.length,
    byType,
    byKernel,
    lastEvents: snapshot.events.slice(-20),
  };
}

export const pantavion_runtime_ledger_marker_v1 =
  "pantavion_runtime_ledger_c7a_v1";
