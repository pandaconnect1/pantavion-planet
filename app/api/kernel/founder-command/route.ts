import { NextResponse } from "next/server";
import { verifyKernelRequest } from "../../../../core/kernel/kernel-auth";
import {
  createFounderCommand,
  listFounderCommands,
} from "../../../../core/kernel/founder-command";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveActor(request: Request) {
  const auth = verifyKernelRequest(request);

  if (auth.ok) {
    return {
      ok: true as const,
      actor: auth.actor,
      warning: auth.warning,
    };
  }

  return {
    ok: false as const,
    statusCode: auth.statusCode,
    error: auth.error,
  };
}

export async function GET(request: Request) {
  const actor = resolveActor(request);

  if (!actor.ok) {
    return NextResponse.json(
      { ok: false, error: actor.error },
      { status: actor.statusCode },
    );
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const commands = await listFounderCommands({ limit });

  return NextResponse.json({
    ok: true,
    actor: actor.actor,
    authWarning: actor.warning,
    commands,
  });
}

export async function POST(request: Request) {
  const actor = resolveActor(request);

  if (!actor.ok) {
    return NextResponse.json(
      { ok: false, error: actor.error },
      { status: actor.statusCode },
    );
  }

  let body: { commandText?: string; command?: string; useAI?: boolean } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const commandText = body.commandText ?? body.command ?? "";

  try {
    const record = await createFounderCommand({
      commandText,
      actor: actor.actor,
      source: "api",
      useAI: Boolean(body.useAI),
    });

    return NextResponse.json({
      ok: true,
      authWarning: actor.warning,
      command: record,
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
