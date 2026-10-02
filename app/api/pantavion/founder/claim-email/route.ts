import { NextResponse } from "next/server";

import {
  createPantavionFounderSessionValue,
  getPantavionFounderSessionSecret,
  PANTAVION_FOUNDER_SESSION_COOKIE,
  PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
} from "@/core/security/pantavion-founder-session";
import {
  createWaterAdminSessionValue,
  getWaterAdminSessionSecret,
  WATER_ADMIN_SESSION_COOKIE,
  WATER_ADMIN_SESSION_TTL_SECONDS,
} from "@/core/security/water-admin-session";
import { createClient } from "@/lib/supabase/server";

const FOUNDER_EMAIL = "info.pandaconnect@gmail.com";
const CANONICAL_PRODUCTION_ORIGIN = "https://pantavion.com";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function publicOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "";

  if (process.env.NODE_ENV === "production") {
    try {
      const url = new URL(configured);
      if (
        url.protocol === "https:" &&
        (url.hostname === "pantavion.com" || url.hostname === "www.pantavion.com")
      ) {
        return CANONICAL_PRODUCTION_ORIGIN;
      }
    } catch {
      // Ignore malformed/internal runtime URLs and use the canonical public origin.
    }

    return CANONICAL_PRODUCTION_ORIGIN;
  }

  return configured.replace(/\/+$/, "") || "http://localhost:3000";
}

function activationRedirect(error: string) {
  const url = new URL("/founder/activate", publicOrigin());
  url.searchParams.set("error", error);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !user ||
    !user.email_confirmed_at ||
    (user.email || "").trim().toLowerCase() !== FOUNDER_EMAIL
  ) {
    return activationRedirect("claim_failed");
  }

  const { data, error } = await supabase.rpc(
    "pantavion_claim_initial_founder_v1",
  );

  const result = Array.isArray(data) ? data[0] : data;

  if (error || !result?.ok) {
    return activationRedirect(
      String(result?.claim_status || "claim_failed"),
    );
  }

  const founderSecret = getPantavionFounderSessionSecret();
  const waterAdminSecret = getWaterAdminSessionSecret();

  if (!founderSecret || !waterAdminSecret) {
    return activationRedirect("founder_session_not_configured");
  }

  const nextPath = "/professional/infrastructure/water/admin/control";
  const resetUrl = new URL("/auth/reset-password", publicOrigin());
  resetUrl.searchParams.set("next", nextPath);

  const response = NextResponse.redirect(resetUrl);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");

  response.cookies.set({
    name: PANTAVION_FOUNDER_SESSION_COOKIE,
    value: createPantavionFounderSessionValue(founderSecret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: PANTAVION_FOUNDER_SESSION_TTL_SECONDS,
  });

  response.cookies.set({
    name: WATER_ADMIN_SESSION_COOKIE,
    value: createWaterAdminSessionValue(waterAdminSecret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: WATER_ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}
