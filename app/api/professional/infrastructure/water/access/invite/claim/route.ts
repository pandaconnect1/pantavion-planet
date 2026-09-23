import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ClaimBody = {
  inviteToken?: string;
  deviceId?: string;
  deviceToken?: string;
};

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function noStoreJson(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

export async function POST(request: Request) {
  let body: ClaimBody;

  try {
    body = (await request.json()) as ClaimBody;
  } catch {
    return noStoreJson({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const inviteToken = clean(body.inviteToken, 240);
  const deviceId = clean(body.deviceId, 120);
  const deviceToken = clean(body.deviceToken, 240);

  if (!inviteToken || !deviceId || !deviceToken) {
    return noStoreJson(
      { ok: false, error: "missing_invite_or_device_claim" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("pantavion_water_claim_sms_invite", {
      p_invite_token_hash: sha256(inviteToken),
      p_device_id: deviceId,
      p_device_token_hash: sha256(deviceToken),
    });

    if (error) throw error;

    const result = Array.isArray(data) ? data[0] : data;

    if (!result?.ok) {
      const claimStatus = String(result?.claim_status || "invalid_or_expired");
      const status =
        claimStatus === "already_claimed_other_device" ||
        claimStatus === "revoked" ||
        claimStatus === "expired"
          ? 403
          : 404;

      return noStoreJson(
        {
          ok: false,
          approved: false,
          error: claimStatus,
        },
        { status },
      );
    }

    return noStoreJson({
      ok: true,
      approved: true,
      accessMode: "one-time-sms-device-bound",
      inviteId: result.invite_id,
      recipientLabel: result.recipient_label,
      claimStatus: result.claim_status,
    });
  } catch {
    return noStoreJson(
      { ok: false, error: "invite_claim_unavailable" },
      { status: 503 },
    );
  }
}
