import { getVercelOidcToken } from "@vercel/oidc";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_OIDC_PROBE_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-vercel-oidc-probe";

function json(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export async function GET() {
  const revision = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? null;

  try {
    const token = await getVercelOidcToken();
    if (!token) {
      return json(
        {
          ok: false,
          status: "unavailable",
          route: "/api/pantavion/intelligence/oidc-supabase-trust",
          revision,
          code: "VERCEL_OIDC_TOKEN_UNAVAILABLE",
        },
        503,
      );
    }

    const response = await fetch(SUPABASE_OIDC_PROBE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ purpose: "pantavion_secretless_trust_probe" }),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    const trusted = Boolean(response.ok && payload?.ok === true && payload?.trust === "vercel_oidc_verified");

    return json(
      {
        ok: trusted,
        status: trusted ? "verified" : "unavailable",
        route: "/api/pantavion/intelligence/oidc-supabase-trust",
        revision,
        secretless: trusted,
        privilegedDataAccess: false,
        upstreamStatus: response.status,
        trust: trusted ? "vercel_oidc_verified_by_supabase" : "unverified",
      },
      trusted ? 200 : 503,
    );
  } catch {
    return json(
      {
        ok: false,
        status: "unavailable",
        route: "/api/pantavion/intelligence/oidc-supabase-trust",
        revision,
        code: "OIDC_SUPABASE_TRUST_PROBE_FAILED",
      },
      503,
    );
  }
}
