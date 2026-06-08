import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";

function getMasterBDerivedNetworkDir(): string | null {
  const configured = process.env.MASTER_B_DERIVED_NETWORK_DIR?.trim();

  if (!configured) {
    return null;
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

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
  const clean = raw.replace(/\u001e/g, "");
  return JSON.parse(clean);
}

export async function GET(request: NextRequest) {
  const dir = getMasterBDerivedNetworkDir();

  if (!dir) {
    return NextResponse.json(
      {
        ok: false,
        error: "MASTER_B_DERIVED_NETWORK_DIR_NOT_CONFIGURED",
      },
      { status: 500 },
    );
  }

  const requestedFile = request.nextUrl.searchParams.get("file") || "";
  const tileName = normalizeMasterBTileFile(requestedFile);

  if (!tileName) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_TILE_FILE",
        requestedFile,
      },
      { status: 400 },
    );
  }

  const tilePath = path.join(dir, "tiles", tileName);

  try {
    const raw = await fs.readFile(tilePath, "utf8");
    const tile = parseTileJson(raw);

    return NextResponse.json(tile, {
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Source": "master-b-derived-network-tile",
        "X-Pantavion-Raw-DXF-Included": "false",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "MASTER_B_TILE_READ_FAILED",
        tile: tileName,
        path: tilePath,
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}
