import { NextRequest, NextResponse } from "next/server";
import { classifyPantavionInput } from "@/core/pantavion-kernel-intake";
import { pantavionSignalSeeds } from "@/core/pantavion-signal-seeds";

export async function GET() {
  return NextResponse.json({
    ok: true,
    totalSeeds: pantavionSignalSeeds.length,
    seeds: pantavionSignalSeeds
  });
}

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

    const result = classifyPantavionInput(input);

    return NextResponse.json({
      ok: true,
      result
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
