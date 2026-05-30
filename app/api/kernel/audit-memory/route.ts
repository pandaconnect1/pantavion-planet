import { NextResponse } from "next/server";

import { createPantavionKernelAuditMemoryReport } from "@/core/kernel/kernel-audit-memory";
import {
  createPantavionKernelAccessDeniedReport,
  isPantavionKernelAccessAllowed,
  PANTAVION_KERNEL_ACCESS_QUERY,
  PANTAVION_KERNEL_FOUNDER_QUERY,
  PANTAVION_KERNEL_SESSION_COOKIE,
} from "@/core/kernel/kernel-access-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const queryToken =
    url.searchParams.get(PANTAVION_KERNEL_FOUNDER_QUERY) ??
    url.searchParams.get(PANTAVION_KERNEL_ACCESS_QUERY);

  const cookieHeader = request.headers.get("cookie") ?? "";
  const sessionCookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PANTAVION_KERNEL_SESSION_COOKIE}=`));

  const sessionToken = sessionCookie
    ? decodeURIComponent(sessionCookie.split("=").slice(1).join("="))
    : null;

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

  return NextResponse.json(createPantavionKernelAuditMemoryReport(), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
