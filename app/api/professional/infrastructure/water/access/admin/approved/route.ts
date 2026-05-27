import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

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
  updatedAt?: string;
  sourcePath?: string;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function founderCodeFromEnv(): string {
  return (
    clean(process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE) ||
    clean(process.env.PANTAVION_WATER_ADMIN_ACCESS_CODE) ||
    clean(process.env.PANTAVION_ADMIN_ACCESS_CODE)
  );
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
    updatedAt: clean(payload.updatedAt),
    sourcePath: pathname,
  };
}

export async function POST(request: NextRequest) {
  const expectedCode = founderCodeFromEnv();

  if (!expectedCode) {
    return NextResponse.json(
      {
        ok: false,
        error: "missing_founder_code_env",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: Record<string, unknown> = {};

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  const submittedCode =
    clean(body.founderCode) ||
    clean(body.adminCode) ||
    clean(body.code) ||
    clean(request.headers.get("x-pantavion-water-founder-code")) ||
    clean(request.headers.get("x-pantavion-admin-code"));

  if (submittedCode !== expectedCode) {
    return NextResponse.json(
      {
        ok: false,
        error: "unauthorized",
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

    for (const blob of result.blobs as BlobLike[]) {
      const payload = await readJsonBlob(blob);

      if (!payload) continue;

      const normalized = normalizeApprovedRecord(blob.pathname, payload);

      if (normalized.status !== "revoked") {
        approvedUsers.push(normalized);
      }
    }

    approvedUsers.sort((a, b) =>
      String(b.approvedAt || b.updatedAt || "").localeCompare(
        String(a.approvedAt || a.updatedAt || "")
      )
    );

    return NextResponse.json(
      {
        ok: true,
        approvedUsers,
        approvedDevices: approvedUsers,
        count: approvedUsers.length,
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