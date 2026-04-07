import { NextResponse } from "next/server";
import { pantavionSignalSeeds } from "@/core/pantavion-signal-seeds";

export async function GET() {
  return NextResponse.json({
    ok: true,
    total: pantavionSignalSeeds.length,
    items: pantavionSignalSeeds,
  });
}
