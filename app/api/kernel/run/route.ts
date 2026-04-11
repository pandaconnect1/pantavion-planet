import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";
import type { KernelRunRequest } from "@/kernel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as KernelRunRequest;
  const result = pantavionKernel.run(body);
  return NextResponse.json(result);
}
