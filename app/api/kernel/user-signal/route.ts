import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../core/kernel/kernel-auth";
import {
  createUserSignal,
  listUserSignals,
} from "../../../../core/kernel/user-signal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      actor: auth.actor,
      authWarning: auth.warning,
      source: "admin" as const,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      actor: "local-user",
      authWarning: "Local development mode. User signal accepted without production auth.",
      source: "user" as const,
    };
  }

  return null;
}

export async function GET(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized user signal access." },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "50");
  const signals = await listUserSignals({ limit });

  return NextResponse.json({
    ok: true,
    actor: actor.actor,
    authWarning: actor.authWarning,
    signals,
  });
}

export async function POST(request: Request) {
  const actor = resolveActor(request);

  if (!actor) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized user signal submission." },
      { status: 401 },
    );
  }

  let body: { text?: string; signal?: string; source?: string } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const text = body.text ?? body.signal ?? "";

  try {
    const signal = await createUserSignal({
      text,
      actor: actor.actor,
      source: actor.source,
    });

    return NextResponse.json({
      ok: true,
      authWarning: actor.authWarning,
      signal,
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
