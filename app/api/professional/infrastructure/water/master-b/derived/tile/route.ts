import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function isSafeTileName(value: string): boolean {
  return /^tile_\d{2}_\d{2}\.json$/.test(value);
}

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const requestedFile = url.searchParams.get("file") ?? "";
  const tileName = path.basename(requestedFile);

  if (!isSafeTileName(tileName)) {
    return NextResponse.json(
      {
        ok: false,
        error: "INVALID_TILE_NAME",
      },
      { status: 400 },
    );
  }

  const tilePath = path.join(dir, "tiles", tileName);

  try {
    const raw = await fs.readFile(tilePath, "utf8");
    const tile = JSON.parse(raw) as unknown;

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
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
      },
      { status: 500 },
    );
  }
}
