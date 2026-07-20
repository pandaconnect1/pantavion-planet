import { del, list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

type DecisionBody = {
  requestId?: string;
  id?: string;
  deviceId?: string;
  deviceToken?: string;
  phone?: string;
  decision?: "approve" | "reject" | "revoke";
  revokeConfirmation?: string;
  actingDeviceId?: string;
};

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
};

type RecordLike = Record<string, any>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s().-]/g, "");
}

function privateBlobHeaders(): HeadersInit {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function readJsonBlob(blob: BlobLike) {
  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
    headers: privateBlobHeaders(),
  });

  if (!response.ok) {
    throw new Error(`blob_read_failed_${response.status}`);
  }

  return response.json() as Promise<RecordLike>;
}

async function findPrivateBlob(pathname: string) {
  const result = await list({
    prefix: pathname,
    limit: 1,
  });

  return (result.blobs as BlobLike[]).find((blob) => blob.pathname === pathname);
}

function isFounderAdminPayload(payload: RecordLike) {
  const roleText = [
    clean(payload.roleTitle),
    clean(payload.title),
    clean(payload.role),
    clean(payload.accessRole),
    clean(payload.organizationRole),
  ]
    .join(" ")
    .toLowerCase();

  return roleText.includes("founder") || roleText.includes("admin");
}

function payloadDeviceId(payload: RecordLike) {
  return clean(payload.deviceId) || clean(payload.device?.id);
}

function payloadTokenHash(payload: RecordLike) {
  return clean(payload.tokenHash) || clean(payload.device?.tokenHash);
}

function payloadPhone(payload: RecordLike) {
  return normalizePhone(payload.emailOrPhone) || normalizePhone(payload.phone);
}

function payloadTitle(payload: RecordLike) {
  return clean(payload.roleTitle) || clean(payload.title);
}

async function rejectRequest(requestId: string, payload: RecordLike, requestPath: string) {
  const decidedAt = new Date().toISOString();

  const rejectedPayload = {
    ...payload,
    status: "rejected",
    decidedAt,
    decidedBy: "pantavion-founder",
    archivedReason: "rejected_by_founder",
  };

  await put(
    `water/private/rejected-requests/${requestId}.json`,
    JSON.stringify(rejectedPayload, null, 2),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    },
  );

  await del(requestPath);

  return NextResponse.json({
    ok: true,
    requestId,
    decision: "reject",
    status: "removed_from_active_queue",
  });
}

async function approveRequest(requestId: string, payload: RecordLike, requestPath: string) {
  const decidedAt = new Date().toISOString();
  const approvedPhone = payloadPhone(payload);
  const deviceId = payloadDeviceId(payload);
  const deviceTokenHash = payloadTokenHash(payload);

  if (!approvedPhone) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_phone",
      },
      { status: 400 },
    );
  }

  if (!deviceId || !deviceTokenHash) {
    return NextResponse.json(
      {
        ok: false,
        error: "request_missing_device_claim",
      },
      { status: 400 },
    );
  }

  const updatedPayload = {
    ...payload,
    status: "approved",
    decidedAt,
    decidedBy: "pantavion-founder",
  };

  await put(requestPath, JSON.stringify(updatedPayload, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });

  await put(
    `water/private/approved-devices/${deviceId}.json`,
    JSON.stringify(
      {
        deviceId,
        tokenHash: deviceTokenHash,
        phone: approvedPhone,
        firstName: clean(payload.firstName),
        lastName: clean(payload.lastName),
        title: payloadTitle(payload),
        organization: clean(payload.organization),
        requestId,
        approvedAt: decidedAt,
        approvedBy: "pantavion-founder",
        status: "approved",
        revoked: false,
        accessMode: "device-bound",
      },
      null,
      2,
    ),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    },
  );

  await put(
    `water/private/approved-contacts/${approvedPhone}.json`,
    JSON.stringify(
      {
        phone: approvedPhone,
        firstName: clean(payload.firstName),
        lastName: clean(payload.lastName),
        title: payloadTitle(payload),
        organization: clean(payload.organization),
        lastApprovedDeviceId: deviceId,
        requestId,
        approvedAt: decidedAt,
        approvedBy: "pantavion-founder",
        status: "approved",
        accessMode: "device-bound",
      },
      null,
      2,
    ),
    {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
    },
  );

  return NextResponse.json({
    ok: true,
    requestId,
    decision: "approve",
    status: "approved",
    phone: approvedPhone,
    deviceId,
  });
}

async function revokeAccess(body: DecisionBody, requestPayload?: RecordLike, requestPath?: string) {
  const decidedAt = new Date().toISOString();
  const targetDeviceId = clean(body.deviceId) || payloadDeviceId(requestPayload || {});
  const actingDeviceId = clean(body.actingDeviceId);

  if (clean(body.revokeConfirmation) !== "REVOKE") {
    return NextResponse.json(
      {
        ok: false,
        error: "revoke_confirmation_required",
        message: "Type REVOKE before revoking access.",
      },
      { status: 400 },
    );
  }

  if (!targetDeviceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_target_device_id",
      },
      { status: 400 },
    );
  }

  if (actingDeviceId && actingDeviceId === targetDeviceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "self_revoke_blocked",
        message: "Current founder/admin device cannot revoke itself.",
      },
      { status: 403 },
    );
  }

  const approvedPath = `water/private/approved-devices/${targetDeviceId}.json`;
  const approvedBlob = await findPrivateBlob(approvedPath);
  const approvedPayload = approvedBlob ? await readJsonBlob(approvedBlob) : {};

  const targetPayload = {
    ...(requestPayload || {}),
    ...approvedPayload,
  };

  if (isFounderAdminPayload(targetPayload)) {
    return NextResponse.json(
      {
        ok: false,
        error: "protected_founder_admin_cannot_be_revoked",
        message: "Founder/admin access is protected from revoke.",
      },
      { status: 403 },
    );
  }

  const phone = payloadPhone(targetPayload);
  const deviceTokenHash = payloadTokenHash(targetPayload);

  const revokedPayload = {
    ...targetPayload,
    deviceId: targetDeviceId,
    tokenHash: deviceTokenHash,
    phone,
    firstName: clean(targetPayload.firstName),
    lastName: clean(targetPayload.lastName),
    title: payloadTitle(targetPayload),
    organization: clean(targetPayload.organization),
    requestId: clean(targetPayload.requestId) || clean(body.requestId) || clean(body.id),
    revokedAt: decidedAt,
    revokedBy: "pantavion-founder",
    status: "revoked",
    revoked: true,
    accessMode: "device-bound",
  };

  await put(approvedPath, JSON.stringify(revokedPayload, null, 2), {
    access: "private",
    allowOverwrite: true,
    contentType: "application/json",
  });

  await put(
    `water/private/revoked-devices/${targetDeviceId}-${Date.now()}.json`,
    JSON.stringify(
      {
        ...revokedPayload,
        auditMarker: "pantavion_water_safe_revoke_v1",
      },
      null,
      2,
    ),
    {
      access: "private",
      allowOverwrite: false,
      contentType: "application/json",
    },
  );

  if (requestPath && requestPayload) {
    await put(
      requestPath,
      JSON.stringify(
        {
          ...requestPayload,
          status: "revoked",
          decidedAt,
          decidedBy: "pantavion-founder",
          revokedDeviceId: targetDeviceId,
        },
        null,
        2,
      ),
      {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      },
    );
  }

  return NextResponse.json({
    ok: true,
    decision: "revoke",
    status: "revoked",
    phone,
    deviceId: targetDeviceId,
  });
}

export async function POST(request: Request) {
  try {
    if (!hasWaterAdminSession(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "admin_session_required",
        },
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

    const requestId = clean(body.requestId) || clean(body.id);
    const requestPath = requestId
      ? `water/private/access-requests/${requestId}.json`
      : "";

    let requestBlob: BlobLike | undefined;
    let payload: RecordLike | undefined;

    if (requestPath) {
      requestBlob = await findPrivateBlob(requestPath);
      if (requestBlob) {
        payload = await readJsonBlob(requestBlob);
      }
    }

    if ((decision === "approve" || decision === "reject") && (!requestId || !payload)) {
      return NextResponse.json(
        {
          ok: false,
          error: requestId ? "request_not_found" : "missing_request_id",
        },
        { status: requestId ? 404 : 400 },
      );
    }

    if (decision === "reject") {
      return rejectRequest(requestId, payload || {}, requestPath);
    }

    if (decision === "approve") {
      return approveRequest(requestId, payload || {}, requestPath);
    }

    return revokeAccess(body, payload, requestPath || undefined);
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
