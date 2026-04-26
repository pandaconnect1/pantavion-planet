import { NextRequest, NextResponse } from "next/server";
import { executePantaAILocally } from "@/core/pantavion/pantai-local-executor";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/pantai/execute",
    method: "POST",
    body: {
      input: "Build Pantavion live backend core",
    },
    provider: "pantavion_local_kernel_v1",
    externalProviderUsed: false,
  });
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const input =
    typeof body === "object" &&
    body !== null &&
    "input" in body &&
    typeof (body as { input?: unknown }).input === "string"
      ? (body as { input: string }).input
      : "";

  if (!input.trim()) {
    return NextResponse.json({ ok: false, error: "input_required" }, { status: 400 });
  }

  return NextResponse.json(executePantaAILocally(input));
}
