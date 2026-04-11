import { NextRequest, NextResponse } from "next/server";
import { analyzeKernelInput, getKernelState } from "../../../../src/kernel/executor";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const input =
      typeof body?.input === "string"
        ? body.input
        : typeof body?.text === "string"
          ? body.text
          : "";

    if (!input.trim()) {
      return NextResponse.json(
        { ok: false, error: "input is required" },
        { status: 400 },
      );
    }

    const analysis = await analyzeKernelInput(input);
    const state = await getKernelState();

    return NextResponse.json({
      ok: true,
      analysis,
      state: {
        memoryCount: Object.keys(state.memory).length,
        registryCount: Object.keys(state.registry).length,
        planCount: state.plans.length,
        runCount: state.runs.length,
        eventCount: state.eventCount,
        lastUpdatedAt: state.lastUpdatedAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown analyze error",
      },
      { status: 500 },
    );
  }
}

