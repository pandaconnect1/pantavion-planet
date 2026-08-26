import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  compilePersonalContext,
  routePersonalContextToAgent,
  type PersonalContextAgentKind,
  type PersonalContextInput,
} from "@/core/intelligence/personal-context-layer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isOwnerAuthorized(request: NextRequest) {
  const configuredSecret = process.env.PANTAVION_OWNER_PERSONAL_CONTEXT_KEY;
  if (!configuredSecret) return false;

  const authorization = request.headers.get("authorization") ?? "";
  const prefix = "Bearer ";
  if (!authorization.startsWith(prefix)) return false;

  const providedSecret = authorization.slice(prefix.length);
  const configured = Buffer.from(configuredSecret);
  const provided = Buffer.from(providedSecret);

  return configured.length === provided.length && timingSafeEqual(configured, provided);
}

function ownerOnlyResponse() {
  return NextResponse.json(
    { ok: false, error: "owner_authorization_required" },
    { status: 401 },
  );
}

export async function GET(request: NextRequest) {
  if (!isOwnerAuthorized(request)) return ownerOnlyResponse();

  return NextResponse.json({
    ok: true,
    service: "pantavion-personal-context-layer",
    access: "owner-only",
    mode: "consent-scoped",
    persistence: "owner-controlled",
    agentAuthority: "temporary-scoped-context-only",
  });
}

export async function POST(request: NextRequest) {
  if (!isOwnerAuthorized(request)) return ownerOnlyResponse();

  try {
    const body = (await request.json()) as {
      input?: PersonalContextInput;
      requestedAgent?: PersonalContextAgentKind;
    };

    if (!body?.input) {
      return NextResponse.json(
        { ok: false, error: "input_required" },
        { status: 400 },
      );
    }

    const compiled = compilePersonalContext(body.input);
    const route = body.requestedAgent
      ? routePersonalContextToAgent(compiled, body.requestedAgent)
      : null;

    return NextResponse.json({
      ok: true,
      access: "owner-only",
      compiled,
      route,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "invalid_request",
      },
      { status: 400 },
    );
  }
}
