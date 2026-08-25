import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPersonalAIMemoryHealth } from "@/core/intelligence/personal-ai-advanced-memory";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getPersonalAIMemoryHealth(supabase, auth.user.id));
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: "personal_ai_memory_health_failed",
      detail: error instanceof Error ? error.message : "unknown",
    }, { status: 500 });
  }
}
