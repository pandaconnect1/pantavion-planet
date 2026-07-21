import { createHash } from "crypto";

import { list, put } from "@vercel/blob";
import { NextResponse } from "next/server";

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

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
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

function privateBlobHeaders(): HeadersInit {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function readExistingRequest(pathname: string) {
  const result = await list({
    prefix: pathname,
    limit: 1,
  });
  const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);

  if (!blob) return null;

  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
    headers: privateBlobHeaders(),
  });

  if (!response.ok) return null;

  return (await response.json()) as Record<string, unknown>;
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
        {
          ok: false,
          error: "missing_required_fields",
        },
        { status: 400 },
      );
    }

    if (!deviceId || !deviceToken) {
      return NextResponse.json(
        {
          ok: false,
          error: "missing_device_claim",
        },
        { status: 400 },
      );
    }

    const requestId = stableRequestId(deviceId);
    const requestPath = `water/private/access-requests/${requestId}.json`;
    const existingRequest = await readExistingRequest(requestPath);
    const previousAttemptCount = Number(existingRequest?.attemptCount || 0);
    const attemptCount =
      Number.isFinite(previousAttemptCount) && previousAttemptCount > 0
        ? Math.floor(previousAttemptCount) + 1
        : 1;

    const payload = {
      id: requestId,
      firstName: clean(body.firstName),
      lastName: clean(body.lastName),
      title,
      organization: clean(body.organization),
      emailOrPhone,
      reason: clean(body.reason),
      status: "pending_founder_review",
      createdAt: clean(existingRequest?.createdAt) || now,
      updatedAt: now,
      lastRequestedAt: now,
      attemptCount,
      source: "pantavion-water-live-access-request",
      device: {
        id: deviceId,
        tokenHash: hashToken(deviceToken),
        label: deviceLabel,
        requestedAt: now,
        userAgent: clean(request.headers.get("user-agent")).slice(0, 300),
      },
    };

    await put(
      requestPath,
      JSON.stringify(payload, null, 2),
      {
        access: "private",
        allowOverwrite: true,
        contentType: "application/json",
      },
    );

    return NextResponse.json({
      ok: true,
      requestId,
      status: payload.status,
      deviceBound: true,
      deduplicated: Boolean(existingRequest),
      attemptCount,
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
