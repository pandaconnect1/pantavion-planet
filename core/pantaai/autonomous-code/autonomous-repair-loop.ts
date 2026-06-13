import fs from "fs";
import path from "path";
import { createHash, randomUUID } from "crypto";
import { appendPantavionRuntimeLedgerEvent } from "../runtime/runtime-ledger";
import { evaluateAutonomousMutation } from "./protected-path-policy";

export type PantavionRepairSignalKind =
  | "build_failed"
  | "typecheck_failed"
  | "audit_failed"
  | "github_actions_failed"
  | "vercel_failed"
  | "pr_preflight_failed"
  | "runtime_error"
  | "unknown_failure";

export type PantavionRepairJobState =
  | "pending"
  | "claimed"
  | "completed"
  | "quarantined";

export type PantavionRepairJob = {
  readonly id: string;
  readonly fingerprint: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly state: PantavionRepairJobState;
  readonly kind: PantavionRepairSignalKind;
  readonly title: string;
  readonly summary: string;
  readonly targetFile?: string;
  readonly targetBranch?: string;
  readonly sourceRunId?: string;
  readonly attempts: number;
  readonly repeatedFailures: number;
  readonly protectedDomain?: string;
  readonly requiresFounderApproval: boolean;
  readonly requiredGates: readonly string[];
  readonly requiredActions: readonly string[];
  readonly rawOutputPreview: string;
};

export type PantavionRepairQueue = {
  readonly version: 1;
  readonly updatedAt: string;
  readonly jobs: readonly PantavionRepairJob[];
};

export type PantavionRepairSignalInput = {
  readonly kind: PantavionRepairSignalKind;
  readonly summary: string;
  readonly rawOutput?: string;
  readonly targetFile?: string;
  readonly targetBranch?: string;
  readonly sourceRunId?: string;
};

const REPAIR_QUEUE_FILE = path.join(
  process.cwd(),
  ".pantavion",
  "autonomous-repair",
  "repair-jobs.json",
);

const MAX_RAW_OUTPUT_PREVIEW = 5000;
const QUARANTINE_AFTER_REPEATED_FAILURES = 3;

function nowIso(): string {
  return new Date().toISOString();
}

function ensureRepairQueueDir(): void {
  fs.mkdirSync(path.dirname(REPAIR_QUEUE_FILE), { recursive: true });
}

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_RAW_OUTPUT_PREVIEW);
}

function fingerprintRepairSignal(input: PantavionRepairSignalInput): string {
  const text = [
    input.kind,
    input.targetFile ?? "no-target-file",
    input.targetBranch ?? "no-target-branch",
    normalizeText(input.summary),
    normalizeText(input.rawOutput ?? ""),
  ].join("|");

  return createHash("sha256").update(text).digest("hex").slice(0, 24);
}

function titleForKind(kind: PantavionRepairSignalKind): string {
  switch (kind) {
    case "build_failed":
      return "Repair build failure";
    case "typecheck_failed":
      return "Repair TypeScript failure";
    case "audit_failed":
      return "Repair audit failure";
    case "github_actions_failed":
      return "Repair GitHub Actions failure";
    case "vercel_failed":
      return "Repair Vercel deployment failure";
    case "pr_preflight_failed":
      return "Repair autonomous PR preflight failure";
    case "runtime_error":
      return "Repair autonomous runtime error";
    default:
      return "Repair unknown autonomous failure";
  }
}

function requiredActionsForKind(kind: PantavionRepairSignalKind): string[] {
  const common = [
    "Read failure output.",
    "Identify exact file and line when available.",
    "Create scoped repair patch only.",
    "Run relevant audit.",
    "Run npm run build.",
    "Run npx tsc --noEmit.",
    "Commit only scoped repair files.",
    "Record repair result in Runtime Ledger.",
  ];

  if (kind === "build_failed" || kind === "vercel_failed") {
    return [
      "Inspect build log and Next.js generated route/type errors.",
      ...common,
      "Do not deploy production until build is green.",
    ];
  }

  if (kind === "typecheck_failed") {
    return [
      "Inspect TypeScript diagnostic.",
      "Fix type contract instead of suppressing errors.",
      ...common,
    ];
  }

  if (kind === "audit_failed") {
    return [
      "Inspect audit gate output.",
      "Fix missing marker/signal/policy rather than weakening audit.",
      ...common,
    ];
  }

  if (kind === "pr_preflight_failed") {
    return [
      "Inspect autonomous PR preflight blocked reasons.",
      "Remove raw data, secrets, oversized files, or invalid paths.",
      ...common,
    ];
  }

  return common;
}

export function loadPantavionRepairQueue(): PantavionRepairQueue {
  try {
    if (!fs.existsSync(REPAIR_QUEUE_FILE)) {
      return {
        version: 1,
        updatedAt: nowIso(),
        jobs: [],
      };
    }

    const parsed = JSON.parse(fs.readFileSync(REPAIR_QUEUE_FILE, "utf8")) as PantavionRepairQueue;

    return {
      version: 1,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : nowIso(),
      jobs: Array.isArray(parsed.jobs) ? parsed.jobs : [],
    };
  } catch {
    return {
      version: 1,
      updatedAt: nowIso(),
      jobs: [],
    };
  }
}

export function savePantavionRepairQueue(queue: PantavionRepairQueue): void {
  ensureRepairQueueDir();
  fs.writeFileSync(
    REPAIR_QUEUE_FILE,
    JSON.stringify(
      {
        version: 1,
        updatedAt: nowIso(),
        jobs: queue.jobs.slice(-500),
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

export function recordPantavionFailureAndCreateRepairJob(
  input: PantavionRepairSignalInput,
): PantavionRepairJob {
  const queue = loadPantavionRepairQueue();
  const fingerprint = fingerprintRepairSignal(input);
  const existingSame = queue.jobs.filter((job) => job.fingerprint === fingerprint);
  const repeatedFailures = existingSame.length + 1;

  const policy = input.targetFile
    ? evaluateAutonomousMutation({
        filePath: input.targetFile,
        operation: "update",
        reason: input.summary,
        requestedBy: "kernel",
      })
    : undefined;

  const shouldQuarantine = repeatedFailures >= QUARANTINE_AFTER_REPEATED_FAILURES;

  const job: PantavionRepairJob = {
    id: `repair-${randomUUID()}`,
    fingerprint,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    state: shouldQuarantine ? "quarantined" : "pending",
    kind: input.kind,
    title: titleForKind(input.kind),
    summary: normalizeText(input.summary),
    targetFile: input.targetFile,
    targetBranch: input.targetBranch,
    sourceRunId: input.sourceRunId,
    attempts: 0,
    repeatedFailures,
    protectedDomain: policy?.domain,
    requiresFounderApproval: policy?.requiresFounderApproval ?? false,
    requiredGates: policy?.requiredGates ?? ["typescript", "build", "autonomous_repair_gate"],
    requiredActions: requiredActionsForKind(input.kind),
    rawOutputPreview: normalizeText(input.rawOutput ?? ""),
  };

  savePantavionRepairQueue({
    version: 1,
    updatedAt: nowIso(),
    jobs: [...queue.jobs, job],
  });

  appendPantavionRuntimeLedgerEvent({
    runId: input.sourceRunId,
    eventType:
      input.kind === "build_failed" || input.kind === "vercel_failed"
        ? "build_failed"
        : input.kind === "audit_failed"
          ? "audit_failed"
          : "error_recorded",
    severity: shouldQuarantine ? "critical" : "error",
    kernelFamily: "Pantavion Autonomous Repair Kernel",
    message: shouldQuarantine
      ? "Repeated autonomous failure quarantined and repair job recorded."
      : "Autonomous failure recorded and repair job created.",
    protectedDomains: policy?.domain ? [policy.domain] : [],
    metadata: {
      marker: "pantavion_autonomous_repair_loop_c9b_v1",
      repairJobId: job.id,
      fingerprint,
      kind: input.kind,
      state: job.state,
      repeatedFailures,
      targetFile: input.targetFile,
      targetBranch: input.targetBranch,
      requiresFounderApproval: job.requiresFounderApproval,
      requiredGates: job.requiredGates,
    },
  });

  if (job.requiresFounderApproval || shouldQuarantine) {
    appendPantavionRuntimeLedgerEvent({
      runId: input.sourceRunId,
      eventType: "founder_gate_required",
      severity: shouldQuarantine ? "critical" : "warning",
      kernelFamily: "Pantavion Autonomous Repair Kernel",
      message: shouldQuarantine
        ? "Repair job is quarantined after repeated failures."
        : "Repair job touches a protected domain and requires founder approval.",
      protectedDomains: policy?.domain ? [policy.domain] : ["founder_gate"],
      metadata: {
        marker: "pantavion_autonomous_repair_loop_c9b_v1",
        repairJobId: job.id,
        state: job.state,
      },
    });
  }

  return job;
}

export function summarizePantavionRepairQueue() {
  const queue = loadPantavionRepairQueue();

  const byState = queue.jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.state] = (acc[job.state] ?? 0) + 1;
    return acc;
  }, {});

  const byKind = queue.jobs.reduce<Record<string, number>>((acc, job) => {
    acc[job.kind] = (acc[job.kind] ?? 0) + 1;
    return acc;
  }, {});

  return {
    ok: true,
    marker: "pantavion_autonomous_repair_summary_c9b_v1",
    updatedAt: queue.updatedAt,
    totalJobs: queue.jobs.length,
    pendingJobs: queue.jobs.filter((job) => job.state === "pending").length,
    quarantinedJobs: queue.jobs.filter((job) => job.state === "quarantined").length,
    protectedJobs: queue.jobs.filter((job) => Boolean(job.protectedDomain)).length,
    byState,
    byKind,
    lastJobs: queue.jobs.slice(-20),
  };
}

export const pantavion_autonomous_repair_loop_marker_v1 =
  "pantavion_autonomous_repair_loop_c9b_v1";
