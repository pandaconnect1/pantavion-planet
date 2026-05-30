import { NextRequest, NextResponse } from "next/server";

import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token =
    request.nextUrl.searchParams.get(PANTAVION_KERNEL_FOUNDER_QUERY) ??
    request.nextUrl.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY);

  if (!isPantavionKernelAccessAllowed(token)) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  const response = NextResponse.redirect(new URL("/kernel", request.url));
  response.cookies.set(PANTAVION_KERNEL_SESSION_COOKIE, token ?? "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  return response;
}
