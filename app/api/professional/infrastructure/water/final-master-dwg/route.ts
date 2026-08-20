import { createHash } from "crypto";

import { list } from "@vercel/blob";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import {
  FINAL_MASTER_DWG_FILE_NAME,
  FINAL_MASTER_DWG_SHA256,
  FINAL_MASTER_DWG_SIZE_BYTES,
} from "@/core/water/final-master-dwg-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FINAL_MASTER_DWG_BLOB_PATH = `pantavion/water/map-b-original/${FINAL_MASTER_DWG_FILE_NAME}`;

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

function getBlobToken() {
  return clean(process.env.BLOB_READ_WRITE_TOKEN);
}

function privateHeaders(extra: HeadersInit = {}) {
  return {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Pantavion-File-Type": "original-dwg",
    "X-Pantavion-Source": "MAP_B_EXACT_ORIGINAL",
    "X-Pantavion-Size-Bytes": String(FINAL_MASTER_DWG_SIZE_BYTES),
    "X-Pantavion-SHA256": FINAL_MASTER_DWG_SHA256,
    "X-Pantavion-Water-Master-Geometry-Mutated": "false",
    "X-Pantavion-Water-Master-Rule": "dwg-as-stored-no-transform-no-filter-no-simplify",
    ...extra,
  };
}

function privateBlobHeaders(): HeadersInit {
  const token = getBlobToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
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
  const blobToken = getBlobToken();
  if (!blobToken || !deviceId || !deviceToken) return null;

  const pathname = `water/private/approved-devices/${deviceId}.json`;
  const result = await list({ prefix: pathname, limit: 1, token: blobToken });
  const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);
  if (!blob) return null;

  const payload = await readJsonBlob(blob);
  if (clean(payload.status) !== "approved") return null;
  if (payload.revoked === true) return null;
  if (clean(payload.tokenHash) !== hashToken(deviceToken)) return null;

  return payload;
}

async function assertMapBAccess(request: Request) {
  if (hasWaterAdminSession(request)) {
    return { allowed: true, mode: "admin-session" } as const;
  }

  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));
  const approvedDevice = await approvedDeviceMatches(deviceId, deviceToken);

  return approvedDevice
    ? ({ allowed: true, mode: "approved-device" } as const)
    : ({ allowed: false, mode: "denied" } as const);
}

async function findExactOriginalBlob() {
  const token = getBlobToken();
  if (!token) throw new Error("blob_token_missing");

  const result = await list({
    prefix: FINAL_MASTER_DWG_BLOB_PATH,
    limit: 10,
    token,
  });

  return (result.blobs as BlobLike[]).find(
    (item) => item.pathname === FINAL_MASTER_DWG_BLOB_PATH,
  );
}

export async function GET(request: Request) {
  let access: Awaited<ReturnType<typeof assertMapBAccess>>;

  try {
    access = await assertMapBAccess(request);
  } catch {
    return Response.json(
      { ok: false, status: "map_b_access_verification_unavailable" },
      { status: 503, headers: privateHeaders() },
    );
  }

  if (!access.allowed) {
    return Response.json(
      { ok: false, status: "map_b_founder_approval_required" },
      { status: 403, headers: privateHeaders() },
    );
  }

  try {
    const blob = await findExactOriginalBlob();

    if (!blob) {
      return Response.json(
        {
          ok: false,
          status: "original_dwg_not_available",
          fileName: FINAL_MASTER_DWG_FILE_NAME,
          expectedSizeBytes: FINAL_MASTER_DWG_SIZE_BYTES,
          expectedSha256: FINAL_MASTER_DWG_SHA256,
          storagePath: FINAL_MASTER_DWG_BLOB_PATH,
        },
        { status: 404, headers: privateHeaders() },
      );
    }

    const upstream = await fetch(blob.downloadUrl || blob.url, {
      cache: "no-store",
      headers: privateBlobHeaders(),
    });

    if (!upstream.ok) {
      return Response.json(
        {
          ok: false,
          status: "original_dwg_fetch_failed",
          upstreamStatus: upstream.status,
        },
        { status: 502, headers: privateHeaders() },
      );
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());
    const sha256 = createHash("sha256").update(bytes).digest("hex");

    if (bytes.length !== FINAL_MASTER_DWG_SIZE_BYTES || sha256 !== FINAL_MASTER_DWG_SHA256) {
      return Response.json(
        {
          ok: false,
          status: "original_dwg_integrity_mismatch",
          expectedSizeBytes: FINAL_MASTER_DWG_SIZE_BYTES,
          actualSizeBytes: bytes.length,
          expectedSha256: FINAL_MASTER_DWG_SHA256,
          actualSha256: sha256,
        },
        { status: 409, headers: privateHeaders() },
      );
    }

    return new Response(bytes, {
      status: 200,
      headers: privateHeaders({
        "Content-Type": "application/octet-stream",
        "Content-Length": String(bytes.length),
        "Content-Disposition": `inline; filename="${FINAL_MASTER_DWG_FILE_NAME}"`,
        "X-Pantavion-Water-Access-Mode": access.mode,
        "X-Pantavion-Water-Master-Path": blob.pathname,
      }),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "original_dwg_storage_error",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: privateHeaders() },
    );
  }
}
