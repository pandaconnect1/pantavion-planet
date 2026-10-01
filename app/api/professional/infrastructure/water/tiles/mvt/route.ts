import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";
import {
  createAdminClient,
  hasSupabaseAdminCredential,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function parseInteger(value: string | null) {
  if (!value || !/^\d+$/.test(value)) return null;

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function authorizeWaterTileRequest(request: Request) {
  if (await hasWaterAdminAuthorization(request)) return true;

  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(
    request.headers.get("x-pantavion-water-device-token"),
  );

  if (!deviceId || !deviceToken) return false;

  return migrateLegacyApprovedDeviceIfPresent(
    deviceId,
    hashToken(deviceToken),
  );
}

export async function GET(request: Request) {
  if (!(await authorizeWaterTileRequest(request))) {
    return NextResponse.json(
      {
        status: "access_denied",
        error: "access_not_approved",
        tileReturned: false,
        rawMasterReturned: false,
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Tile": "access-denied",
          "X-Pantavion-Raw-Master": "not-included",
        },
      },
    );
  }

  const url = new URL(request.url);
  const mapId = clean(url.searchParams.get("mapId") || "A").toUpperCase();
  const z = parseInteger(url.searchParams.get("z"));
  const x = parseInteger(url.searchParams.get("x"));
  const y = parseInteger(url.searchParams.get("y"));

  if (
    mapId !== "A" ||
    z === null ||
    x === null ||
    y === null ||
    z < 0 ||
    z > 22 ||
    x < 0 ||
    y < 0 ||
    x >= 2 ** z ||
    y >= 2 ** z
  ) {
    return NextResponse.json(
      {
        status: "tile_error",
        error: "invalid_tile_request",
        tileReturned: false,
        rawMasterReturned: false,
      },
      {
        status: 400,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Tile": "invalid-request",
          "X-Pantavion-Raw-Master": "not-included",
        },
      },
    );
  }

  if (!hasSupabaseAdminCredential()) {
    return NextResponse.json(
      {
        status: "tile_error",
        error: "water_mvt_backend_unavailable",
        tileReturned: false,
        rawMasterReturned: false,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Tile": "backend-unavailable",
          "X-Pantavion-Raw-Master": "not-included",
        },
      },
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc(
      "pantavion_water_mvt_tile_internal_v1",
      {
        p_map_id: mapId,
        p_z: z,
        p_x: x,
        p_y: y,
      },
    );

    if (error || typeof data !== "string") {
      throw error || new Error("water_mvt_payload_invalid");
    }

    const bytes = Buffer.from(data, "base64");

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.mapbox-vector-tile",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
        "X-Pantavion-Water-Tile": "postgis-mvt-v1",
        "X-Pantavion-Water-Map": mapId,
        "X-Pantavion-Raw-Master": "not-included",
      },
    });
  } catch {
    return NextResponse.json(
      {
        status: "tile_error",
        error: "water_mvt_generation_failed",
        tileReturned: false,
        rawMasterReturned: false,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Tile": "generation-failed",
          "X-Pantavion-Raw-Master": "not-included",
        },
      },
    );
  }
}
