import { NextResponse } from "next/server";

import {
  createWaterAdminSessionValue,
  getWaterAdminAccessCode,
  getWaterAdminSessionSecret,
  hasDedicatedWaterAdminSessionSecret,
  hasWaterAdminSession,
  safeSecretEqual,
  WATER_ADMIN_SESSION_COOKIE,
  WATER_ADMIN_SESSION_TTL_SECONDS,
  WATER_ADMIN_SESSION_VERSION,
} from "@/core/security/water-admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminSessionBody = {
  accessCode?: string;
};

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export async function POST(request: Request) {
  try {
    const expectedAccessCode = getWaterAdminAccessCode();
    const sessionSecret = getWaterAdminSessionSecret();

    if (!expectedAccessCode || !sessionSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "admin_secret_not_configured",
          message: "Δεν έχει ρυθμιστεί σωστά το founder/admin security secret στο Vercel.",
        },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
    }

    const body = (await request.json()) as AdminSessionBody;
    const accessCode = clean(body.accessCode, 1000);

    if (!accessCode || !safeSecretEqual(accessCode, expectedAccessCode)) {
      return NextResponse.json(
        {
          ok: false,
          error: "invalid_admin_access_code",
          message: "Λάθος founder/admin access code.",
        },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    }

    const response = NextResponse.json(
      {
        ok: true,
        message: "Το founder/admin session ενεργοποιήθηκε με περιορισμένη διάρκεια.",
        redirectTo: "/professional/infrastructure/water/admin/approvals",
        session: {
          version: WATER_ADMIN_SESSION_VERSION,
          expiresInSeconds: WATER_ADMIN_SESSION_TTL_SECONDS,
          dedicatedSessionSecret: hasDedicatedWaterAdminSessionSecret(),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );

    response.cookies.set({
      name: WATER_ADMIN_SESSION_COOKIE,
      value: createWaterAdminSessionValue(sessionSecret),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: WATER_ADMIN_SESSION_TTL_SECONDS,
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_session_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  const authorized = hasWaterAdminSession(request);

  return NextResponse.json(
    {
      ok: authorized,
      authenticated: authorized,
      sessionVersion: WATER_ADMIN_SESSION_VERSION,
    },
    {
      status: authorized ? 200 : 401,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function DELETE() {
  const response = NextResponse.json(
    {
      ok: true,
      message: "Το founder/admin session έκλεισε.",
    },
    { headers: { "Cache-Control": "no-store" } },
  );

  response.cookies.set({
    name: WATER_ADMIN_SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  for (const legacyCookie of [
    "pantavion_water_founder_code",
    "waterFounderCode",
    "waterFounderCodeClean",
  ]) {
    response.cookies.set({
      name: legacyCookie,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0,
    });
  }

  return response;
}
