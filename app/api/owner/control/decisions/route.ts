import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  decideOwnerItem,
  listOwnerDecisionItems,
  requireFounderIdentity,
} from "@/lib/owner-control/decision-queue";
import { requireAal2Assurance } from "@/lib/owner-control/assurance";
import { requireSameOriginRequest } from "@/lib/owner-control/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function founderFromSession() {
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

export async function GET() {
  try {
    const ownerUserId = await founderFromSession();
    const items = await listOwnerDecisionItems(ownerUserId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const code = error instanceof Error ? error.message : "owner_control_failed";
    const status = code === "authentication_required"
      ? 401
      : ["founder_only", "aal2_required"].includes(code)
        ? 403
        : 500;
    return NextResponse.json({ ok: false, error: code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireSameOriginRequest(request.headers);
    const ownerUserId = await founderFromSession();
    const body = (await request.json()) as {
      id?: string;
      decision?: "approved" | "rejected";
      note?: string | null;
    };

    if (!body.id || !body.decision || !["approved", "rejected"].includes(body.decision)) {
      return NextResponse.json({ ok: false, error: "valid_decision_required" }, { status: 400 });
    }

    const result = await decideOwnerItem({
      ownerUserId,
      id: body.id,
      decision: body.decision,
      note: body.note,
    });

    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const code = error instanceof Error ? error.message : "owner_control_failed";
    const status = code === "authentication_required"
      ? 401
      : [
          "founder_only",
          "aal2_required",
          "cross_origin_forbidden",
          "same_origin_required",
          "origin_invalid",
        ].includes(code)
        ? 403
        : 400;
    return NextResponse.json({ ok: false, error: code }, { status });
  }
}
