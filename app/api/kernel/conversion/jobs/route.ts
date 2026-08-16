import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../../core/kernel/kernel-auth";
import {
  createConversionJob,
  listConversionJobs,
} from "../../../../../core/kernel/conversion-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: "local-conversion-api",
      authWarning: "Local development mode. Conversion job accepted without production auth.",
    };
  }

  return null;
}

export async function GET(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized conversion access." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const jobs = await listConversionJobs({ limit });

  return NextResponse.json({
    ok: true,
    actor: actor.actor,
    authWarning: actor.authWarning,
    jobs,
  });
}

export async function POST(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized conversion job." },
      { status: 401 },
    );
  }

  let body: {
    intakeRecordId?: string;
    desiredOutputExtension?: string;
    executeNow?: boolean;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  if (!body.intakeRecordId || !body.desiredOutputExtension) {
    return NextResponse.json(
      {
        ok: false,
        error: "Required fields: intakeRecordId, desiredOutputExtension.",
      },
      { status: 400 },
    );
  }

  try {
    const job = await createConversionJob({
      intakeRecordId: body.intakeRecordId,
      desiredOutputExtension: body.desiredOutputExtension,
      actor: actor.actor,
      executeNow: body.executeNow === true,
    });

    return NextResponse.json({
      ok: true,
      authWarning: actor.authWarning,
      job,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error.",
      },
      { status: 400 },
    );
  }
}
