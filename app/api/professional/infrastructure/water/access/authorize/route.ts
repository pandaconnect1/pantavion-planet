import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { waterApprovedDeviceMatches } from "@/core/water/water-access-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WaterAccessAuthorizeBody = {
  emailOrPhone?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  deviceId?: string;
  deviceToken?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, x-pantavion-water-device-id");

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export async function POST(request: Request) {
  let body: WaterAccessAuthorizeBody;

  try {
    body = (await request.json()) as WaterAccessAuthorizeBody;
  } catch {
    return noStoreJson(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const isAdminSession = hasWaterAdminSession(request);
  const deviceId = clean(body.deviceId);
  const deviceToken = clean(body.deviceToken);

  if (isAdminSession) {
    return noStoreJson({
      ok: true,
      approved: true,
      accessMode: "admin-session",
      approvedAt: new Date().toISOString(),
      holder: {
        firstName: clean(body.firstName),
        lastName: clean(body.lastName),
        title: clean(body.title),
        phone: "",
        deviceId,
      },
    });
  }

  try {
    const approvedDevice = await waterApprovedDeviceMatches(
      deviceId,
      hashToken(deviceToken),
    );

    if (!approvedDevice) {
      return noStoreJson(
        { ok: false, error: "access_not_approved" },
        { status: 403 },
      );
    }

    return noStoreJson({
      ok: true,
      approved: true,
      accessMode: "approved-device",
      approvedAt: approvedDevice.approved_at,
      holder: {
        firstName: approvedDevice.first_name,
        lastName: approvedDevice.last_name,
        title: approvedDevice.title,
        phone: approvedDevice.phone,
        deviceId,
      },
      storage: "supabase",
    });
  } catch {
    return noStoreJson(
      { ok: false, error: "access_verification_unavailable" },
      { status: 503 },
    );
  }
}
