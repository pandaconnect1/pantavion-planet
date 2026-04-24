import { NextResponse } from "next/server";
import {
  executePantaAIAction,
  getPantaAIActions,
  type PantaAIExecuteInput,
} from "../../../../core/intelligence/panta-ai-capability-router";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "panta-ai-real-execution-v1",
    actions: getPantaAIActions(),
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<PantaAIExecuteInput>;

    const packet = executePantaAIAction({
      action: typeof body.action === "string" ? body.action : undefined,
      task: typeof body.task === "string" ? body.task : undefined,
      userText: typeof body.userText === "string" ? body.userText : undefined,
      locale: typeof body.locale === "string" ? body.locale : "en",
      userId: typeof body.userId === "string" ? body.userId : undefined,
      context: body.context && typeof body.context === "object" ? body.context : {},
    });

    return NextResponse.json({
      ok: true,
      packet,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown PantaAI execution error",
      },
      { status: 500 },
    );
  }
}
