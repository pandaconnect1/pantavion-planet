import { NextResponse } from "next/server";

import { getPantavionDeploymentRevision } from "@/core/runtime/pantavion-deployment-revision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const deployment = getPantavionDeploymentRevision();

  return NextResponse.json(
    {
      ok: Boolean(deployment.revision),
      ...deployment,
    },
    {
      status: deployment.revision ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Pantavion-Runtime-Provider": deployment.provider,
      },
    },
  );
}
