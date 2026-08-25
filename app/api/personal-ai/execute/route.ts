import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePersonalAIMultimodal } from "@/core/intelligence/personal-ai-multimodal-runtime";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input.trim() : "";
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  if (!input && attachments.length === 0) {
    return NextResponse.json({ ok: false, error: "input_or_attachment_required" }, { status: 400 });
  }

  try {
    const result = await executePersonalAIMultimodal(supabase, auth.user.id, {
      input,
      threadId: typeof body.threadId === "string" ? body.threadId : null,
      parentThreadId: typeof body.parentThreadId === "string" ? body.parentThreadId : null,
      inputMode: body.inputMode,
      originalLanguage: typeof body.originalLanguage === "string" ? body.originalLanguage : null,
      attachments,
      metadata: body.metadata && typeof body.metadata === "object" && !Array.isArray(body.metadata) ? body.metadata : {},
    });
    return NextResponse.json(result, { status: result.executionStatus === "blocked" ? 503 : 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "personal_ai_execution_failed";
    const clientError = detail.includes("not_found") || detail.includes("invalid") || detail.includes("required") || detail.includes("disabled") || detail.includes("attachment");
    return NextResponse.json({ ok: false, error: "personal_ai_execution_failed", detail }, { status: clientError ? 400 : 500 });
  }
}
