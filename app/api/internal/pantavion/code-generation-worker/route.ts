import {
  runPantavionCodeGenerationWorker,
  type PantavionCodeGenerationMode,
} from "@/core/pantaai/autonomous-code/code-generation-worker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.PANTAVION_AUTONOMOUS_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";

  const auth = request.headers.get("authorization") ?? "";
  const headerSecret = request.headers.get("x-pantavion-autonomous-secret") ?? "";
  return auth === `Bearer ${secret}` || headerSecret === secret;
}

function readMode(url: string): PantavionCodeGenerationMode | undefined {
  const mode = new URL(url).searchParams.get("mode");
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

function readMaxModules(url: string): number | undefined {
  const value = new URL(url).searchParams.get("maxModules");
  if (!value) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const mode = readMode(request.url);

  if ((mode === "local_scaffold" || mode === "github_pr") && !isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized code generation mutation request.",
      },
      { status: 401 },
    );
  }

  const result = await runPantavionCodeGenerationWorker({
    trigger: "cron",
    mode,
    maxModules: readMaxModules(request.url),
  });

  return Response.json(result);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json(
      {
        ok: false,
        error: "Unauthorized code generation request.",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = await runPantavionCodeGenerationWorker({
    trigger: "api",
    mode: body.mode,
    maxModules: typeof body.maxModules === "number" ? body.maxModules : undefined,
  });

  return Response.json(result);
}

const pantavion_code_generation_worker_route_marker_v1 =
  "pantavion_code_generation_worker_route_c4_v1";

