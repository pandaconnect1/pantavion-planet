import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePersonalAI } from "@/core/intelligence/personal-ai-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input.trim() : "";
  if (!input) {
    return NextResponse.json({ ok: false, error: "input_required" }, { status: 400 });
  }

  try {
    const result = await executePersonalAI(supabase, auth.user.id, {
      input,
      threadId: typeof body.threadId === "string" ? body.threadId : null,
      parentThreadId: typeof body.parentThreadId === "string" ? body.parentThreadId : null,
      inputMode: body.inputMode,
      originalLanguage: typeof body.originalLanguage === "string" ? body.originalLanguage : null,
      attachments: Array.isArray(body.attachments) ? body.attachments : [],
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {},
    });
    return NextResponse.json(result, { status: result.executionStatus === "blocked" ? 503 : 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "personal_ai_execution_failed";
    const status = detail.includes("not_found") || detail.includes("invalid") || detail.includes("required") || detail.includes("disabled") ? 400 : 500;
    return NextResponse.json({ ok: false, error: "personal_ai_execution_failed", detail }, { status });
  }
}
