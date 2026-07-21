import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BlobLike = {
  pathname: string;
  url?: string;
  downloadUrl?: string;
  uploadedAt?: string | Date;
  size?: number;
};

type ApprovedUserRecord = {
  id?: string;
  deviceId?: string;
  deviceToken?: string;
  requestId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  roleTitle?: string;
  title?: string;
  status?: string;
  approvedAt?: string;
  revokedAt?: string;
  revoked?: boolean;
  updatedAt?: string;
  sourcePath?: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function privateBlobHeaders(): HeadersInit {
  const token = clean(process.env.BLOB_READ_WRITE_TOKEN);

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function readJsonBlob(blob: BlobLike): Promise<Record<string, unknown> | null> {
  const url = blob.downloadUrl || blob.url;

  if (!url) return null;

  const response = await fetch(url, {
    headers: privateBlobHeaders(),
    cache: "no-store",
  });

  if (!response.ok) return null;

  return (await response.json()) as Record<string, unknown>;
}

function normalizeApprovedRecord(
  pathname: string,
  payload: Record<string, unknown>
): ApprovedUserRecord {
  const roleTitle = clean(payload.roleTitle) || clean(payload.title);

  return {
    id: clean(payload.id) || pathname,
    deviceId: clean(payload.deviceId),
    deviceToken: clean(payload.deviceToken),
    requestId: clean(payload.requestId),
    firstName: clean(payload.firstName),
    lastName: clean(payload.lastName),
    phone: clean(payload.phone),
    roleTitle,
    title: roleTitle,
    status: clean(payload.status) || "approved",
    approvedAt: clean(payload.approvedAt),
    revokedAt: clean(payload.revokedAt),
    revoked: payload.revoked === true,
    updatedAt: clean(payload.updatedAt),
    sourcePath: pathname,
  };
}

export async function POST(request: Request) {
  if (!hasWaterAdminSession(request)) {
    return NextResponse.json(
      {
        ok: false,
        error: "admin_session_required",
      },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  const token = clean(process.env.BLOB_READ_WRITE_TOKEN);

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_blob_token",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const result = await list({
      prefix: "water/private/approved-devices/",
      limit: 1000,
      token,
    });

    const approvedUsers: ApprovedUserRecord[] = [];
    const blockedUsers: ApprovedUserRecord[] = [];

    for (const blob of result.blobs as BlobLike[]) {
      const payload = await readJsonBlob(blob);

      if (!payload) continue;

      const normalized = normalizeApprovedRecord(blob.pathname, payload);

      if (clean(normalized.status).toLowerCase() === "revoked" || normalized.revoked === true) {
        blockedUsers.push(normalized);
      } else {
        approvedUsers.push(normalized);
      }
    }

    approvedUsers.sort((a, b) =>
      String(b.approvedAt || b.updatedAt || "").localeCompare(
        String(a.approvedAt || a.updatedAt || "")
      )
    );
    blockedUsers.sort((a, b) =>
      String(b.revokedAt || b.updatedAt || b.approvedAt || "").localeCompare(
        String(a.revokedAt || a.updatedAt || a.approvedAt || ""),
      ),
    );

    return NextResponse.json(
      {
        ok: true,
        approvedUsers,
        approvedDevices: approvedUsers,
        blockedUsers,
        revokedUsers: blockedUsers,
        count: approvedUsers.length,
        blockedCount: blockedUsers.length,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "approved_users_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
