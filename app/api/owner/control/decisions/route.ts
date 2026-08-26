import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  decideOwnerItem,
  listOwnerDecisionItems,
  requireFounderIdentity,
} from "@/lib/owner-control/decision-queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function founderFromSession() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) throw new Error("authentication_required");
  requireFounderIdentity(auth.user.id);
  return auth.user.id;
}

export async function GET() {
  try {
    const ownerUserId = await founderFromSession();
    const items = await listOwnerDecisionItems(ownerUserId);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const code = error instanceof Error ? error.message : "owner_control_failed";
    const status = code === "authentication_required" ? 401 : code === "founder_only" ? 403 : 500;
    return NextResponse.json({ ok: false, error: code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const status = code === "authentication_required" ? 401 : code === "founder_only" ? 403 : 400;
    return NextResponse.json({ ok: false, error: code }, { status });
  }
}
