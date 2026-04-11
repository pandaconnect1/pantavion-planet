import { NextResponse } from "next/server";
import { getKernelState } from "../../../src/kernel/executor";

export async function GET() {
  try {
    const state = await getKernelState();

    return NextResponse.json({
      ok: true,
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
        error: error instanceof Error ? error.message : "Unknown kernel route error",
      },
      { status: 500 },
    );
  }
}
