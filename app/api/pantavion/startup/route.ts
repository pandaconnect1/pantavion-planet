import { NextResponse } from "next/server";
import {
  createStartupExecutionPacket,
  PANTAVION_STARTUP_STAGES,
  type StartupIntake,
} from "../../../../core/startup/pantavion-startup-engine";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    title: "Pantavion Startup",
    truthMode: "evidence-first",
    stageCount: PANTAVION_STARTUP_STAGES.length,
    stages: PANTAVION_STARTUP_STAGES,
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StartupIntake;
  const packet = createStartupExecutionPacket(body);

  return NextResponse.json({
    ok: true,
    packet,
  });
}
