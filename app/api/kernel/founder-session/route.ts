import { NextRequest, NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

function readFounderToken(request: NextRequest): string | null {
  return (
    request.nextUrl.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY) ??
    request.nextUrl.searchParams.get(PANTAVION_KERNEL_FOUNDER_QUERY) ??
    request.headers.get("x-pantavion-kernel-token") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    null
  );
}

export async function GET(request: NextRequest) {
  const token = readFounderToken(request);

  if (!isPantavionKernelAccessAllowed(token)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(token), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const response = NextResponse.redirect(new URL("/kernel", request.url));

  response.cookies.set(PANTAVION_KERNEL_SESSION_COOKIE, token ?? "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 6,
  });

  return response;
}
