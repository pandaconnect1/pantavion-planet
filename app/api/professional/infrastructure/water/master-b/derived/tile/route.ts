import { NextRequest, NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import {
  WATER_MAP_B_DERIVED_STORAGE_BUCKET,
  waterMapBDerivedTilePath,
} from "@/core/water/water-map-b-derived-storage";
import { FINAL_MASTER_DWG_SHA256 } from "@/core/water/final-master-dwg-source";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizeMasterBTileFile(value: string): string | null {
  const normalized = value.trim().replaceAll("\\", "/");

  if (!normalized || normalized.includes("..")) {
    return null;
  }

  const withoutPrefix = normalized.startsWith("tiles/")
    ? normalized.slice("tiles/".length)
    : normalized;

  if (
    withoutPrefix.includes("/") ||
    withoutPrefix.includes("\\") ||
    !withoutPrefix.startsWith("master-b-tile-") ||
    !withoutPrefix.endsWith(".json")
  ) {
    return null;
  }

  return withoutPrefix;
}

function parseTileJson(raw: string): unknown {
  return JSON.parse(raw.replace(/\u001e/g, ""));
}

export async function GET(request: NextRequest) {
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

  const requestedFile = request.nextUrl.searchParams.get("file") || "";
  const tileName = normalizeMasterBTileFile(requestedFile);

  if (!tileName) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_TILE_FILE",
        rawDwgIncluded: false,
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const objectPath = waterMapBDerivedTilePath(tileName);

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(WATER_MAP_B_DERIVED_STORAGE_BUCKET)
      .download(objectPath);

    if (error || !data) {
      return NextResponse.json(
        {
          ok: false,
          error: "MAP_B_DERIVED_TILE_NOT_READY",
          tile: tileName,
          rawDwgIncluded: false,
        },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const tile = parseTileJson(await data.text());

    return NextResponse.json(
      {
        ...(tile && typeof tile === "object" ? tile : { data: tile }),
        sourceSha256: FINAL_MASTER_DWG_SHA256,
        rawDwgIncluded: false,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=60",
          "X-Pantavion-Source": "map-b-supabase-derived-network-tile",
          "X-Pantavion-Water-Access-Mode": access.mode,
          "X-Pantavion-Raw-DWG-Included": "false",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "MAP_B_TILE_READ_FAILED",
        tile: tileName,
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        rawDwgIncluded: false,
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
