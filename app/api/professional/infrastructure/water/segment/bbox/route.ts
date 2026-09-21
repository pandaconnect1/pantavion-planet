import { createHash } from "crypto";

import { NextResponse } from "next/server";

import {
  getControlledWaterSegmentFromPrivateIndex,
  getWaterSegmentDiagnosticCode,
  parseWaterSegmentBbox,
  parseWaterSegmentLimit,
} from "@/core/infrastructure/water/controlled-water-segment-index-provider";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

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

async function authorizeWaterSegmentRequest(request: Request): Promise<WaterSegmentAccessDecision> {
  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));

  if (hasWaterAdminSession(request)) {
    return {
      ok: true,
      mode: "admin-session",
    };
  }

  const deviceApproved = await migrateLegacyApprovedDeviceIfPresent(
    deviceId,
    hashToken(deviceToken),
  );

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
