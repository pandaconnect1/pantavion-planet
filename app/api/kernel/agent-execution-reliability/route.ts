import { NextRequest, NextResponse } from "next/server";
import {
  assessPantavionAgentExecutionReliability,
  listPantavionAgentExecutionReliabilityPolicy,
  type PantavionAgentExecutionActionClass,
  type PantavionAgentExecutionReliabilityInput,
  type PantavionAgentCommandResultStatus
} from "@/core/agent/agent-execution-reliability";
import { appendPantavionAgentExecutionReliabilityAudit } from "@/core/agent/agent-execution-reliability-audit";
import { verifyKernelRequest } from "@/core/kernel/kernel-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeActionClass(value: unknown): PantavionAgentExecutionActionClass {
  const allowed: PantavionAgentExecutionActionClass[] = [
    "safe_check",
    "build_check",
    "typecheck",
    "kernel_check",
    "file_write",
    "repo_change",
    "dependency_install",
    "external_repo",
    "ci_cd",
    "deploy",
    "secret_sensitive",
    "source_truth_sensitive",
    "unknown"
  ];

  return allowed.includes(value as PantavionAgentExecutionActionClass)
    ? (value as PantavionAgentExecutionActionClass)
    : "unknown";
}

function normalizeResultStatus(value: unknown): PantavionAgentCommandResultStatus {
  const allowed: PantavionAgentCommandResultStatus[] = [
    "not_run",
    "success",
    "failed",
    "timed_out",
    "cancelled"
  ];

  return allowed.includes(value as PantavionAgentCommandResultStatus)
    ? (value as PantavionAgentCommandResultStatus)
    : "not_run";
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.filter((item): item is string => typeof item === "string");
}

export async function GET(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "api:kernel:agent-execution-reliability:get";
  const policy = listPantavionAgentExecutionReliabilityPolicy();

  await appendPantavionAgentExecutionReliabilityAudit({
    event: "agent.execution.reliability.policy.read",
    actor,
    createdAt: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    capability: "pantavion_agent_execution_reliability_layer",
    status: "internal",
    policy,
    rules: {
      noBlindExecution:
        "Commands are assessed, timed, audited, and approval-gated before execution.",
      resultCapture:
        "Command results must capture status, exit code, duration, sanitized stdout, and sanitized stderr.",
      retries:
        "Retries are limited and only allowed for safe checks, not destructive or sensitive actions.",
      checkpoints:
        "File, repo, dependency, CI/CD, and deploy actions require checkpoint and rollback planning.",
      secrets:
        "Secrets must be redacted and must never appear in prompts, logs, browser routes, or public CI output."
    }
  });
}

export async function POST(request: NextRequest) {
  const auth = verifyKernelRequest(request);

  if (!auth.ok && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.statusCode }
    );
  }

  const actor = auth.ok ? auth.actor : "api:kernel:agent-execution-reliability:post";
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  const reliabilityRequest: PantavionAgentExecutionReliabilityInput = {
    actionClass: normalizeActionClass(body?.actionClass),
    command: typeof body?.command === "string" ? body.command : undefined,
    touchedFiles: stringArray(body?.touchedFiles),
    timeoutMs: typeof body?.timeoutMs === "number" ? body.timeoutMs : undefined,
    maxRetries: typeof body?.maxRetries === "number" ? body.maxRetries : undefined,
    requiresCheckpoint: Boolean(body?.requiresCheckpoint),
    requiresRollbackPlan: Boolean(body?.requiresRollbackPlan),
    founderApproved: Boolean(body?.founderApproved),
    approvalId: typeof body?.approvalId === "string" ? body.approvalId : undefined,
    actor: typeof body?.actor === "string" ? body.actor : actor,
    reason: typeof body?.reason === "string" ? body.reason : undefined,
    resultStatus: normalizeResultStatus(body?.resultStatus),
    exitCode: typeof body?.exitCode === "number" ? body.exitCode : undefined,
    durationMs: typeof body?.durationMs === "number" ? body.durationMs : undefined,
    stdoutPreview: typeof body?.stdoutPreview === "string" ? body.stdoutPreview : undefined,
    stderrPreview: typeof body?.stderrPreview === "string" ? body.stderrPreview : undefined
  };

  const assessment = assessPantavionAgentExecutionReliability(reliabilityRequest);

  await appendPantavionAgentExecutionReliabilityAudit({
    event: "agent.execution.reliability.assessed",
    actor: reliabilityRequest.actor ?? actor,
    createdAt: new Date().toISOString(),
    request: reliabilityRequest,
    assessment
  });

  return NextResponse.json({
    ok: true,
    assessment
  });
}
