import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

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

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
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

  return response.json();
}

async function approvedDeviceMatches(deviceId: string, deviceToken: string) {
  if (!deviceId || !deviceToken) return null;

  const pathname = `water/private/approved-devices/${deviceId}.json`;
  const result = await list({
    prefix: pathname,
    limit: 1,
  });

  const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);
  if (!blob) return null;

  const payload = await readJsonBlob(blob);
  const tokenHash = hashToken(deviceToken);

  if (clean(payload.status) !== "approved") return null;
  if (payload.revoked === true) return null;
  if (clean(payload.tokenHash) !== tokenHash) return null;

  return payload;
}

export async function POST(request: Request) {
  let body: WaterAccessAuthorizeBody;

  try {
    body = (await request.json()) as WaterAccessAuthorizeBody;
  } catch {
    return noStoreJson(
      {
        ok: false,
        error: "invalid_request",
      },
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

  let approvedDevice: Awaited<ReturnType<typeof approvedDeviceMatches>>;

  try {
    approvedDevice = await approvedDeviceMatches(deviceId, deviceToken);
  } catch {
    return noStoreJson(
      {
        ok: false,
        error: "access_verification_unavailable",
      },
      { status: 503 },
    );
  }

  if (!approvedDevice) {
    return noStoreJson(
      {
        ok: false,
        error: "access_not_approved",
      },
      { status: 403 },
    );
  }

  return noStoreJson({
    ok: true,
    approved: true,
    accessMode: "approved-device",
    approvedAt: new Date().toISOString(),
    holder: {
      firstName: clean(approvedDevice.firstName),
      lastName: clean(approvedDevice.lastName),
      title: clean(approvedDevice.title),
      phone: clean(approvedDevice.phone),
      deviceId,
    },
  });
}
