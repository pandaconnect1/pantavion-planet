import { NextRequest, NextResponse } from "next/server";
import {
  compilePersonalContext,
  routePersonalContextToAgent,
  type PersonalContextAgentKind,
  type PersonalContextInput,
} from "@/core/intelligence/personal-context-layer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "pantavion-personal-context-layer",
    mode: "consent-scoped",
    persistence: "caller-controlled",
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      input?: PersonalContextInput;
      requestedAgent?: PersonalContextAgentKind;
    };

    if (!body?.input) {
      return NextResponse.json(
        { ok: false, error: "input_required" },
        { status: 400 },
      );
    }

    const compiled = compilePersonalContext(body.input);
    const route = body.requestedAgent
      ? routePersonalContextToAgent(compiled, body.requestedAgent)
      : null;

    return NextResponse.json({
      ok: true,
      compiled,
      route,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "invalid_request",
      },
      { status: 400 },
    );
  }
}
