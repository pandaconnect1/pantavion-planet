import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import {
  listPantavionFounderCanonicalStates,
  listPantavionFounderExecutionIntents,
  materializePantavionFounderExecutionIntents,
} from "@/core/kernel/pantavion-founder-canonical-state-runtime";
import { evaluatePrivilegedRequestBoundary } from "@/core/security/privileged-request-boundary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
    }),
  );
}

function invalidMutationBoundary(reason: string) {
  return noStore(
    NextResponse.json(
      {
        ok: false,
        marker: "pantavion_canonical_state_mutation_boundary_denied_v1",
        status: "restricted",
        reason,
      },
      { status: 403 },
    ),
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const [states, executionIntents] = await Promise.all([
      listPantavionFounderCanonicalStates(10),
      listPantavionFounderExecutionIntents(250),
    ]);

    return noStore(
      NextResponse.json({
        ok: true,
        marker: "pantavion_founder_canonical_state_operational_v1",
        visibility: "founder_internal_only",
        states,
        executionIntents,
        checkedAt: new Date().toISOString(),
      }),
    );
  } catch {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_founder_canonical_state_unavailable_v1",
          status: "blocked",
        },
        { status: 503 },
      ),
    );
  }
}

export async function POST(request: Request) {
  const mutationBoundary = evaluatePrivilegedRequestBoundary(request);
  if (!mutationBoundary.allowed) {
    return invalidMutationBoundary(mutationBoundary.reason);
  }

  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  let body: Record<string, unknown> | null = null;
  try {
    body = asRecord(await request.json());
  } catch {
    body = null;
  }

  const action = typeof body?.action === "string" ? body.action.trim() : "";
  if (action !== "materialize") {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_canonical_state_unknown_action_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  const rawLimit = body?.limit;
  const limit = rawLimit === undefined ? 20 : rawLimit;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_canonical_state_materialization_validation_failed_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  }

  try {
    const materialization = await materializePantavionFounderExecutionIntents(limit);
    return noStore(
      NextResponse.json({
        ok: materialization.status !== "blocked",
        marker: "pantavion_founder_canonical_intents_materialization_v1",
        visibility: "founder_internal_only",
        status: materialization.status,
        materialization,
        workOrderMaterialization: true,
        directFileWriteAllowed: false,
        directProductionDeployAllowed: false,
        checkedAt: new Date().toISOString(),
      }),
    );
  } catch {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_founder_canonical_intents_materialization_failed_v1",
          status: "blocked",
        },
        { status: 503 },
      ),
    );
  }
}
