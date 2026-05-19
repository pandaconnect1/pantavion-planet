import { createHash } from "crypto";

import { put } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterAccessRequestBody = {
  firstName?: string;
  lastName?: string;
  title?: string;
  organization?: string;
  emailOrPhone?: string;
  reason?: string;
  deviceId?: string;
  deviceToken?: string;
  deviceLabel?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function normalizePhone(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s().-]/g, "");
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterAccessRequestBody;
    const deviceId = clean(body.deviceId).slice(0, 120);
    const deviceToken = clean(body.deviceToken);

    const payload = {
      id: `water-access-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title: clean(body.title),
      organization: clean(body.organization),
      emailOrPhone: normalizePhone(body.emailOrPhone),
      reason: clean(body.reason),
      status: "pending_founder_review",
      createdAt: new Date().toISOString(),
      source: "pantavion-water-live-access-request",
      device: {
        id: deviceId,
        tokenHash: deviceToken ? hashToken(deviceToken) : "",
        label: clean(body.deviceLabel).slice(0, 220),
        requestedAt: new Date().toISOString(),
        userAgent: clean(request.headers.get("user-agent")).slice(0, 300),
      },
    };

    if (!payload.firstName || !payload.lastName || !payload.title || !payload.emailOrPhone) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_required_fields",
        },
        { status: 400 },
      );
    }

    if (!payload.device.id || !payload.device.tokenHash) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_device_claim",
        },
        { status: 400 },
      );
    }

    await put(
      `water/private/access-requests/${payload.id}.json`,
      JSON.stringify(payload, null, 2),
      {
        access: "private",
        allowOverwrite: false,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      requestId: payload.id,
      status: payload.status,
      deviceBound: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "request_failed",
      },
      { status: 500 },
    );
  }
}