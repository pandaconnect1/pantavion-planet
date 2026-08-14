import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError || assurance?.currentLevel !== "aal2") {
    return NextResponse.json({ ok: false, error: "aal2_required" }, { status: 403 });
  }

  const { data, error } = await supabase.rpc("pantavion_list_trust_safety_cases", { p_limit: 100 });
  if (error) return NextResponse.json({ ok: false, error: "case_access_denied", detail: error.message }, { status: 403 });
  return NextResponse.json({ ok: true, cases: data ?? [] });
}
