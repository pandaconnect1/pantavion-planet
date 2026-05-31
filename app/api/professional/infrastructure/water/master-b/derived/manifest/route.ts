import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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
  dxfPath?: string;
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

function getDerivedNetworkDir(): string | null {
  if (process.env.PANTAVION_MASTER_B_DERIVED_NETWORK_DIR) {
    return process.env.PANTAVION_MASTER_B_DERIVED_NETWORK_DIR;
  }

  const userProfile = process.env.USERPROFILE;

  if (!userProfile) {
    return null;
  }

  return path.join(
    userProfile,
    "Desktop",
    "Pantavion-Verify",
    "master-b-derived-network-tiles",
  );
}

function sanitizeManifest(manifest: DerivedManifest) {
  const sortedTiles = [...(manifest.tiles ?? [])].sort(
    (a, b) => Number(b.segmentCount ?? 0) - Number(a.segmentCount ?? 0),
  );

  return {
    ok: Boolean(manifest.ok),
    type: manifest.type ?? "pantavion.master_b.derived_network_tiles",
    source: "MASTER_B_DERIVED_NETWORK",
    rawDxfIncluded: false,
    publicRawDxfAccess: false,
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

export async function GET() {
  const dir = getDerivedNetworkDir();

  if (!dir) {
    return NextResponse.json(
      {
        ok: false,
        error: "MASTER_B_DERIVED_NETWORK_DIR_NOT_CONFIGURED",
      },
      { status: 500 },
    );
  }

  const manifestPath = path.join(dir, "manifest.json");

  try {
    const raw = await fs.readFile(manifestPath, "utf8");
    const manifest = JSON.parse(raw) as DerivedManifest;

    return NextResponse.json(sanitizeManifest(manifest), {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Source": "master-b-derived-network",
        "X-Pantavion-Raw-DXF-Included": "false",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "MASTER_B_MANIFEST_READ_FAILED",
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}
