import { NextResponse } from "next/server";

import { createPantavionContinuityMemoryReport } from "@/core/kernel/kernel-continuity-memory";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

function readCookieToken(cookieHeader: string): string | null {
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PANTAVION_KERNEL_SESSION_COOKIE}=`));

  return sessionCookie
    ? decodeURIComponent(sessionCookie.split("=").slice(1).join("="))
    : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  const queryToken =
    url.searchParams.get(PANTAVION_KERNEL_FOUNDER_QUERY) ??
    url.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY);

  const sessionToken = readCookieToken(request.headers.get("cookie") ?? "");

  if (
    !isPantavionKernelAccessAllowed(queryToken) &&
    !isPantavionKernelAccessAllowed(sessionToken)
  ) {
    return NextResponse.json(createPantavionKernelAccessDeniedReport(), {
      status: 404,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json(createPantavionContinuityMemoryReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
