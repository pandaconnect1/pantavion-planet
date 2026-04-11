import { NextRequest, NextResponse } from "next/server";
import { completeKernel } from "../../../../src/kernel/executor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const input =
      typeof body?.input === "string"
        ? body.input
        : typeof body?.text === "string"
          ? body.text
          : "";

    const scope =
      typeof body?.scope === "string" && body.scope.trim()
        ? body.scope.trim()
        : "global";

    const commit =
      typeof body?.commit === "boolean"
        ? body.commit
        : true;

    if (!input.trim()) {
      return NextResponse.json(
        { ok: false, error: "input is required" },
        { status: 400 },
      );
    }

    const result = await completeKernel({
      input,
      scope,
      commit,
      actor: "api/kernel/complete",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown completion error",
      },
      { status: 500 },
    );
  }
}

