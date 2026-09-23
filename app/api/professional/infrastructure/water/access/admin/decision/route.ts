import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import {
  appendWaterAccessAudit,
  getWaterAccessRequest,
  getWaterApprovedDevice,
  updateWaterAccessRequest,
  upsertWaterApprovedDevice,
} from "@/core/water/water-access-store";

type DecisionBody = {
  requestId?: string;
  id?: string;
  deviceId?: string;
  decision?: "approve" | "reject" | "revoke";
  revokeConfirmation?: string;
  actingDeviceId?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    if (!(await hasWaterAdminAuthorization(request))) {
      return NextResponse.json(
        { ok: false, error: "admin_session_required" },
        { status: 403 },
      );
    }

    const body = (await request.json()) as DecisionBody;
    const decision =
      body.decision === "reject"
        ? "reject"
        : body.decision === "revoke"
          ? "revoke"
          : "approve";

    const now = new Date().toISOString();
    const requestId = clean(body.requestId) || clean(body.id);

    if (decision === "revoke") {
      if (clean(body.revokeConfirmation) !== "REVOKE") {
        return NextResponse.json(
          { ok: false, error: "revoke_confirmation_required" },
          { status: 400 },
        );
      }

      const deviceId = clean(body.deviceId);
      const actingDeviceId = clean(body.actingDeviceId);

      if (!deviceId) {
        return NextResponse.json(
          { ok: false, error: "missing_target_device_id" },
          { status: 400 },
        );
      }

      if (actingDeviceId && actingDeviceId === deviceId) {
        return NextResponse.json(
          { ok: false, error: "self_revoke_blocked" },
          { status: 403 },
        );
      }

      const approved = await getWaterApprovedDevice(deviceId);
      if (!approved) {
        return NextResponse.json(
          { ok: false, error: "approved_device_not_found" },
          { status: 404 },
        );
      }

      const roleText = approved.title.toLowerCase();
      if (roleText.includes("founder") || roleText.includes("admin")) {
        return NextResponse.json(
          { ok: false, error: "protected_founder_admin_cannot_be_revoked" },
          { status: 403 },
        );
      }

      await upsertWaterApprovedDevice({
        ...approved,
        status: "revoked",
        revoked: true,
        revoked_at: now,
        revoked_by: "pantavion-founder",
        updated_at: now,
      });

      if (approved.request_id) {
        await updateWaterAccessRequest(approved.request_id, {
          status: "revoked",
          updated_at: now,
          decided_at: now,
          decided_by: "pantavion-founder",
          revoked_device_id: deviceId,
        });
      }

      await appendWaterAccessAudit({
        event: "revoke",
        actor: "pantavion-founder",
        deviceId,
        requestId: approved.request_id || undefined,
      });

      return NextResponse.json({
        ok: true,
        decision: "revoke",
        status: "revoked",
        deviceId,
      });
    }

    if (!requestId) {
      return NextResponse.json(
        { ok: false, error: "missing_request_id" },
        { status: 400 },
      );
    }

    const record = await getWaterAccessRequest(requestId);
    if (!record) {
      return NextResponse.json(
        { ok: false, error: "request_not_found" },
        { status: 404 },
      );
    }

    if (decision === "reject") {
      await updateWaterAccessRequest(requestId, {
        status: "rejected",
        updated_at: now,
        decided_at: now,
        decided_by: "pantavion-founder",
      });

      await appendWaterAccessAudit({
        event: "reject",
        actor: "pantavion-founder",
        deviceId: record.device_id,
        requestId,
      });

      return NextResponse.json({
        ok: true,
        requestId,
        decision: "reject",
        status: "removed_from_active_queue",
      });
    }

    await upsertWaterApprovedDevice({
      device_id: record.device_id,
      token_hash: record.token_hash,
      phone: record.email_or_phone,
      first_name: record.first_name,
      last_name: record.last_name,
      title: record.title,
      organization: record.organization,
      request_id: requestId,
      approved_at: now,
      approved_by: "pantavion-founder",
      status: "approved",
      revoked: false,
      revoked_at: null,
      revoked_by: null,
      updated_at: now,
    });

    await updateWaterAccessRequest(requestId, {
      status: "approved",
      updated_at: now,
      decided_at: now,
      decided_by: "pantavion-founder",
    });

    await appendWaterAccessAudit({
      event: "approve",
      actor: "pantavion-founder",
      deviceId: record.device_id,
      requestId,
      payload: { phone: record.email_or_phone, title: record.title },
    });

    return NextResponse.json({
      ok: true,
      requestId,
      decision: "approve",
      status: "approved",
      phone: record.email_or_phone,
      deviceId: record.device_id,
      storage: "supabase",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "decision_failed",
      },
      { status: 500 },
    );
  }
}
