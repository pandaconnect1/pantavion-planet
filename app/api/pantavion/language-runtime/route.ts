import { NextResponse } from "next/server";
import { getPantavionLanguageRuntimeSnapshot } from "@/core/translation/pantavion-language-provider-runtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  const snapshot = await getPantavionLanguageRuntimeSnapshot();
  return NextResponse.json(snapshot, {
    status: snapshot.overallOperational ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
