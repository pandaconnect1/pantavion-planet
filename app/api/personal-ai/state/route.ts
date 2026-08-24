import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPersonalAIState } from "@/core/intelligence/personal-ai-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getPersonalAIState(supabase, auth.user.id));
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "personal_ai_state_failed",
      detail: error instanceof Error ? error.message : "unknown",
    }, { status: 500 });
  }
}
