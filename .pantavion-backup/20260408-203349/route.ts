import { NextRequest, NextResponse } from "next/server";
import { runPantavionKernelCompletion } from "../../../../core/pantavion-kernel-completion";
import { appendKernelLedger, readKernelLedger } from "../../../../core/pantavion-kernel-ledger";

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "POST /api/kernel/complete",
    ledgerCount: readKernelLedger().length,
    expectedBody: {
      text: "string",
      modality: "text | image | video | audio | document | mixed",
      source: "user | research | system",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const text =
      typeof body?.text === "string"
        ? body.text
        : typeof body?.input === "string"
        ? body.input
        : "";

    const modality =
      typeof body?.modality === "string"
        ? body.modality
        : "text";

    const source =
      typeof body?.source === "string"
        ? body.source
        : "user";

    if (!text.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing text. Send { text: string, modality?: string, source?: string }.",
        },
        { status: 400 },
      );
    }

    const result = runPantavionKernelCompletion({
      text,
      modality,
      source,
    });

    const ledgerRecord = appendKernelLedger({
      id: result.mission.id,
      createdAt: new Date().toISOString(),
      mission: result.mission,
      status: result.status,
      verifier: result.verifier,
      finalDecision: result.finalDecision,
      taskGraph: result.taskGraph,
      missing: result.missing,
      repairs: result.repairs,
    });

    return NextResponse.json({
      ...result,
      ledgerRecord,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown kernel completion error",
      },
      { status: 500 },
    );
  }
}
