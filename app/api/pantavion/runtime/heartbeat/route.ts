import { NextResponse } from "next/server";
import { getPantavionRuntimeHeartbeat } from "@/core/runtime/pantavion-runtime-heartbeat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(getPantavionRuntimeHeartbeat());
}
