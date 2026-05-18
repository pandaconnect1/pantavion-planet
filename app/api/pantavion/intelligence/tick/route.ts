import { NextResponse } from "next/server";
import { runPantavionIntelligenceTick } from "@/core/intelligence/pantavion-sovereign-intelligence-fabric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(runPantavionIntelligenceTick());
}

export async function POST() {
  return NextResponse.json(runPantavionIntelligenceTick());
}

