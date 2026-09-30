import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionGovernorBridgeRequestAllowed,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import {
  evaluatePantavionGovernorGuard,
  type PantavionExecutionMode,
  type PantavionGovernorExecutionInput,
} from "@/core/kernel/pantavion-execution-governor";
import { evaluatePrivilegedRequestBoundary } from "@/core/security/privileged-request-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXECUTION_MODES = [
  "research",
  "expert",
  "viral",
  "prompt-engineer",
  "strategy",
] as const satisfies readonly PantavionExecutionMode[];

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
    }),
  );
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(value: unknown, max = 50) {
  if (!Array.isArray(value) || value.length > max) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean);
}

function parseExecutionInput(
  value: unknown,
): PantavionGovernorExecutionInput | null {
  const body = record(value);
  if (!body) return null;

  const founderDirective =
    typeof body.founderDirective === "string"
      ? body.founderDirective.trim()
      : "";
  const objective =
    typeof body.objective === "string" ? body.objective.trim() : "";
  const proposedAction =
    typeof body.proposedAction === "string"
      ? body.proposedAction.trim()
      : "";

  if (
    !founderDirective ||
    founderDirective.length > 12_000 ||
    !objective ||
    objective.length > 12_000 ||
    !proposedAction ||
    proposedAction.length > 12_000
  ) {
    return null;
  }

  const rawModes = stringList(body.modes, EXECUTION_MODES.length);
  const modes = rawModes?.filter((mode): mode is PantavionExecutionMode =>
    EXECUTION_MODES.includes(mode as PantavionExecutionMode),
  );

  const rawEvidence = Array.isArray(body.evidence) ? body.evidence : [];
  if (rawEvidence.length > 100) return null;

  const evidence = rawEvidence
    .map(record)
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .filter(
      (item) =>
        typeof item.kind === "string" &&
        typeof item.reference === "string",
    )
    .map((item) => ({
      kind: String(item.kind).slice(0, 120),
      reference: String(item.reference).slice(0, 2_000),
      verified:
        typeof item.verified === "boolean" ? item.verified : undefined,
    }));

  const mutationIntent =
    body.mutationIntent === "read" ||
    body.mutationIntent === "write" ||
    body.mutationIntent === "deploy" ||
    body.mutationIntent === "delete" ||
    body.mutationIntent === "route" ||
    body.mutationIntent === "publish"
      ? body.mutationIntent
      : undefined;

  const override = record(body.explicitFounderOverrides);

  return {
    founderDirective,
    objective,
    proposedAction,
    modes,
    targetProvider:
      typeof body.targetProvider === "string"
        ? body.targetProvider.slice(0, 160)
        : undefined,
    targetResource:
      typeof body.targetResource === "string"
        ? body.targetResource.slice(0, 500)
        : undefined,
    mutationIntent,
    completionClaim: body.completionClaim === true,
    evidence,
    constraints: stringList(body.constraints, 100),
    completionGate: stringList(body.completionGate, 100),
    priorFailedActionFingerprints: stringList(
      body.priorFailedActionFingerprints,
      500,
    ),
    proposedActionFingerprint:
      typeof body.proposedActionFingerprint === "string"
        ? body.proposedActionFingerprint.slice(0, 512)
        : undefined,
    newEvidenceFingerprint:
      typeof body.newEvidenceFingerprint === "string"
        ? body.newEvidenceFingerprint.slice(0, 512)
        : undefined,
    publicContentTask: body.publicContentTask === true,
    explicitFounderOverrides: {
      reenableVercel: override?.reenableVercel === true,
      modifyMapAOriginal: override?.modifyMapAOriginal === true,
    },
  };
}

export async function GET(request: Request) {
  if (!(isPantavionGovernorBridgeRequestAllowed(request) || (await isPantavionKernelFounderRequestAllowed(request)))) return denied();

  return noStore(
    NextResponse.json({
      ok: true,
      marker: "pantavion_execution_governor_operational_v1",
      visibility: "founder_internal_only",
      roles: {
        founder: "directive_authority",
        chatgpt: "executor",
        pantavion: "governor_watchdog",
      },
      executionModes: EXECUTION_MODES,
      rules: {
        vercel: "BLOCKED_UNLESS_EXPLICIT_FOUNDER_OVERRIDE",
        supabase: "TRANSITION_ONLY_AVOID_NEW_STRATEGIC_LOCK_IN",
        mapAOriginal: "IMMUTABLE_FOR_ACCESS_ROUTING_SERVING_FIXES",
        completion: "VERIFIED_EVIDENCE_REQUIRED",
        repeatFailure: "HARD_STOP_WITHOUT_NEW_EVIDENCE",
      },
      checkedAt: new Date().toISOString(),
    }),
  );
}

export async function POST(request: Request) {
  const boundary = evaluatePrivilegedRequestBoundary(request);
  if (!boundary.allowed) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_execution_governor_boundary_denied_v1",
          status: "restricted",
          reason: boundary.reason,
        },
        { status: 403 },
      ),
    );
  }

  if (!(isPantavionGovernorBridgeRequestAllowed(request) || (await isPantavionKernelFounderRequestAllowed(request)))) return denied();

  const body = await request.json().catch(() => null);
  const execution = parseExecutionInput(body);

  if (!execution) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_execution_governor_invalid_input_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  const evaluation = evaluatePantavionGovernorGuard(execution);

  return noStore(
    NextResponse.json({
      ok: evaluation.decision !== "HARD_STOP",
      marker: "pantavion_execution_governor_evaluation_v1",
      visibility: "founder_internal_only",
      evaluation,
      checkedAt: new Date().toISOString(),
    }),
  );
}
