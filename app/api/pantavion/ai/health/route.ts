import { NextResponse } from "next/server";
import { getOwnedInferenceConfig } from "@/core/ai/pantavion-owned-inference";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const config = process.env.PANTAVION_OWNED_AI_ENABLED === "true"
    ? getOwnedInferenceConfig()
    : null;
  if (!config) {
    return NextResponse.json(
      { ok: false, provider: "pantavion-owned-inference", ready: false, reason: "private_model_not_enabled" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  try {
    const response = await fetch(new URL("/health", config.endpoint), {
      headers: { Authorization: `Bearer ${config.bearerToken}` },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5000),
    });
    if (response.ok) {
      return NextResponse.json(
        { ok: true, provider: "pantavion-owned-inference", ready: true, model: config.model },
        { headers: { "Cache-Control": "no-store" } },
      );
    }
  } catch {
    // No upstream host, credentials or internal diagnostics in public output.
  }
  return NextResponse.json(
    { ok: false, provider: "pantavion-owned-inference", ready: false, reason: "private_model_unavailable" },
    { status: 503, headers: { "Cache-Control": "no-store" } },
  );
}
