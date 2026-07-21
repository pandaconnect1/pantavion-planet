import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
  uploadedAt?: string | Date;
};

type AdminRequestRecord = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  organization: string;
  emailOrPhone: string;
  reason: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  attemptCount: number;
  deviceId: string;
  deviceLabel: string;
  hasDeviceToken: boolean;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return clean(value)
    .toLowerCase()
    .replace(/[\s().-]/g, "");
}

function requestIdentity(record: AdminRequestRecord) {
  const phone = normalizePhone(record.emailOrPhone);

  if (phone) return `phone:${phone}`;
  if (record.deviceId) return `device:${record.deviceId}`;

  return `request:${record.id}`;
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

function normalizeRequest(payload: Record<string, any>): AdminRequestRecord {
  const device = payload.device || {};
  const attemptCount = Number(payload.attemptCount || 1);

  return {
    id: clean(payload.id),
    firstName: clean(payload.firstName),
    lastName: clean(payload.lastName),
    title: clean(payload.title) || clean(payload.roleTitle),
    organization: clean(payload.organization),
    emailOrPhone: normalizePhone(payload.emailOrPhone || payload.phone),
    reason: clean(payload.reason),
    status: clean(payload.status),
    createdAt: clean(payload.createdAt),
    updatedAt:
      clean(payload.updatedAt) || clean(payload.lastRequestedAt) || clean(payload.decidedAt),
    attemptCount:
      Number.isFinite(attemptCount) && attemptCount > 0 ? Math.floor(attemptCount) : 1,
    deviceId: clean(device.id) || clean(payload.deviceId),
    deviceLabel: clean(device.label) || clean(payload.deviceLabel),
    hasDeviceToken: Boolean(clean(device.tokenHash) || clean(payload.tokenHash)),
  };
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

    const result = await list({
      prefix: "water/private/access-requests/",
      limit: 200,
    });

    const historyRecords: AdminRequestRecord[] = [];
    let skippedCount = 0;

    for (const blob of result.blobs as BlobLike[]) {
      try {
        const payload = await readJsonBlob(blob);
        historyRecords.push(normalizeRequest(payload));
      } catch {
        skippedCount += 1;
      }
    }

    historyRecords.sort((a, b) =>
      String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)),
    );

    const rawPendingRecords = historyRecords.filter(
      (item) => item.status === "pending_founder_review",
    );
    const latestRequestByPerson = new Map<string, AdminRequestRecord>();

    for (const historyRecord of historyRecords) {
      const identity = requestIdentity(historyRecord);

      if (!latestRequestByPerson.has(identity)) {
        latestRequestByPerson.set(identity, historyRecord);
      }
    }

    const requests = [...latestRequestByPerson.values()].filter(
      (item) => item.status === "pending_founder_review",
    );

    return NextResponse.json({
      ok: true,
      requests,
      pendingRequests: requests,
      blobCount: result.blobs.length,
      readCount: historyRecords.length,
      skippedCount,
      summary: {
        newPendingCount: requests.length,
        rawPendingAttemptCount: rawPendingRecords.length,
        historicalAttemptCount: historyRecords.length,
        uniqueHistoricalPeopleCount: latestRequestByPerson.size,
        duplicateHistoricalAttemptCount: Math.max(
          0,
          historyRecords.length - latestRequestByPerson.size,
        ),
      },
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "requests_failed",
      },
      { status: 500 },
    );
  }
}
