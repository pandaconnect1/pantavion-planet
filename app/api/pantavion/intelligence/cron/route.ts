import { NextResponse } from "next/server";
import { runPantavionCloudCronTick } from "@/core/intelligence/pantavion-intelligence-ledger";
import { runPantavionFoundryTick } from "@/core/kernel/pantavion-foundry-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PantavionCronAuthMode =
  | "cron_secret_required"
  | "local_development_unprotected"
  | "production_blocked_missing_cron_secret"
  | "production_vercel_cron_user_agent_explicitly_allowed";

type PantavionCronAuthResult = {
  ok: boolean;
  mode: PantavionCronAuthMode;
};

function isAuthorizedCronRequest(request: Request): PantavionCronAuthResult {
  const secret = process.env.CRON_SECRET || "";
  const authorization = request.headers.get("authorization") || "";
  const userAgent = request.headers.get("user-agent") || "";
  const isDevelopment = process.env.NODE_ENV !== "production";
  const allowVercelCronUserAgent =
    process.env.PANTAVION_ALLOW_VERCEL_CRON_USER_AGENT === "true";

  if (secret) {
    return {
      ok: authorization === "Bearer " + secret,
      mode: "cron_secret_required",
    };
  }

  if (isDevelopment) {
    return {
      ok: true,
      mode: "local_development_unprotected",
    };
  }

  if (allowVercelCronUserAgent && userAgent.includes("vercel-cron/1.0")) {
    return {
      ok: true,
      mode: "production_vercel_cron_user_agent_explicitly_allowed",
    };
  }

  return {
    ok: false,
    mode: "production_blocked_missing_cron_secret",
  };
}

function unauthorizedCronResponse(mode: PantavionCronAuthMode) {
  return NextResponse.json(
    {
      ok: false,
      route: "/api/pantavion/intelligence/cron",
      error:
        "Unauthorized cron request. Configure CRON_SECRET or explicitly allow the Vercel cron user-agent boundary.",
      mode,
      runtimeSafety:
        "Production cron execution is blocked unless a real authorization boundary is configured.",
    },
    { status: 401 },
  );
}

export async function GET(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return unauthorizedCronResponse(auth.mode);
  }

  const [result, foundry] = await Promise.all([
    runPantavionCloudCronTick("vercel_cron"),
    runPantavionFoundryTick(),
  ]);

  return NextResponse.json({
    ...result,
    foundry,
    authMode: auth.mode,
    runtimeSafety:
      "Cron executed through an explicit authorization boundary. Foundry runs only Pantavion-owned internal agents when its durable queue and internal runtime are configured; this is not autonomous deployment.",
  });
}

export async function POST(request: Request) {
  const auth = isAuthorizedCronRequest(request);

  if (!auth.ok) {
    return unauthorizedCronResponse(auth.mode);
  }

  const [result, foundry] = await Promise.all([
    runPantavionCloudCronTick("external_scheduler"),
    runPantavionFoundryTick(),
  ]);

  return NextResponse.json({
    ...result,
    foundry,
    authMode: auth.mode,
    runtimeSafety:
      "Scheduler execution accepted through an explicit authorization boundary. Foundry does not authorize merge, deploy, or external workers.",
  });
}
