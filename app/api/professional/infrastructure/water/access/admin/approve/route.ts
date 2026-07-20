import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import crypto from "crypto";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlobItem = {
  pathname?: string;
  url?: string;
  downloadUrl?: string;
};

type AccessRequestPayload = {
  id?: string;
  status?: string;
  createdAt?: string;
  requestedAt?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  emailOrPhone?: string;
  organization?: string;
  reason?: string;
  source?: string;
  device?: {
    id?: string;
    tokenHash?: string;
    label?: string;
  };
  userAgent?: string;
};

function clean(value: unknown, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function hashToken(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function readJsonBlob<T>(blob: BlobItem) {
  const url = blob.downloadUrl || blob.url;

  if (!url) return null;

  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) return null;

  return (await response.json()) as T;
}

async function findAccessRequest(requestId: string, deviceId: string) {
  if (requestId) {
    const exact = await list({
      prefix: `water/private/access-requests/${requestId}.json`,
      limit: 1,
    });

    const blob = (exact.blobs || [])[0] as BlobItem | undefined;
    const payload = blob ? await readJsonBlob<AccessRequestPayload>(blob) : null;

    if (payload) return payload;
  }

  const result = await list({
    prefix: "water/private/access-requests/",
    limit: 100,
  });

  const blobs = (result.blobs || []) as BlobItem[];

  for (const blob of blobs) {
    const payload = await readJsonBlob<AccessRequestPayload>(blob);

    if (payload?.device?.id && payload.device.id === deviceId) {
      return payload;
    }
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    if (!hasWaterAdminSession(request)) {
      return NextResponse.json(
        {
          ok: false,
          error: "admin_session_required",
          message: "Χρειάζεται πραγματικό founder/admin session για έγκριση συσκευής.",
        },
        { status: 403 },
      );
    }

    const requestId = clean(body.requestId || body.id, 180);
    const bodyDeviceId = clean(body.deviceId, 180);
    const bodyDeviceToken = clean(body.deviceToken, 500);
    const action = clean(body.action, 40) || "approve";

    const accessRequest = await findAccessRequest(requestId, bodyDeviceId);
    const deviceId = clean(accessRequest?.device?.id || bodyDeviceId, 180);

    if (!deviceId) {
      return NextResponse.json(
        {
          ok: false,
          error: "device_id_required",
          message: "Δεν βρέθηκε deviceId για έγκριση.",
        },
        { status: 400 },
      );
    }

    const tokenHash =
      clean(accessRequest?.device?.tokenHash, 200) ||
      (bodyDeviceToken ? hashToken(bodyDeviceToken) : "");

    if (!tokenHash) {
      return NextResponse.json(
        {
          ok: false,
          error: "device_token_hash_required",
          message: "Δεν βρέθηκε device token hash. Χρειάζεται πλήρης αίτηση πρόσβασης από τη συσκευή.",
        },
        { status: 400 },
      );
    }

    const now = new Date().toISOString();

    if (action === "reject") {
      if (accessRequest?.id) {
        await put(
          `water/private/access-requests/${accessRequest.id}.json`,
          JSON.stringify(
            {
              ...accessRequest,
              status: "rejected",
              rejectedAt: now,
              rejectedBy: "founder-admin",
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
        action: "reject",
        status: "rejected",
        deviceId,
      });
    }

    const approvedDevice = {
      status: "approved",
      deviceId,
      tokenHash,
      device: {
        id: deviceId,
        tokenHash,
        label: clean(accessRequest?.device?.label || body.deviceLabel, 220),
      },
      approvedAt: now,
      approvedBy: "founder-admin",
      approvalSource: "pantavion-water-admin-approve-route",
      requestId: clean(accessRequest?.id || requestId, 180),
      sourceRequest: {
        title: clean(accessRequest?.title, 220),
        firstName: clean(accessRequest?.firstName, 120),
        lastName: clean(accessRequest?.lastName, 120),
        emailOrPhone: clean(accessRequest?.emailOrPhone, 180),
        organization: clean(accessRequest?.organization, 220),
        requestedAt: clean(accessRequest?.requestedAt || accessRequest?.createdAt, 80),
        source: clean(accessRequest?.source, 120),
      },
    };

    await put(
      `water/private/approved-devices/${deviceId}.json`,
      JSON.stringify(approvedDevice, null, 2),
      {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      },
    );

    if (accessRequest?.id) {
      await put(
        `water/private/access-requests/${accessRequest.id}.json`,
        JSON.stringify(
          {
            ...accessRequest,
            status: "approved",
            approvedAt: now,
            approvedBy: "founder-admin",
            approvedDevicePath: `water/private/approved-devices/${deviceId}.json`,
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
      action: "approve",
      status: "approved",
      deviceId,
      requestId: accessRequest?.id || requestId || "",
      approvedDevicePath: `water/private/approved-devices/${deviceId}.json`,
      nextStep: "Άνοιξε ξανά τον live χάρτη. Το /segment/bbox πρέπει πλέον να δώσει 200 αντί για 403.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "approve_device_failed",
      },
      { status: 500 },
    );
  }
}
