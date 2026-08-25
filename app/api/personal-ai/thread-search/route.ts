import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { retrieveRelevantPersonalAIThreads } from "@/core/intelligence/personal-ai-cross-thread-retrieval";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim().slice(0, 8000) : "";
  const currentThreadId = typeof body.currentThreadId === "string" ? body.currentThreadId : null;
  if (!query) {
    return NextResponse.json({ ok: false, error: "query_required" }, { status: 400 });
  }

  try {
    const result = await retrieveRelevantPersonalAIThreads(
      supabase,
      auth.user.id,
      query,
      currentThreadId,
    );
    return NextResponse.json({ ok: true, retrieval: result });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "personal_ai_thread_search_failed";
    return NextResponse.json(
      { ok: false, error: "personal_ai_thread_search_failed", detail },
      { status: 500 },
    );
  }
}
