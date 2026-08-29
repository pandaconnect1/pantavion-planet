import { NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelFounderRequestAllowed,
} from "@/core/kernel/kernel-access-guard";
import {
  listPantavionFounderCanonicalStates,
  listPantavionFounderExecutionIntents,
} from "@/core/kernel/pantavion-founder-canonical-state-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function denied() {
  return noStore(
    NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
    }),
  );
}

export async function GET(request: Request) {
  if (!(await isPantavionKernelFounderRequestAllowed(request))) return denied();

  try {
    const [states, executionIntents] = await Promise.all([
      listPantavionFounderCanonicalStates(10),
      listPantavionFounderExecutionIntents(250),
    ]);

    return noStore(
      NextResponse.json({
        ok: true,
        marker: "pantavion_founder_canonical_state_operational_v1",
        visibility: "founder_internal_only",
        states,
        executionIntents,
        checkedAt: new Date().toISOString(),
      }),
    );
  } catch {
    return noStore(
      NextResponse.json(
        {
          ok: false,
          marker: "pantavion_founder_canonical_state_unavailable_v1",
          status: "blocked",
        },
        { status: 503 },
      ),
    );
  }
}
