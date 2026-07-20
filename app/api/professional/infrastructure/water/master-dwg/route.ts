import { createHash } from "crypto";

import { list } from "@vercel/blob";

import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MASTER_DWG_FILE_NAME = "PANTAVION_WATER_MASTER_B.dwg";
const DEFAULT_MASTER_DWG_BLOB_PATH = "water/private/maps/dwg/2026_ANDREASPAP-01-02-014.dwg";

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

function getMasterDwgBlobPath() {
  return clean(process.env.PANTAVION_WATER_MASTER_DWG_BLOB_PATH) || DEFAULT_MASTER_DWG_BLOB_PATH;
}

function privateBlobHeaders(): HeadersInit {
  const token = getBlobToken();

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
  const blobToken = getBlobToken();

  if (!blobToken || !deviceId || !deviceToken) return null;

  const pathname = `water/private/approved-devices/${deviceId}.json`;
  const result = await list({
    prefix: pathname,
    limit: 1,
    token: blobToken,
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

async function assertAccess(request: Request) {
  if (hasWaterAdminSession(request)) {
    return {
      allowed: true,
      mode: "admin-session",
    };
  }

  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));
  const approvedDevice = await approvedDeviceMatches(deviceId, deviceToken);

  return {
    allowed: Boolean(approvedDevice),
    mode: approvedDevice ? "approved-device" : "denied",
  };
}

async function findMasterBlob(pathname: string) {
  const token = getBlobToken();

  if (!token) {
    throw new Error("blob_token_missing");
  }

  const result = await list({
    prefix: pathname,
    limit: 10,
    token,
  });

  const exact = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);

  if (exact) return exact;

  return (result.blobs as BlobLike[]).find((item) =>
    item.pathname.toLowerCase().endsWith(MASTER_DWG_FILE_NAME.toLowerCase()),
  );
}

export async function GET(request: Request) {
  const access = await assertAccess(request);

  if (!access.allowed) {
    return Response.json(
      {
        ok: false,
        error: "master_dwg_access_denied",
        fileName: MASTER_DWG_FILE_NAME,
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Master-File": MASTER_DWG_FILE_NAME,
          "X-Pantavion-Water-Master-Geometry-Mutated": "false",
        },
      },
    );
  }

  const blobPath = getMasterDwgBlobPath();
  const blob = await findMasterBlob(blobPath);

  if (!blob) {
    return Response.json(
      {
        ok: false,
        error: "master_dwg_blob_not_found",
        expectedPath: blobPath,
        fileName: MASTER_DWG_FILE_NAME,
      },
      {
        status: 404,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Master-File": MASTER_DWG_FILE_NAME,
          "X-Pantavion-Water-Master-Geometry-Mutated": "false",
        },
      },
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
        error: "master_dwg_fetch_failed",
        status: upstream.status,
        path: blob.pathname,
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Master-File": MASTER_DWG_FILE_NAME,
          "X-Pantavion-Water-Master-Geometry-Mutated": "false",
        },
      },
    );
  }

  const bytes = Buffer.from(await upstream.arrayBuffer());
  const checksum = createHash("sha256").update(bytes).digest("hex");

  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${MASTER_DWG_FILE_NAME}"`,
      "Cache-Control": "no-store",
      "Content-Length": String(bytes.length),
      "X-Pantavion-Water-Master-File": MASTER_DWG_FILE_NAME,
      "X-Pantavion-Water-Master-Path": blob.pathname,
      "X-Pantavion-Water-Master-SHA256": checksum,
      "X-Pantavion-Water-Master-Geometry-Mutated": "false",
      "X-Pantavion-Water-Master-Rule": "dwg-as-stored-no-transform-no-filter-no-simplify",
      "X-Pantavion-Water-Access-Mode": access.mode,
    },
  });
}
