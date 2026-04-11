import { NextResponse } from "next/server";
import { pantavionKernel } from "@/kernel/kernel";
import type { KernelCompleteRequest } from "@/kernel/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as KernelCompleteRequest;
  const result = pantavionKernel.complete(body);
  return NextResponse.json(result);
}
