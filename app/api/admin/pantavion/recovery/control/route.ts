import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import {
  runPantavionRecoveryFounderControl,
  type PantavionRecoveryFounderAction,
} from "@/lib/supabase/oidc-founder-recovery-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Stage = "classify" | "canonicalize" | "route" | "audit" | "work_unit_generation";
const ACTIONS = new Set<PantavionRecoveryFounderAction>([
  "pause_stage",
  "resume_stage",
  "retry_failed",
  "pause_all",
  "resume_all",
]);
const STAGES = new Set<Stage>([
  "classify",
  "canonicalize",
  "route",
  "audit",
  "work_unit_generation",
]);

export async function POST(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let body: { action?: unknown; stage?: unknown };
  try {
    body = (await request.json()) as { action?: unknown; stage?: unknown };
  } catch {
    return NextResponse.json({ ok: false, code: "invalid_json" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "";
  const stage = typeof body.stage === "string" ? body.stage : undefined;
  if (!ACTIONS.has(action as PantavionRecoveryFounderAction)) {
    return NextResponse.json({ ok: false, code: "invalid_action" }, { status: 400 });
  }
  if (["pause_stage", "resume_stage", "retry_failed"].includes(action)) {
    if (!stage || !STAGES.has(stage as Stage)) {
      return NextResponse.json({ ok: false, code: "invalid_stage" }, { status: 400 });
    }
  }

  try {
    const result = await runPantavionRecoveryFounderControl({
      action: action as PantavionRecoveryFounderAction,
      stage: stage as Stage | undefined,
    });
    return NextResponse.json(
      { ok: true, ...result },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        code: "founder_recovery_control_failed",
        detail: error instanceof Error ? error.message : "unknown",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
