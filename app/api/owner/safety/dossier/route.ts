import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const caseId = typeof body.caseId === "string" ? body.caseId : "";
  const scope = body.scope === "identity_review" ? "identity_review" : "standard";
  const purpose = typeof body.purpose === "string" ? body.purpose.trim() : "";
  if (!caseId || purpose.length < 10) return NextResponse.json({ ok: false, error: "case_and_purpose_required" }, { status: 400 });

  const { data, error } = await supabase.rpc("pantavion_get_trust_safety_dossier", { p_case_id: caseId, p_scope: scope, p_purpose: purpose });
  if (error) return NextResponse.json({ ok: false, error: "dossier_access_denied", detail: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, dossier: data });
}
