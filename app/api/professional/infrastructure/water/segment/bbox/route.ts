import { NextResponse } from "next/server";

import {
  getControlledWaterSegment,
  parseControlledWaterBbox,
  parseMaxSegmentFeatures,
} from "@/core/infrastructure/water/controlled-water-segment-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function productionSegmentServingEnabled(request: Request) {
  const isProduction = process.env.NODE_ENV === "production";

  if (!isProduction) {
    return {
      allowed: true,
      reason: "local development controlled segment serving",
    };
  }

  if (process.env.PANTAVION_WATER_CONTROLLED_SEGMENTS !== "enabled") {
    return {
      allowed: false,
      reason: "PANTAVION_WATER_CONTROLLED_SEGMENTS is not enabled",
    };
  }

  const configuredToken = process.env.PANTAVION_WATER_VIEWER_TOKEN;

  if (!configuredToken) {
    return {
      allowed: false,
      reason: "PANTAVION_WATER_VIEWER_TOKEN is not configured",
    };
  }

  const url = new URL(request.url);
  const requestToken =
    request.headers.get("x-pantavion-water-token") ?? url.searchParams.get("viewerToken");

  if (requestToken !== configuredToken) {
    return {
      allowed: false,
      reason: "viewer token missing or invalid",
    };
  }

  return {
    allowed: true,
    reason: "production controlled segment serving enabled",
  };
}

export async function GET(request: Request) {
  const gate = productionSegmentServingEnabled(request);

  if (!gate.allowed) {
    return NextResponse.json(
      {
        status: "protected",
        reason: gate.reason,
        dataReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        segmentReturned: false,
        requiredEnvironment: [
          "PANTAVION_WATER_CONTROLLED_SEGMENTS=enabled",
          "PANTAVION_WATER_VIEWER_TOKEN",
          "PANTAVION_WATER_NETWORK_GEOJSON_URL for production private master source",
        ],
      },
      {
        status: 423,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "protected",
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }

  try {
    const url = new URL(request.url);
    const bbox = parseControlledWaterBbox(url.searchParams);
    const maxFeatures = parseMaxSegmentFeatures(url.searchParams);
    const segment = await getControlledWaterSegment(bbox, maxFeatures);

    return NextResponse.json(
      {
        status: "controlled_segment_ready",
        sourceMode: segment.sourceMode,
        sourceLabel:
          segment.sourceMode === "private_cloud_master"
            ? segment.sourceLabel
            : "local protected master",
        bbox: segment.bbox,
        dataReturned: true,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        segmentReturned: true,
        totalMasterFeatureCount: segment.totalMasterFeatureCount,
        matchingFeatureCount: segment.matchingFeatureCount,
        segmentCount: segment.segmentCount,
        segmentTruncated: segment.segmentTruncated,
        segment: segment.collection,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "controlled",
          "X-Pantavion-Data-Returned": "segment-only",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "segment_error",
        error: error instanceof Error ? error.message : "Unknown segment error",
        dataReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        segmentReturned: false,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "error",
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }
}
