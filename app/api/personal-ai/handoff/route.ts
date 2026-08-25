import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPersonalAIContextHandoff } from "@/core/intelligence/personal-ai-advanced-memory";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const sourceThreadId = typeof body.sourceThreadId === "string" ? body.sourceThreadId.trim() : "";
  if (!sourceThreadId) {
    return NextResponse.json({ ok: false, error: "source_thread_id_required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await createPersonalAIContextHandoff(supabase, auth.user.id, sourceThreadId), { status: 201 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown";
    const status = detail === "personal_ai_handoff_source_not_found" ? 404 : 500;
    return NextResponse.json({ ok: false, error: "personal_ai_handoff_failed", detail }, { status });
  }
}
