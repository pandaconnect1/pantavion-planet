import { NextRequest, NextResponse } from "next/server";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";
import {
  assessPantavionPythonWorkerRuntime,
  listPantavionPythonWorkerJobDefinitions,
  type PantavionPythonWorkerRuntimeInput
} from "@/core/processing/python-worker-runtime-contract";
import {
  appendPantavionPythonWorkerRuntimeAudit,
  readPantavionPythonWorkerJobRecords,
  registerPantavionPythonWorkerJob
} from "@/core/processing/python-worker-runtime-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: "local-python-worker-runtime-api",
      authWarning:
        "Local development mode. Python worker runtime request accepted without production auth."
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  const resolved = resolveActor(request);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized python worker runtime access." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const records = await readPantavionPythonWorkerJobRecords();

  await appendPantavionPythonWorkerRuntimeAudit({
    event: "python.worker.runtime.read",
    actor,
    createdAt: new Date().toISOString(),
    records
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_python_worker_runtime_contract",
    status: "internal_contract",
    jobDefinitions: listPantavionPythonWorkerJobDefinitions(),
    records,
    rules: {
      execution:
        "This route registers and assesses worker jobs only. It does not execute Python code yet.",
      original:
        "Original artifacts and DWG source truth are immutable and never mutated.",
      sidecars:
        "Python worker outputs must be sidecar files only.",
      safety:
        "Execution requires future sandbox, queue, timeout, retry, resource limits, audit and approval gates.",
      control:
        "No SCADA write and no physical infrastructure control are allowed."
    }
  });
}

export async function POST(request: NextRequest) {
  const resolved = resolveActor(request);

  if (!resolved) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized python worker runtime request." },
      { status: 401 }
    );
  }

  const actor = resolved.actor;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const workerRequest: PantavionPythonWorkerRuntimeInput = {
    jobId: typeof body?.jobId === "string" ? body.jobId : undefined,
    jobKind: typeof body?.jobKind === "string" ? body.jobKind : undefined,
    artifactId: typeof body?.artifactId === "string" ? body.artifactId : undefined,
    filename: typeof body?.filename === "string" ? body.filename : undefined,
    extension: typeof body?.extension === "string" ? body.extension : undefined,
    sizeBytes: numberValue(body?.sizeBytes),
    sha256: typeof body?.sha256 === "string" ? body.sha256 : undefined,
    sourceTruth: Boolean(body?.sourceTruth),
    sensitive: Boolean(body?.sensitive),
    production: Boolean(body?.production),
    privateStorageVerified: Boolean(body?.privateStorageVerified),
    founderApproved: Boolean(body?.founderApproved),
    workerRuntimeAvailable: Boolean(body?.workerRuntimeAvailable),
    sandboxAvailable: Boolean(body?.sandboxAvailable),
    actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined
  };

  const mode = typeof body?.mode === "string" ? body.mode : "assess";

  if (mode === "register") {
    const result = await registerPantavionPythonWorkerJob(workerRequest);

    return NextResponse.json({
      ok: true,
      mode,
      assessment: result.assessment,
      records: result.records
    });
  }

  const assessment = assessPantavionPythonWorkerRuntime(workerRequest);

  await appendPantavionPythonWorkerRuntimeAudit({
    event: "python.worker.runtime.assessed",
    actor: workerRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: workerRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    mode,
    assessment
  });
}
