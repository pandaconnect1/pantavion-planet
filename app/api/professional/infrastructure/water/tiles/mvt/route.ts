import { createHash } from "crypto";

import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import {
  createAdminClient,
  hasSupabaseAdminCredential,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

function tileResponse(bytes: Buffer, mapId: string, accessMode: string) {
  return new Response(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.mapbox-vector-tile",
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
      "X-Pantavion-Water-Tile": "postgis-mvt-v1",
      "X-Pantavion-Water-Map": mapId,
      "X-Pantavion-Water-Access-Mode": accessMode,
      "X-Pantavion-Raw-Master": "not-included",
    },
  });
}

export async function GET(request: Request) {
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

  const adminAuthorized = await hasWaterAdminAuthorization(request);
  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(
    request.headers.get("x-pantavion-water-device-token"),
  );
  const tokenHash = deviceToken ? hashToken(deviceToken) : "";

  // Founder/admin can use the internal primitive when a server credential is
  // configured. This remains provider-side and is never sent to the browser.
  if (adminAuthorized && hasSupabaseAdminCredential()) {
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

      if (!error && typeof data === "string") {
        return tileResponse(
          Buffer.from(data, "base64"),
          mapId,
          "admin-session",
        );
      }
    } catch {
      // Continue to the device-scoped database authorization path.
    }
  }

  // Railway-safe production path: the narrowly-scoped SECURITY DEFINER RPC
  // validates the exact approved device + token hash inside Postgres before
  // it can call the private MVT primitive. No service-role key is required.
  if (deviceId && tokenHash) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.rpc(
        "pantavion_water_mvt_tile_device_v1",
        {
          p_device_id: deviceId,
          p_token_hash: tokenHash,
          p_map_id: mapId,
          p_z: z,
          p_x: x,
          p_y: y,
        },
      );

      if (!error && data && typeof data === "object") {
        const payload = data as Record<string, unknown>;

        if (payload.error === "access_not_approved") {
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

        if (
          payload.status === "tile_ready" &&
          typeof payload.tileBase64 === "string"
        ) {
          return tileResponse(
            Buffer.from(payload.tileBase64, "base64"),
            mapId,
            "approved-device",
          );
        }
      }
    } catch {
      // Fail closed below.
    }
  }

  return NextResponse.json(
    {
      status: adminAuthorized ? "tile_error" : "access_denied",
      error: adminAuthorized
        ? "water_mvt_backend_unavailable"
        : "access_not_approved",
      tileReturned: false,
      rawMasterReturned: false,
    },
    {
      status: adminAuthorized ? 503 : 403,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Tile": adminAuthorized
          ? "backend-unavailable"
          : "access-denied",
        "X-Pantavion-Raw-Master": "not-included",
      },
    },
  );
}
