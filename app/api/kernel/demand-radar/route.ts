import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import { materializePantavionFounderExecutionIntents } from "@/core/kernel/pantavion-founder-canonical-state-runtime";
import {
  createPantavionDemandExecutionIntent,
  getPantavionDemandRadarOverview,
  initializePantavionDemandRadar,
  persistPantavionDemandRadarSnapshot,
  type PantavionDemandRadarIngestItem,
} from "@/core/research/pantavion-demand-radar-runtime";

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "unknown_error";
  return message.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 180) || "unknown_error";
}

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const overview = await getPantavionDemandRadarOverview();
    return noStore(
      NextResponse.json({
        ok: true,
        status: overview.persisted ? "operational" : "seed_available_not_persisted",
        visibility: "founder_internal_only",
        overview,
      }),
    );
  } catch (error) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_demand_radar_unavailable_v1",
          status: "blocked",
          issue: safeError(error),
        },
        { status: 503 },
      ),
    );
  }
}

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  let body: Record<string, unknown> | null = null;
  try {
    body = asRecord(await request.json());
  } catch {
    body = null;
  }

  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "initialize") {
      const persisted = await initializePantavionDemandRadar();
      return noStore(
        NextResponse.json({
          ok: true,
          marker: "pantavion_demand_radar_initialized_v1",
          status: "canonicalized",
          persisted,
          productionMutationAllowed: false,
        }),
      );
    }

    if (action === "ingest") {
      const sourceRef = typeof body?.sourceRef === "string" ? body.sourceRef.trim() : "";
      const rawItems = body?.items;
      const items = Array.isArray(rawItems) ? (rawItems as PantavionDemandRadarIngestItem[]) : [];
      if (!sourceRef || items.length < 1 || items.length > 200) {
        return noStore(
          NextResponse.json(
            {
              ok: false,
              marker: "pantavion_demand_radar_ingest_validation_failed_v1",
              status: "invalid_request",
            },
            { status: 400 },
          ),
        );
      }

      const persisted = await persistPantavionDemandRadarSnapshot({ items, sourceRef });
      return noStore(
        NextResponse.json({
          ok: true,
          marker: "pantavion_demand_radar_ingested_v1",
          status: persisted.deduplicated ? "deduplicated" : "canonicalized",
          persisted,
          productionMutationAllowed: false,
        }),
      );
    }

    if (action === "promote") {
      const signalId = typeof body?.signalId === "string" ? body.signalId.trim() : "";
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{2,159}$/.test(signalId)) {
        return noStore(
          NextResponse.json(
            {
              ok: false,
              marker: "pantavion_demand_radar_promotion_validation_failed_v1",
              status: "invalid_request",
            },
            { status: 400 },
          ),
        );
      }

      const result = await createPantavionDemandExecutionIntent(signalId);
      if (!result.candidate.eligibleForFounderProposal || !result.intentId) {
        return noStore(
          NextResponse.json(
            {
              ok: false,
              marker: "pantavion_demand_radar_signal_not_promotable_v1",
              status: "blocked_by_research_governance",
              candidate: result.candidate,
            },
            { status: 409 },
          ),
        );
      }

      const materialization = await materializePantavionFounderExecutionIntents(20);
      return noStore(
        NextResponse.json({
          ok: materialization.status !== "blocked",
          marker: "pantavion_demand_radar_founder_promotion_v1",
          status: materialization.status === "blocked" ? "blocked" : "materialized_or_queued",
          intentId: result.intentId,
          deduplicated: result.deduplicated,
          candidate: result.candidate,
          materialization,
          productionMutationAllowed: false,
        }),
      );
    }

    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_demand_radar_unknown_action_v1",
          status: "invalid_request",
        },
        { status: 400 },
      ),
    );
  } catch (error) {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_demand_radar_runtime_error_v1",
          status: "blocked",
          issue: safeError(error),
        },
        { status: 503 },
      ),
    );
  }
}
