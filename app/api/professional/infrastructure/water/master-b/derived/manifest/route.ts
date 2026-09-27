import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import {
  WATER_MAP_B_DERIVED_STORAGE_BUCKET,
  normalizeWaterMapBSourceKey,
  waterMapBDerivedManifestPath,
} from "@/core/water/water-map-b-derived-storage";
import { WATER_MAP_B_SOURCE_CANDIDATES } from "@/core/water/water-map-b-source-candidates";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TileIndexItem = {
  x: number;
  y: number;
  file: string;
  segmentCount: number;
  pointCount?: number;
  labelCount?: number;
};

type DerivedManifest = {
  ok?: boolean;
  type?: string;
  source?: string;
  sourceSha256?: string;
  sourceFileName?: string;
  generatedAt?: string;
  generatorVersion?: string;
  sourceSizeBytes?: number;
  policy?: Record<string, unknown>;
  grid?: number;
  segmentFormat?: string[];
  pointFormat?: string[];
  labelFormat?: string[];
  totalEntities?: number;
  totalLineSegments?: number;
  matchedNetworkSegments?: number;
  pointCount?: number;
  labelCount?: number;
  writtenTileCount?: number;
  overflowSegmentCount?: number;
  allBounds?: Record<string, number>;
  coreBounds?: Record<string, number>;
  coordinateSpace?: string;
  sourceCrs?: string | null;
  geographicAlignmentVerified?: boolean;
  cadastralOverlayAllowed?: boolean;
  layers?: string[];
  topLayers?: Array<{ layer: string; count: number }>;
  tiles?: TileIndexItem[];
  coverage?: Record<string, unknown>;
  truth?: Record<string, unknown>;
};

function sanitizeManifest(
  sourceKey: ReturnType<typeof normalizeWaterMapBSourceKey>,
  manifest: DerivedManifest,
) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const sortedTiles = [...(manifest.tiles ?? [])].sort(
    (a, b) => Number(b.segmentCount ?? 0) - Number(a.segmentCount ?? 0),
  );

  return {
    ok: Boolean(manifest.ok),
    sourceKey,
    canonical: source.canonical,
    type: manifest.type ?? "pantavion.master_b.derived_network_tiles",
    source: "MASTER_B_DERIVED_NETWORK",
    sourceSha256: manifest.sourceSha256 ?? null,
    sourceFileName: manifest.sourceFileName ?? source.fileName,
    generatedAt: manifest.generatedAt ?? null,
    generatorVersion: manifest.generatorVersion ?? null,
    rawDwgIncluded: false,
    publicRawDwgAccess: false,
    mobileMustUseDerivedTilesOnly: true,
    sourceSizeBytes: manifest.sourceSizeBytes ?? source.byteSize,
    grid: manifest.grid ?? null,
    coordinateSpace: manifest.coordinateSpace ?? "source_cad",
    sourceCrs: manifest.sourceCrs ?? null,
    geographicAlignmentVerified:
      manifest.geographicAlignmentVerified === true,
    cadastralOverlayAllowed: manifest.cadastralOverlayAllowed === true,
    segmentFormat:
      manifest.segmentFormat ?? ["x1", "y1", "x2", "y2", "layerId"],
    pointFormat:
      manifest.pointFormat ?? ["x", "y", "layerId", "entityType", "blockName"],
    labelFormat:
      manifest.labelFormat ?? ["x", "y", "layerId", "text", "entityType"],
    totalEntities: manifest.totalEntities ?? 0,
    totalLineSegments: manifest.totalLineSegments ?? 0,
    matchedNetworkSegments: manifest.matchedNetworkSegments ?? 0,
    pointCount: manifest.pointCount ?? 0,
    labelCount: manifest.labelCount ?? 0,
    writtenTileCount: manifest.writtenTileCount ?? 0,
    overflowSegmentCount: manifest.overflowSegmentCount ?? 0,
    allBounds: manifest.allBounds ?? null,
    coreBounds: manifest.coreBounds ?? null,
    layers: manifest.layers ?? [],
    topLayers: manifest.topLayers ?? [],
    tiles: sortedTiles,
    coverage: manifest.coverage ?? {},
    truth: manifest.truth ?? {},
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

  const url = new URL(request.url);
  const sourceKey = normalizeWaterMapBSourceKey(
    url.searchParams.get("sourceKey"),
  );
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(WATER_MAP_B_DERIVED_STORAGE_BUCKET)
      .download(waterMapBDerivedManifestPath(sourceKey));

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          sourceKey,
          canonical: source.canonical,
          error: "MAP_B_DERIVED_MANIFEST_NOT_READY",
          rawDwgIncluded: false,
          dataReturned: false,
        },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const manifest = JSON.parse(await data.text()) as DerivedManifest;

    if (
      manifest.sourceSha256 !== source.sha256 ||
      manifest.sourceFileName !== source.fileName ||
      manifest.ok !== true
    ) {
      return NextResponse.json(
        {
          ok: false,
          sourceKey,
          canonical: source.canonical,
          error: "MAP_B_DERIVED_MANIFEST_SOURCE_MISMATCH",
          expectedSourceSha256: source.sha256,
          actualSourceSha256: manifest.sourceSha256 ?? null,
          expectedSourceFileName: source.fileName,
          actualSourceFileName: manifest.sourceFileName ?? null,
          rawDwgIncluded: false,
          dataReturned: false,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(sanitizeManifest(sourceKey, manifest), {
      headers: {
        "Cache-Control": "private, no-store",
        "X-Pantavion-Source": "map-b-supabase-derived-network",
        "X-Pantavion-Water-Map-B-Source-Key": sourceKey,
        "X-Pantavion-Water-Access-Mode": access.mode,
        "X-Pantavion-Raw-DWG-Included": "false",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        sourceKey,
        error: "MAP_B_MANIFEST_READ_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        rawDwgIncluded: false,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
