import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import {
  WATER_MAP_B_DERIVED_MANIFEST_PATH,
  WATER_MAP_B_DERIVED_STORAGE_BUCKET,
} from "@/core/water/water-map-b-derived-storage";
import { FINAL_MASTER_DWG_SHA256 } from "@/core/water/final-master-dwg-source";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
};

type DerivedManifest = {
  ok?: boolean;
  type?: string;
  source?: string;
  sourceSha256?: string;
  sourceFileName?: string;
  generatedAt?: string;
  generatorVersion?: string;
  dxfSizeBytes?: number;
  policy?: Record<string, unknown>;
  grid?: number;
  segmentFormat?: string[];
  totalEntities?: number;
  totalLineSegments?: number;
  matchedNetworkSegments?: number;
  writtenTileCount?: number;
  overflowSegmentCount?: number;
  allBounds?: Record<string, number>;
  coreBounds?: Record<string, number>;
  layers?: string[];
  topLayers?: Array<{ layer: string; count: number }>;
  tiles?: TileIndexItem[];
};

function sanitizeManifest(manifest: DerivedManifest) {
  const sortedTiles = [...(manifest.tiles ?? [])].sort(
    (a, b) => Number(b.segmentCount ?? 0) - Number(a.segmentCount ?? 0),
  );

  return {
    ok: Boolean(manifest.ok),
    type: manifest.type ?? "pantavion.master_b.derived_network_tiles",
    source: "MASTER_B_DERIVED_NETWORK",
    sourceSha256: manifest.sourceSha256 ?? null,
    sourceFileName: manifest.sourceFileName ?? null,
    generatedAt: manifest.generatedAt ?? null,
    generatorVersion: manifest.generatorVersion ?? null,
    rawDwgIncluded: false,
    publicRawDwgAccess: false,
    mobileMustUseDerivedTilesOnly: true,
    dxfSizeBytes: manifest.dxfSizeBytes ?? null,
    grid: manifest.grid ?? null,
    segmentFormat: manifest.segmentFormat ?? ["x1", "y1", "x2", "y2", "layerId"],
    totalEntities: manifest.totalEntities ?? 0,
    totalLineSegments: manifest.totalLineSegments ?? 0,
    matchedNetworkSegments: manifest.matchedNetworkSegments ?? 0,
    writtenTileCount: manifest.writtenTileCount ?? 0,
    overflowSegmentCount: manifest.overflowSegmentCount ?? 0,
    allBounds: manifest.allBounds ?? null,
    coreBounds: manifest.coreBounds ?? null,
    layers: manifest.layers ?? [],
    topLayers: manifest.topLayers ?? [],
    tiles: sortedTiles,
  };
}

export async function GET(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: access.error,
        rawDwgIncluded: false,
        dataReturned: false,
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(WATER_MAP_B_DERIVED_STORAGE_BUCKET)
      .download(WATER_MAP_B_DERIVED_MANIFEST_PATH);

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          error: "MAP_B_DERIVED_MANIFEST_NOT_READY",
          rawDwgIncluded: false,
          dataReturned: false,
        },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const manifest = JSON.parse(await data.text()) as DerivedManifest;

    if (
      manifest.sourceSha256 !== FINAL_MASTER_DWG_SHA256 ||
      manifest.ok !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "MAP_B_DERIVED_MANIFEST_SOURCE_MISMATCH",
          expectedSourceSha256: FINAL_MASTER_DWG_SHA256,
          actualSourceSha256: manifest.sourceSha256 ?? null,
          rawDwgIncluded: false,
          dataReturned: false,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(sanitizeManifest(manifest), {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Pantavion-Source": "map-b-supabase-derived-network",
        "X-Pantavion-Water-Access-Mode": access.mode,
        "X-Pantavion-Raw-DWG-Included": "false",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "MAP_B_MANIFEST_READ_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        rawDwgIncluded: false,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
