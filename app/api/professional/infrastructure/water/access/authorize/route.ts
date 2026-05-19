import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

type WaterAccessAuthorizeBody = {
  code?: string;
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
  const body = (await request.json()) as WaterAccessAuthorizeBody;

  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  const submittedCode = clean(body.code);
  const deviceId = clean(body.deviceId);
  const deviceToken = clean(body.deviceToken);

  const isFounderAccess = Boolean(founderCode) && submittedCode === founderCode;
  const approvedDevice = await approvedDeviceMatches(deviceId, deviceToken);

  if (!founderCode && !deviceId) {
    return NextResponse.json(
      {
        ok: false,
        error: "founder_access_code_not_configured",
      },
      { status: 403 },
    );
  }

  if (!isFounderAccess && !approvedDevice) {
    return NextResponse.json(
      {
        ok: false,
        error: "access_not_approved",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({
    ok: true,
    approved: true,
    accessMode: isFounderAccess ? "founder" : "approved-device",
    approvedAt: new Date().toISOString(),
    holder: {
      firstName: isFounderAccess ? clean(body.firstName) : clean(approvedDevice?.firstName),
      lastName: isFounderAccess ? clean(body.lastName) : clean(approvedDevice?.lastName),
      title: isFounderAccess ? clean(body.title) : clean(approvedDevice?.title),
      phone: clean(approvedDevice?.phone),
      deviceId,
    },
  });
}