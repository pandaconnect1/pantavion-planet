import { NextResponse } from "next/server";
import { getPantavionCloudCronStatus } from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getPantavionCloudCronStatus());
}

