import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return {
      ok: true,
      mode: "unprotected_until_cron_secret_is_configured",
    };
  }

  const authorization = request.headers.get("authorization") || "";

  return {
    ok: authorization === "Bearer " + secret,
    mode: "cron_secret_required",
  };
}

export async function GET(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/cron",
        error: "Unauthorized cron request.",
        mode: auth.mode,
      },
      { status: 401 },
    );
  }

  const result = await runPantavionCloudCronTick("vercel_cron");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
  });
}

export async function POST(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        route: "/api/pantavion/intelligence/cron",
        error: "Unauthorized cron request.",
        mode: auth.mode,
      },
      { status: 401 },
    );
  }

  const result = await runPantavionCloudCronTick("external_scheduler");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
  });
}