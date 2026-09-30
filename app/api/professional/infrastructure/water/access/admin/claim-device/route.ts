import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { approveWaterDeviceViaBridge } from "@/core/water/water-db-bridge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  if (!(await hasWaterAdminAuthorization(request))) {
    return NextResponse.json(
      { ok: false, error: "founder_or_admin_required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    deviceId?: string;
    deviceToken?: string;
  };

  const deviceId = clean(body.deviceId, 300);
  const deviceToken = clean(body.deviceToken, 1000);

  if (!deviceId || !deviceToken) {
    return NextResponse.json(
      { ok: false, error: "device_claim_missing" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await approveWaterDeviceViaBridge({
      deviceId,
      tokenHash: createHash("sha256").update(deviceToken).digest("hex"),
      approvedBy: "founder-admin-session",
    });

    return NextResponse.json(result, {
      status: result.ok ? 200 : 400,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "admin_device_claim_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
