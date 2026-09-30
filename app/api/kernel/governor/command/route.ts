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
import {
  capturePantavionFounderAgendaDirective,
  materializePantavionFounderExecutionIntents,
} from "@/core/kernel/pantavion-founder-canonical-state-runtime";
import type { PantavionAutonomousBuildTarget } from "@/core/kernel/pantavion-autonomous-builder-kernel";
import { evaluatePrivilegedRequestBoundary } from "@/core/security/privileged-request-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODES = new Set<PantavionExecutionMode>([
  "research",
  "expert",
  "viral",
  "prompt-engineer",
  "strategy",
]);

const TARGETS = new Set<PantavionAutonomousBuildTarget>([
  "pantavion_internal",
  "external_app",
  "api_integration",
  "admin_tool",
  "safety_system",
  "water_infrastructure",
  "sos_elder",
  "translation",
  "marketplace",
  "social_universe",
  "pantaai_center",
]);

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringList(value: unknown, max = 100): string[] | undefined {
  if (!Array.isArray(value) || value.length > max) return undefined;
  if (!value.every((item) => typeof item === "string")) return undefined;
  return value.map((item) => item.trim()).filter(Boolean);
}

function parseModes(value: unknown): PantavionExecutionMode[] | undefined {
  const list = stringList(value, 10);
  if (!list) return undefined;
  const modes = list.filter((item): item is PantavionExecutionMode =>
    MODES.has(item as PantavionExecutionMode),
  );
  return modes.length ? Array.from(new Set(modes)) : undefined;
}

function parseEvidence(value: unknown) {
  if (!Array.isArray(value) || value.length > 100) return undefined;

  return value
    .map(asRecord)
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
}

function parseExecution(
  body: Record<string, unknown>,
  founderIntent: string,
): PantavionGovernorExecutionInput {
  const objective =
    typeof body.objective === "string" && body.objective.trim()
      ? body.objective.trim().slice(0, 12_000)
      : founderIntent;
  const proposedAction =
    typeof body.proposedAction === "string" && body.proposedAction.trim()
      ? body.proposedAction.trim().slice(0, 12_000)
      : "Execute the Founder directive on Pantavion and verify evidence.";

  const mutationIntent =
    body.mutationIntent === "read" ||
    body.mutationIntent === "write" ||
    body.mutationIntent === "deploy" ||
    body.mutationIntent === "delete" ||
    body.mutationIntent === "route" ||
    body.mutationIntent === "publish"
      ? body.mutationIntent
      : undefined;

  const overrides = asRecord(body.explicitFounderOverrides);

  return {
    founderDirective: founderIntent,
    objective,
    proposedAction,
    modes: parseModes(body.modes),
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
    evidence: parseEvidence(body.evidence),
    constraints: stringList(body.constraints),
    completionGate: stringList(body.completionGate),
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
      reenableVercel: overrides?.reenableVercel === true,
      modifyMapAOriginal: overrides?.modifyMapAOriginal === true,
    },
  };
}

export async function POST(request: Request) {
  const bridgeAllowed = isPantavionGovernorBridgeRequestAllowed(request);
  const boundary = bridgeAllowed
    ? { allowed: true as const, reason: "ok" as const }
    : evaluatePrivilegedRequestBoundary(request);

  if (!boundary.allowed) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_governor_command_boundary_denied_v1",
          status: "restricted",
          reason: boundary.reason,
        },
        { status: 403 },
      ),
    );
  }

  if (!(bridgeAllowed || (await isPantavionKernelFounderRequestAllowed(request)))) {
    return denied();
  }

  const body = asRecord(await request.json().catch(() => null));
  if (!body) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_governor_command_invalid_json_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  const founderIntent =
    typeof body.founderIntent === "string"
      ? body.founderIntent.trim().slice(0, 12_000)
      : "";

  if (!founderIntent) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_governor_command_missing_directive_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  const target =
    typeof body.target === "string" &&
    TARGETS.has(body.target as PantavionAutonomousBuildTarget)
      ? (body.target as PantavionAutonomousBuildTarget)
      : "pantavion_internal";

  const execution = parseExecution(body, founderIntent);
  const evaluation = evaluatePantavionGovernorGuard(execution);

  if (evaluation.decision === "HARD_STOP") {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_governor_command_hard_stop_v1",
          governorState: "BLOCKED",
          evaluation,
          checkedAt: new Date().toISOString(),
        },
        { status: 409 },
      ),
    );
  }

  const sourceRef =
    typeof body.sourceRef === "string" &&
    body.sourceRef.trim().startsWith("chatgpt://")
      ? body.sourceRef.trim().slice(0, 1000)
      : "chatgpt://founder-command";

  try {
    const captured = await capturePantavionFounderAgendaDirective({
      founderIntent,
      title:
        typeof body.title === "string"
          ? body.title.trim().slice(0, 240)
          : undefined,
      target,
      sourceRef,
    });

    const materialization = await materializePantavionFounderExecutionIntents(1);
    const governorState =
      materialization.status === "blocked" || materialization.blocked > 0
        ? "BLOCKED"
        : "IN_PROGRESS";

    return noStore(
      NextResponse.json(
        {
          ok: governorState === "IN_PROGRESS",
          marker: "pantavion_governor_chatgpt_command_captured_v1",
          visibility: "founder_internal_only",
          governorState,
          evaluation,
          captured,
          materialization,
          checkedAt: new Date().toISOString(),
        },
        { status: governorState === "IN_PROGRESS" ? 201 : 503 },
      ),
    );
  } catch (error) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_governor_chatgpt_command_capture_failed_v1",
          governorState: "BLOCKED",
          error:
            error instanceof Error
              ? error.message.slice(0, 240)
              : "unknown_error",
        },
        { status: 503 },
      ),
    );
  }
}
