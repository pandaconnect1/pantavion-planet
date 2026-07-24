import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  getControlledWaterSegmentFromPrivateIndex,
  getWaterSegmentDiagnosticCode,
  parseWaterSegmentBbox,
  parseWaterSegmentLimit,
} from "@/core/infrastructure/water/controlled-water-segment-index-provider";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
};

type ApprovedWaterDevicePayload = {
  status?: string;
  revoked?: boolean;
  tokenHash?: string;
};

type WaterSegmentAccessDecision =
  | {
      ok: true;
      mode: "admin-session" | "approved-device";
    }
  | {
      ok: false;
      error: "access_not_approved";
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

  return response.json() as Promise<ApprovedWaterDevicePayload>;
}

async function approvedDeviceMatches(deviceId: string, deviceToken: string) {
  if (!deviceId || !deviceToken) return false;

  try {
    const pathname = `water/private/approved-devices/${deviceId}.json`;
    const result = await list({
      prefix: pathname,
      limit: 1,
    });

    const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);
    if (!blob) return false;

    const payload = await readJsonBlob(blob);
    const tokenHash = hashToken(deviceToken);

    if (clean(payload.status) !== "approved") return false;
    if (payload.revoked === true) return false;
    if (clean(payload.tokenHash) !== tokenHash) return false;

    return true;
  } catch {
    return false;
  }
}

async function authorizeWaterSegmentRequest(request: Request): Promise<WaterSegmentAccessDecision> {
  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));

  if (hasWaterAdminSession(request)) {
    return {
      ok: true,
      mode: "admin-session",
    };
  }

  const deviceApproved = await approvedDeviceMatches(deviceId, deviceToken);

  if (deviceApproved) {
    return {
      ok: true,
      mode: "approved-device",
    };
  }

  return {
    ok: false,
    error: "access_not_approved",
  };
}

export async function GET(request: Request) {
  const access = await authorizeWaterSegmentRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      {
        status: "access_denied",
        error: access.error,
        dataReturned: false,
        segmentReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        browserFullNetworkLoaded: false,
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "access-denied",
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }

  try {
    const url = new URL(request.url);
    const bbox = parseWaterSegmentBbox(url.searchParams);
    const maxFeatures = parseWaterSegmentLimit(url.searchParams);
    const result = await getControlledWaterSegmentFromPrivateIndex(bbox, maxFeatures);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Segment": "private-index-authentic-source",
        "X-Pantavion-Water-Access-Mode": access.mode,
        "X-Pantavion-Data-Returned": "segment-only",
      },
    });
  } catch (error) {
    const diagnosticCode = getWaterSegmentDiagnosticCode(error);
    const responseStatus = diagnosticCode === "WATER_BBOX" ? 400 : 503;

    return NextResponse.json(
      {
        status: "segment_error",
        error: "water_segment_unavailable",
        diagnosticCode,
        dataReturned: false,
        segmentReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        browserFullNetworkLoaded: false,
      },
      {
        status: responseStatus,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "error",
          "X-Pantavion-Water-Diagnostic": diagnosticCode,
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }
}
