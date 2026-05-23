import { createHash, timingSafeEqual } from "crypto";

import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_COOKIE = "pantavion_water_admin_session";

type AdminSessionBody = {
  accessCode?: string;
};

function clean(value: unknown, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function sessionValue(secret: string) {
  return createHash("sha256").update(`pantavion-water-admin-session-v1:${secret}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;

  return timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  try {
    const expectedSecret = clean(process.env.PANTAVION_WATER_ADMIN_SESSION_SECRET, 1000);

    if (!expectedSecret) {
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

    if (!accessCode || !safeEqual(accessCode, expectedSecret)) {
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
      redirectTo: "/professional/infrastructure/water/admin/faults",
    });

    response.cookies.set({
      name: SESSION_COOKIE,
      value: sessionValue(expectedSecret),
      httpOnly: true,
      secure: true,
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

export async function DELETE() {
  const response = NextResponse.json({
    ok: true,
    message: "Το founder/admin session έκλεισε.",
  });

  response.cookies.set({
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
