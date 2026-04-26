import { NextResponse } from "next/server";
import { buildKernelStatus } from "../../../../core/pantavion/live-backend-contract";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(buildKernelStatus());
}
