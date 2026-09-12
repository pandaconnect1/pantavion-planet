import { NextRequest, NextResponse } from "next/server";

import buildReadinessIndex from "@/data/recovery/sovereign-build-readiness-index-v1.json";
import {
  createRecoveryBuildOwnerDecisionReceipt,
  type RecoveryBuildOwnerDecision,
  type RecoveryBuildReadinessDecisionSource,
} from "@/core/recovery/pantavion-recovery-owner-decision";
import {
  listRecoveryBuildOwnerDecisions,
  recordRecoveryBuildOwnerDecision,
} from "@/lib/owner-control/recovery-build-order-decisions";
import {
  requireFounderIdentity,
} from "@/lib/owner-control/decision-queue";
import { requireAal2Assurance } from "@/lib/owner-control/assurance";
import { createClient } from "@/lib/supabase/server";
import { requireSameOriginRequest } from "@/lib/owner-control/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function founderAal2FromSession() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("authentication_required");
  requireFounderIdentity(auth.user.id);

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) throw new Error("aal2_check_failed");
  requireAal2Assurance(assurance?.currentLevel);
  return auth.user.id;
}

function statusFor(code: string) {
  if (code === "authentication_required") return 401;
  if (code === "aal2_check_failed") return 500;
  if (
    code === "founder_only" ||
    code === "aal2_required" ||
    code === "cross_origin_forbidden" ||
    code === "same_origin_required" ||
    code === "origin_invalid"
  ) return 403;
  if (code === "recovery_build_decision_already_recorded") return 409;
  if (code.includes("_failed:")) return 500;
  return 400;
}

export async function GET() {
  try {
    const ownerUserId = await founderAal2FromSession();
    const decisions = await listRecoveryBuildOwnerDecisions(ownerUserId);
    return NextResponse.json({ ok: true, decisions });
  } catch (error) {
    const code = error instanceof Error ? error.message : "recovery_build_decision_failed";
    return NextResponse.json({ ok: false, error: code }, { status: statusFor(code) });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOriginRequest(request.headers);
    const ownerUserId = await founderAal2FromSession();
    const body = (await request.json()) as {
      buildOrderId?: string;
      readinessDigest?: string;
      decision?: RecoveryBuildOwnerDecision;
      note?: string | null;
    };
    if (!body.buildOrderId || !body.readinessDigest || !body.decision) {
      throw new Error("recovery_build_decision_fields_required");
    }

    const packet = buildReadinessIndex.packets.find(
      (candidate) => candidate.buildOrderId === body.buildOrderId,
    );
    if (!packet || packet.readinessDigest !== body.readinessDigest) {
      throw new Error("recovery_build_decision_source_mismatch");
    }

    const receipt = createRecoveryBuildOwnerDecisionReceipt({
      source: packet as RecoveryBuildReadinessDecisionSource,
      readinessIndexDigest: buildReadinessIndex.indexDigest,
      ownerUserId,
      assuranceLevel: "aal2",
      decision: body.decision,
      note: body.note,
      decidedAt: new Date().toISOString(),
    });
    const stored = await recordRecoveryBuildOwnerDecision(receipt);

    return NextResponse.json({
      ok: true,
      decision: stored,
      boundary: {
        scopeApprovalRecorded: receipt.scopeApprovalRecorded,
        nextPermittedLifecycleState: receipt.nextPermittedLifecycleState,
        separateCapabilityGrantRequired: true,
        separateBudgetGrantRequired: true,
        authority: receipt.authority,
        completion: false,
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "recovery_build_decision_failed";
    return NextResponse.json({ ok: false, error: code }, { status: statusFor(code) });
  }
}
