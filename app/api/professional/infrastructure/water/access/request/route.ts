import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("pantavion_water_submit_access_request", {
      p_id: requestId,
      p_device_id: deviceId,
      p_token_hash: hashToken(deviceToken),
      p_first_name: clean(body.firstName),
      p_last_name: clean(body.lastName),
      p_title: title,
      p_organization: clean(body.organization),
      p_email_or_phone: emailOrPhone,
      p_reason: clean(body.reason),
      p_device_label: deviceLabel,
      p_user_agent: clean(request.headers.get("user-agent")).slice(0, 300),
    });

    if (error) throw error;

    const saved = Array.isArray(data) ? data[0] : data;
    const attemptCount = Number(saved?.attempt_count || 1);

    return NextResponse.json({
      ok: true,
      requestId: saved?.id || requestId,
      status: saved?.status || "pending_founder_review",
      deviceBound: true,
      deduplicated: attemptCount > 1,
      attemptCount,
      storage: "supabase-rpc",
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
