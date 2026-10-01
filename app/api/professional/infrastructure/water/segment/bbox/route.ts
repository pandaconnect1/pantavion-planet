import { createHash } from "crypto";

import { NextResponse } from "next/server";

import {
  getControlledWaterSegmentFromPrivateIndex,
  getWaterSegmentDiagnosticCode,
  parseWaterSegmentBbox,
  parseWaterSegmentLimit,
} from "@/core/infrastructure/water/controlled-water-segment-index-provider";
import { getWaterDeviceClaimFromRequest } from "@/core/security/water-device-session";
import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";
import {
  createAdminClient,
  hasSupabaseAdminCredential,
} from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// PANTAVION_MAP_A_SUPABASE_LIVE_BRIDGE_V1

type WaterSegmentAccessDecision =
  | {
      ok: true;
      mode: "admin-session" | "approved-device";
    }
  | {
      ok: false;
      error: "access_not_approved";
    };

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function authorizeWaterSegmentRequest(request: Request): Promise<WaterSegmentAccessDecision> {
  const cookieClaim = getWaterDeviceClaimFromRequest(request);
  const deviceId =
    clean(request.headers.get("x-pantavion-water-device-id")) || cookieClaim.deviceId;
  const deviceToken =
    clean(request.headers.get("x-pantavion-water-device-token")) || cookieClaim.deviceToken;

  if (await hasWaterAdminAuthorization(request)) {
    return {
      ok: true,
      mode: "admin-session",
    };
  }

  const deviceApproved = await migrateLegacyApprovedDeviceIfPresent(
    deviceId,
    hashToken(deviceToken),
  );

  if (deviceApproved) {
    return {
      ok: true,
      mode: "approved-device",
    };
  }

  return {
    ok: false,
    error: "access_not_approved",
  };
}

export async function GET(request: Request) {
  const access = await authorizeWaterSegmentRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      {
        status: "access_denied",
        error: access.error,
        dataReturned: false,
        segmentReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        browserFullNetworkLoaded: false,
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "access-denied",
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }

  try {
    const url = new URL(request.url);
    const bbox = parseWaterSegmentBbox(url.searchParams);
    const maxFeatures = parseWaterSegmentLimit(url.searchParams);

    const cookieClaim = getWaterDeviceClaimFromRequest(request);
    const deviceId =
      clean(request.headers.get("x-pantavion-water-device-id")) || cookieClaim.deviceId;
    const deviceToken =
      clean(request.headers.get("x-pantavion-water-device-token")) || cookieClaim.deviceToken;

    // Primary GIS production path: server-authorized PostGIS Feature API.
    // The browser never receives the raw/full master and never sees provider credentials.
    if (hasSupabaseAdminCredential()) {
      try {
        const admin = createAdminClient();
        const { data: postgisData, error: postgisError } = await admin.rpc(
          "pantavion_water_features_bbox_internal_v1",
          {
            p_map_id: "A",
            p_min_lng: bbox.minLng,
            p_min_lat: bbox.minLat,
            p_max_lng: bbox.maxLng,
            p_max_lat: bbox.maxLat,
            p_max_features: maxFeatures,
          },
        );

        if (!postgisError && postgisData) {
          return NextResponse.json(postgisData, {
            status: 200,
            headers: {
              "Cache-Control": "private, max-age=30, stale-while-revalidate=30",
              "X-Pantavion-Water-Segment": "postgis-feature-api-v1",
              "X-Pantavion-Water-Access-Mode": access.mode,
              "X-Pantavion-Data-Returned": "segment-only",
              "X-Pantavion-Raw-Master": "not-included",
            },
          });
        }
      } catch {
        // Keep the established protected fallbacks for continuity.
      }
    }

    if (deviceId && deviceToken) {
      // Railway-safe PostGIS path: the exact approved device + token hash is
      // revalidated inside Postgres before the private spatial primitive runs.
      try {
        const supabase = await createClient();
        const { data: postgisDeviceData, error: postgisDeviceError } =
          await supabase.rpc("pantavion_water_features_bbox_device_v1", {
            p_device_id: deviceId,
            p_token_hash: hashToken(deviceToken),
            p_map_id: "A",
            p_min_lng: bbox.minLng,
            p_min_lat: bbox.minLat,
            p_max_lng: bbox.maxLng,
            p_max_lat: bbox.maxLat,
            p_max_features: maxFeatures,
          });

        if (!postgisDeviceError && postgisDeviceData) {
          const payload = postgisDeviceData as Record<string, unknown>;
          const denied = payload.error === "access_not_approved";

          return NextResponse.json(payload, {
            status: denied ? 403 : 200,
            headers: {
              "Cache-Control": denied
                ? "no-store"
                : "private, max-age=30, stale-while-revalidate=30",
              "X-Pantavion-Water-Segment": denied
                ? "postgis-device-access-denied"
                : "postgis-feature-api-device-v1",
              "X-Pantavion-Water-Access-Mode": access.mode,
              "X-Pantavion-Data-Returned": denied ? "false" : "segment-only",
              "X-Pantavion-Raw-Master": "not-included",
            },
          });
        }
      } catch {
        // Continue to the established scoped segment RPC below.
      }

      // Established continuity path. It also validates the exact approved
      // device and returns only the requested viewport segment.
      try {
        const supabase = await createClient();
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "pantavion_water_map_a_segment_v2",
          {
            p_device_id: deviceId,
            p_token_hash: hashToken(deviceToken),
            p_min_lng: bbox.minLng,
            p_min_lat: bbox.minLat,
            p_max_lng: bbox.maxLng,
            p_max_lat: bbox.maxLat,
            p_max_features: maxFeatures,
          },
        );

        if (!rpcError && rpcData) {
          const payload = rpcData as Record<string, unknown>;
          const denied = payload.error === "access_not_approved";

          return NextResponse.json(payload, {
            status: denied ? 403 : 200,
            headers: {
              "Cache-Control": "no-store",
              "X-Pantavion-Water-Segment": "supabase-rpc-index-v2",
              "X-Pantavion-Water-Access-Mode": access.mode,
              "X-Pantavion-Data-Returned": denied ? "false" : "segment-only",
            },
          });
        }
      } catch {
        // Fall through to the existing Edge Function/private-index continuity
        // paths. Production remains fail-closed if every backend is unavailable.
      }

      const directUrl = new URL(
        "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-map-a-live-segment",
      );

      directUrl.searchParams.set("minLng", String(bbox.minLng));
      directUrl.searchParams.set("minLat", String(bbox.minLat));
      directUrl.searchParams.set("maxLng", String(bbox.maxLng));
      directUrl.searchParams.set("maxLat", String(bbox.maxLat));
      directUrl.searchParams.set("maxFeatures", String(maxFeatures));

      const directResponse = await fetch(directUrl, {
        cache: "no-store",
        headers: {
          "x-pantavion-water-device-id": deviceId,
          "x-pantavion-water-device-token": deviceToken,
        },
      });

      const directJson = await directResponse.json().catch(() => null);

      if (directResponse.ok && directJson) {
        return NextResponse.json(directJson, {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
            "X-Pantavion-Water-Segment": "supabase-private-index-authentic-source",
            "X-Pantavion-Water-Access-Mode": access.mode,
            "X-Pantavion-Data-Returned": "segment-only",
          },
        });
      }

      if (directResponse.status === 400 || directResponse.status === 403) {
        return NextResponse.json(
          directJson || {
            status: "segment_error",
            error: "water_segment_unavailable",
            diagnosticCode:
              directResponse.status === 403 ? "WATER_ACCESS" : "WATER_BBOX",
            dataReturned: false,
            segmentReturned: false,
            completeNetworkReturned: false,
            rawMasterReturned: false,
            browserFullNetworkLoaded: false,
          },
          {
            status: directResponse.status,
            headers: {
              "Cache-Control": "no-store",
              "X-Pantavion-Water-Segment": "supabase-direct-rejected",
              "X-Pantavion-Water-Access-Mode": access.mode,
              "X-Pantavion-Data-Returned": "false",
            },
          },
        );
      }
    }

    const result = await getControlledWaterSegmentFromPrivateIndex(bbox, maxFeatures);

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Segment": "private-index-authentic-source",
        "X-Pantavion-Water-Access-Mode": access.mode,
        "X-Pantavion-Data-Returned": "segment-only",
      },
    });
  } catch (error) {
    const diagnosticCode = getWaterSegmentDiagnosticCode(error);
    const responseStatus = diagnosticCode === "WATER_BBOX" ? 400 : 503;

    return NextResponse.json(
      {
        status: "segment_error",
        error: "water_segment_unavailable",
        diagnosticCode,
        dataReturned: false,
        segmentReturned: false,
        completeNetworkReturned: false,
        rawMasterReturned: false,
        browserFullNetworkLoaded: false,
      },
      {
        status: responseStatus,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Segment": "error",
          "X-Pantavion-Water-Diagnostic": diagnosticCode,
          "X-Pantavion-Data-Returned": "false",
        },
      },
    );
  }
}
