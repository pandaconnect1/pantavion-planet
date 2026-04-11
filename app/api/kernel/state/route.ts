import { NextResponse } from "next/server";
import { readKernelState } from "../../../../core/kernel-store";
import { KERNEL_CONSTITUTION } from "../../../../core/kernel-constitution";
import { KERNEL_CAPABILITIES } from "../../../../core/kernel-capabilities";

export async function GET() {
  try {
    const state = await readKernelState();

    return NextResponse.json({
      ok: true,
      constitution: KERNEL_CONSTITUTION,
      capabilities: KERNEL_CAPABILITIES,
      state
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown kernel state error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
