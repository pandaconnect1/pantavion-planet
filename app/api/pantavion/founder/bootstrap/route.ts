import { createHash } from "crypto";

import { NextResponse } from "next/server";

import {
  createPantavionFounderSessionValue,
  getPantavionFounderSessionSecret,
  PANTAVION_FOUNDER_SESSION_COOKIE,
  PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
} from "@/core/security/pantavion-founder-session";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BootstrapBody = {
  token?: string;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: Request) {
  const secret = getPantavionFounderSessionSecret();

  if (!secret) {
    return json(
      {
        ok: false,
        error: "founder_session_secret_not_configured",
      },
      503,
    );
  }

  let body: BootstrapBody;
  try {
    body = (await request.json()) as BootstrapBody;
  } catch {
    return json({ ok: false, error: "invalid_request" }, 400);
  }

  const token = clean(body.token, 240);
  if (!token) {
    return json({ ok: false, error: "missing_bootstrap_token" }, 400);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc(
      "pantavion_claim_founder_bootstrap_invite",
      {
        p_token_hash: sha256(token),
      },
    );

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.ok) {
      return json(
        {
          ok: false,
          error: String(result?.claim_status || "invalid_or_expired"),
        },
        403,
      );
    }

    const response = json({
      ok: true,
      redirectTo: "/professional/infrastructure/water/admin/control",
    });

    response.cookies.set({
      name: PANTAVION_FOUNDER_SESSION_COOKIE,
      value: createPantavionFounderSessionValue(secret),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
    });

    return response;
  } catch {
    return json({ ok: false, error: "founder_bootstrap_unavailable" }, 503);
  }
}
