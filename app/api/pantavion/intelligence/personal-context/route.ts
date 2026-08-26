import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  compilePersonalContext,
  routePersonalContextToAgent,
  type PersonalContextAgentKind,
  type PersonalContextInput,
} from "@/core/intelligence/personal-context-layer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireFounder() {
  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.getUser();
  if (error || !auth.user) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "authentication_required" }, { status: 401 }) };
  }

  const founderUserId = process.env.PANTAVION_FOUNDER_USER_ID?.trim();
  if (!founderUserId || auth.user.id !== founderUserId) {
    return { ok: false as const, response: NextResponse.json({ ok: false, error: "founder_only" }, { status: 403 }) };
  }

  return { ok: true as const, userId: auth.user.id };
}

export async function GET() {
  const owner = await requireFounder();
  if (!owner.ok) return owner.response;

  return NextResponse.json({
    ok: true,
    service: "pantavion-personal-context-layer",
    access: "founder-only",
    ownerAuthority: "exclusive",
    agentAuthority: "temporary-scoped-read-only",
    transferable: false,
  });
}

export async function POST(request: NextRequest) {
  const owner = await requireFounder();
  if (!owner.ok) return owner.response;

  try {
    const body = (await request.json()) as {
      input?: PersonalContextInput;
      requestedAgent?: PersonalContextAgentKind;
    };

    if (!body?.input) {
      return NextResponse.json({ ok: false, error: "input_required" }, { status: 400 });
    }

    if (body.input.userId !== owner.userId) {
      return NextResponse.json({ ok: false, error: "personal_context_owner_mismatch" }, { status: 403 });
    }

    const compiled = compilePersonalContext(body.input);
    const route = body.requestedAgent
      ? routePersonalContextToAgent(compiled, body.requestedAgent)
      : null;

    return NextResponse.json({
      ok: true,
      access: "founder-only",
      compiled,
      route,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "invalid_request" },
      { status: 400 },
    );
  }
}
