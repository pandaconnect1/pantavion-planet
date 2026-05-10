import { NextResponse } from "next/server";

import {
  getControlledWaterSegmentFromPrivateIndex,
  parseWaterSegmentBbox,
  parseWaterSegmentLimit,
} from "@/core/infrastructure/water/controlled-water-segment-index-provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
        "X-Pantavion-Data-Returned": "segment-only",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "segment_error",
        error: error instanceof Error ? error.message : "Unknown segment error",
        dataReturned: false,
        segmentReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        browserFullNetworkLoaded: false,
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
