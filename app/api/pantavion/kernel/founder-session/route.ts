import { NextResponse } from "next/server";

import {
  isPantavionKernelFounderIdentityAllowed,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

const RECOVERY_PATH = "/admin/pantavion/recovery";
const VERIFY_PATH = "/owner/safety/verify";

export async function GET(request: Request) {
  const founderAllowed = await isPantavionKernelFounderIdentityAllowed();

  if (!founderAllowed) {
    const verifyUrl = new URL(VERIFY_PATH, request.url);
    verifyUrl.searchParams.set("next", "/api/pantavion/kernel/founder-session");
    return NextResponse.redirect(verifyUrl, 303);
  }

  const sessionSecret = process.env.PANTAVION_KERNEL_PANEL_TOKEN?.trim() ?? "";
  if (sessionSecret.length < 12) {
    return NextResponse.json(
      {
        ok: false,
        error: "founder_session_unavailable",
        message: "Founder identity is verified, but the internal founder session boundary is not configured.",
      },
      { status: 503 },
    );
  }

  const response = NextResponse.redirect(new URL(RECOVERY_PATH, request.url), 303);
  response.cookies.set(PANTAVION_KERNEL_SESSION_COOKIE, sessionSecret, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/admin/pantavion",
    maxAge: 60 * 60 * 8,
  });
  return response;
}
