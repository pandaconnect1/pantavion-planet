import { NextResponse } from "next/server";

import { pantavionAuthRuntimeReady } from "@/lib/pantavion-auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ready = pantavionAuthRuntimeReady();

  return NextResponse.json(
    {
      marker: "pantavion_owned_auth_readiness_v1",
      ready,
      databaseConfigured: Boolean(
        process.env.PANTAVION_AUTH_DATABASE_URL?.trim(),
      ),
      secretConfigured: Boolean(process.env.PANTAVION_AUTH_SECRET?.trim()),
      emailProviderConfigured: Boolean(
        process.env.PANTAVION_AUTH_EMAIL_API_KEY?.trim() &&
          process.env.PANTAVION_AUTH_FROM_EMAIL?.trim(),
      ),
    },
    {
      status: ready ? 200 : 503,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
