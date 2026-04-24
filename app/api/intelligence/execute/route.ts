import { NextResponse } from "next/server";
import { executePantavionIntent } from "@/core/intelligence/pantaai-engine";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const intent = typeof body.intent === "string" ? body.intent : "";

  const packet = executePantavionIntent(intent);

  return NextResponse.json(packet);
}
