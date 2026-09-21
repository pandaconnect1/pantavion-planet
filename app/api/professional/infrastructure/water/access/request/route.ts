import { createHash } from "crypto";

import { NextResponse } from "next/server";

import {
  getWaterAccessRequestByDevice,
  upsertWaterAccessRequest,
} from "@/core/water/water-access-store";

type WaterAccessRequestBody = {
  firstName?: string;
  lastName?: string;
  title?: string;
  organization?: string;
  emailOrPhone?: string;
  reason?: string;
  phone?: string;
  roleTitle?: string;
  deviceId?: string;
  deviceToken?: string;
  deviceLabel?: string;
  userAgent?: string;
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

function stableRequestId(deviceId: string) {
  return `water-access-device-${createHash("sha256").update(deviceId).digest("hex").slice(0, 32)}`;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as WaterAccessRequestBody;
    const deviceId = clean(body.deviceId).slice(0, 120);
    const deviceToken = clean(body.deviceToken);
    const now = new Date().toISOString();
    const title = clean(body.title) || clean(body.roleTitle);
    const emailOrPhone =
      normalizePhone(body.emailOrPhone) || normalizePhone(body.phone);
    const deviceLabel =
      clean(body.deviceLabel).slice(0, 220) ||
      clean(body.userAgent).slice(0, 220) ||
      clean(request.headers.get("user-agent")).slice(0, 220);

    if (!clean(body.firstName) || !clean(body.lastName) || !title || !emailOrPhone) {
      return NextResponse.json(
        { ok: false, error: "missing_required_fields" },
        { status: 400 },
      );
    }

    if (!deviceId || !deviceToken) {
      return NextResponse.json(
        { ok: false, error: "missing_device_claim" },
        { status: 400 },
      );
    }

    const requestId = stableRequestId(deviceId);
    const existingRequest = await getWaterAccessRequestByDevice(deviceId);
    const previousAttemptCount = Number(existingRequest?.attempt_count || 0);
    const attemptCount =
      Number.isFinite(previousAttemptCount) && previousAttemptCount > 0
        ? Math.floor(previousAttemptCount) + 1
        : 1;

    const saved = await upsertWaterAccessRequest({
      id: requestId,
      device_id: deviceId,
      token_hash: hashToken(deviceToken),
      first_name: clean(body.firstName),
      last_name: clean(body.lastName),
      title,
      organization: clean(body.organization),
      email_or_phone: emailOrPhone,
      reason: clean(body.reason),
      device_label: deviceLabel,
      user_agent: clean(request.headers.get("user-agent")).slice(0, 300),
      status: "pending_founder_review",
      attempt_count: attemptCount,
      created_at: existingRequest?.created_at || now,
      updated_at: now,
      last_requested_at: now,
      decided_at: null,
      decided_by: null,
      revoked_device_id: null,
    });

    return NextResponse.json({
      ok: true,
      requestId: saved.id,
      status: saved.status,
      deviceBound: true,
      deduplicated: Boolean(existingRequest),
      attemptCount: saved.attempt_count,
      storage: "supabase",
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
