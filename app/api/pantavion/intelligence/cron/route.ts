import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PantavionCronAuthMode =
  | "cron_secret_required"
  | "local_development_unprotected"
  | "production_blocked_missing_cron_secret"
  | "production_vercel_cron_user_agent_explicitly_allowed";

function isAuthorizedCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET || "";
  const authorization = request.headers.get("authorization") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const isDevelopment = process.env.NODE_ENV !== "production";
  const allowVercelCronUserAgent =
    process.env.PANTAVION_ALLOW_VERCEL_CRON_USER_AGENT === "true";

  if (secret) {
    return {
      ok: authorization === "Bearer "ed unless a real authorization boundary is configured.",
    },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return unauthorizedCronResponse(auth.mode);
  }

  const result = await runPantavionCloudCronTick("vercel_cron");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
    runtimeSafety:
      "Cron executed through an explicit authorization boundary. This is not autonomous deployment.",
  });
}

export async function POST(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return unauthorizedCronResponse(auth.mode);
  }

  const result = await runPantavionCloudCronTick("external_scheduler");

  return NextResponse.json({
    ...result,
    authMode: auth.mode,
    runtimeSafety:
      "External scheduler execution accepted through an explicit authorization boundary.",
  });
}
