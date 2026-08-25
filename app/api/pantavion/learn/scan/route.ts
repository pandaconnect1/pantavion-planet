import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { executePantavionScanToLearn } from "@/core/learning/scan-to-learn-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) {
    return NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  const learnerRequest = typeof body.learnerRequest === "string" ? body.learnerRequest.trim() : "";
  if (!learnerRequest && attachments.length === 0) {
    return NextResponse.json({ ok: false, error: "learning_input_required" }, { status: 400 });
  }

  try {
    const result = await executePantavionScanToLearn(supabase, auth.user.id, {
      learnerRequest,
      source: body.source,
      countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
      gradeCode: typeof body.gradeCode === "string" ? body.gradeCode : undefined,
      subjectCode: typeof body.subjectCode === "string" ? body.subjectCode : undefined,
      curriculumCoverage: body.curriculumCoverage,
      originalLanguage: typeof body.originalLanguage === "string" ? body.originalLanguage : null,
      threadId: typeof body.threadId === "string" ? body.threadId : null,
      attachments,
    });

    return NextResponse.json(result, { status: result.executionStatus === "blocked" ? 503 : 200 });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "scan_to_learn_failed";
    const clientError = detail.includes("invalid") || detail.includes("required") || detail.includes("attachment") || detail.includes("not_found");
    return NextResponse.json({ ok: false, error: "scan_to_learn_failed", detail }, { status: clientError ? 400 : 500 });
  }
}
