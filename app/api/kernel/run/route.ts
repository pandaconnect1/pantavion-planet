import { NextRequest, NextResponse } from "next/server";
import { executeKernel } from "../../../../core/kernel-orchestrator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = String(body?.input ?? "").trim();

    if (!input) {
      return NextResponse.json(
        { ok: false, error: "Missing input" },
        { status: 400 }
      );
    }

    const result = await executeKernel(input);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown kernel run error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
