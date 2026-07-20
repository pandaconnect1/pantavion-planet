import { NextResponse } from "next/server";

import {
  createWaterAdminSessionValue,
  getWaterAdminAccessCode,
  getWaterAdminSessionSecret,
  hasWaterAdminSession,
  safeSecretEqual,
  WATER_ADMIN_SESSION_COOKIE,
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
          message: "Δεν έχει ρυθμιστεί το founder/admin secret στο Vercel.",
        },
        { status: 500 },
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
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Το founder/admin session ενεργοποιήθηκε.",
      redirectTo: "/professional/infrastructure/water/admin/approvals",
    });

    response.cookies.set({
      name: WATER_ADMIN_SESSION_COOKIE,
      value: createWaterAdminSessionValue(sessionSecret),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "admin_session_failed",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const authorized = hasWaterAdminSession(request);

  return NextResponse.json(
    {
      ok: authorized,
      authenticated: authorized,
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
  const response = NextResponse.json({
    ok: true,
    message: "Το founder/admin session έκλεισε.",
  });

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
