import { promises as fs } from "fs";
import path from "path";
import {
  assessPantavionPythonWorkerRuntime,
  type PantavionPythonWorkerJobRecord,
  type PantavionPythonWorkerRuntimeAssessment,
  type PantavionPythonWorkerRuntimeInput
} from "./python-worker-runtime-contract";

export type PantavionPythonWorkerRuntimeAuditEvent = {
  event:
    | "python.worker.runtime.read"
    | "python.worker.runtime.assessed"
    | "python.worker.runtime.registered";
  actor: string;
  createdAt: string;
  request?: PantavionPythonWorkerRuntimeInput;
  assessment?: PantavionPythonWorkerRuntimeAssessment;
  records?: PantavionPythonWorkerJobRecord[];
};

const dataDir = path.join(process.cwd(), "data", "kernel");
const stateFile = path.join(dataDir, "python-worker-runtime-jobs.json");
const auditFile = path.join(dataDir, "python-worker-runtime-audit.jsonl");

async function ensureDataDir(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
}

export async function appendPantavionPythonWorkerRuntimeAudit(
  event: PantavionPythonWorkerRuntimeAuditEvent
): Promise<void> {
  await ensureDataDir();
  await fs.appendFile(auditFile, `${JSON.stringify(event)}\n`, "utf8");
}

export async function readPantavionPythonWorkerJobRecords(): Promise<PantavionPythonWorkerJobRecord[]> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as PantavionPythonWorkerJobRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String((error as { code?: unknown }).code)
        : "";

    if (code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function writePantavionPythonWorkerJobRecords(
  records: PantavionPythonWorkerJobRecord[]
): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(stateFile, `${JSON.stringify(records, null, 2)}\n`, "utf8");
}

export async function registerPantavionPythonWorkerJob(
  input: PantavionPythonWorkerRuntimeInput
): Promise<{
  assessment: PantavionPythonWorkerRuntimeAssessment;
  records: PantavionPythonWorkerJobRecord[];
}> {
  const assessment = assessPantavionPythonWorkerRuntime(input);
  const actor = input.actor ?? "system:python-worker-runtime";
  const now = new Date().toISOString();

  let records = await readPantavionPythonWorkerJobRecords();

  if (!assessment.canRegisterJob || !assessment.artifactId || !assessment.filename) {
    await appendPantavionPythonWorkerRuntimeAudit({
      event: "python.worker.runtime.assessed",
      actor,
      createdAt: now,
      request: input,
      assessment,
      records
    });

    return { assessment, records };
  }

  const jobId =
    assessment.jobId ??
    `py_job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  const existing = records.find((record) => record.jobId === jobId);

  const record: PantavionPythonWorkerJobRecord = {
    id: existing?.id ?? `python_worker_record_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    jobId,
    jobKind: assessment.jobKind,
    artifactId: assessment.artifactId,
    filename: assessment.filename,
    extension: assessment.extension,
    sizeBytes: input.sizeBytes,
    sha256: input.sha256,
    sourceTruth: assessment.sourceTruth,
    sensitive: assessment.sensitive,
    production: assessment.production,
    status: "registered_pending_worker",
    sidecarOutputs: assessment.sidecarOutputs,
    originalMutationAllowed: false,
    originalDwgMutationAllowed: false,
    sidecarOnly: true,
    pythonExecutionAllowedNow: false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    actor,
    reason: input.reason
  };

  records = [
    record,
    ...records.filter((entry) => entry.jobId !== jobId)
  ];

  await writePantavionPythonWorkerJobRecords(records);

  await appendPantavionPythonWorkerRuntimeAudit({
    event: "python.worker.runtime.registered",
    actor,
    createdAt: now,
    request: input,
    assessment,
    records
  });

  return { assessment, records };
}

export function getPantavionPythonWorkerRuntimeStatePath(): string {
  return stateFile;
}

export function getPantavionPythonWorkerRuntimeAuditPath(): string {
  return auditFile;
}
