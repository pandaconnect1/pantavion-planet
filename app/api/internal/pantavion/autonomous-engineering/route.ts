import { runAutonomousEngineeringKernel } from "@/core/kernel/autonomous-engineering-kernel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getWriteModeFromUrl(url: string) {
  const parsed = new URL(url);
  const mode = parsed.searchParams.get("mode");

  if (
    mode === "observe" ||
    mode === "draft" ||
    mode === "local_scaffold" ||
    mode === "github_pr"
  ) {
    return mode;
  }

  return undefined;
}

function isAuthorized(request: Request) {
  const secret = process.env.PANTAVION_AUTONOMOUS_SECRET;
  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-pantavion-autonomous-secret") ?? "";

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  return auth === `Bearer ${secret}` || headerSecret === secret;
}

export async function GET(request: Request) {
  const writeMode = getWriteModeFromUrl(request.url);

  if ((writeMode === "local_scaffold" || writeMode === "github_pr") && !isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized autonomous mutation request.",
      },
      { status: 401 }
    );
  }

  const result = await runAutonomousEngineeringKernel({
    trigger: "cron",
    writeMode,
    maxJobs: 3,
  });

  return Response.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized autonomous engineering request.",
      },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = await runAutonomousEngineeringKernel({
    trigger: "api",
    writeMode: body.writeMode,
    maxJobs: typeof body.maxJobs === "number" ? body.maxJobs : 3,
  });

  return Response.json(result);
}

const pantavion_autonomous_engineering_route_marker_v1 =
  "pantavion_autonomous_engineering_route_c1_v1";

