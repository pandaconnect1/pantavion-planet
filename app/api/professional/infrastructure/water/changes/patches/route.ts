import "server-only";

import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import {
  assertPantavionWaterPatchGeometry,
  type PantavionWaterPatchGeometry,
} from "@/core/infrastructure/water/water-spatial-change-patch-contract";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ASSET_TYPES = new Set([
  "valve",
  "pipe",
  "network_extension",
  "service_connection",
  "meter",
  "fitting",
  "hydrant",
  "chamber",
  "fault",
  "leak",
  "repair",
  "road_reference",
  "zone",
  "general_update",
]);

const OPERATIONS = new Set(["create", "correct", "replace", "retire", "annotate"]);
const LOCATION_SOURCES = new Set([
  "gps",
  "assisted_gps",
  "wifi",
  "cell",
  "manual_map",
  "coordinate_entry",
  "snapped_to_network",
  "survey",
  "cad_gis",
  "official_plan",
  "unknown",
]);
const ACCURACY_STATES = new Set([
  "measured",
  "verified",
  "estimated",
  "approximate",
  "unknown",
]);

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function stringArray(value: unknown, maxItems = 100): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function finiteNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function geometryBounds(geometry: PantavionWaterPatchGeometry) {
  const pairs: Array<[number, number]> = [];

  if (geometry.type === "Point") {
    pairs.push(geometry.coordinates as [number, number]);
  } else if (geometry.type === "LineString") {
    pairs.push(...(geometry.coordinates as Array<[number, number]>));
  } else {
    for (const ring of geometry.coordinates as Array<Array<[number, number]>>) {
      pairs.push(...ring);
    }
  }

  if (!pairs.length) throw new Error("water_patch_geometry_empty");

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const [x, y] of pairs) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new Error("water_patch_coordinate_invalid");
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return { minX, minY, maxX, maxY };
}

function mutationFingerprint(input: {
  actorRef: string;
  clientMutationId: string;
  mapId: string;
  sourceKey: string | null;
  assetType: string;
  operation: string;
  geometry: PantavionWaterPatchGeometry;
  attributes: Record<string, unknown>;
}) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: 1,
        actorRef: input.actorRef,
        clientMutationId: input.clientMutationId,
        mapId: input.mapId,
        sourceKey: input.sourceKey,
        assetType: input.assetType,
        operation: input.operation,
        geometry: input.geometry,
        attributes: input.attributes,
      }),
    )
    .digest("hex");
}

export async function POST(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const clientMutationId = clean(body.clientMutationId, 200);
    const mapId = clean(body.mapId, 100);
    const sourceKey = clean(body.sourceKey, 160) || null;
    const assetType = clean(body.assetType, 80);
    const operation = clean(body.operation, 80);
    const location = objectValue(body.location);
    const attributes = objectValue(body.attributes);

    if (!clientMutationId) throw new Error("client_mutation_id_required");
    if (!mapId) throw new Error("map_id_required");
    if (!ASSET_TYPES.has(assetType)) throw new Error("asset_type_invalid");
    if (!OPERATIONS.has(operation)) throw new Error("operation_invalid");

    const locationSource = clean(location.source, 80);
    const accuracyState = clean(location.accuracyState, 80);
    if (!LOCATION_SOURCES.has(locationSource)) {
      throw new Error("location_source_invalid");
    }
    if (!ACCURACY_STATES.has(accuracyState)) {
      throw new Error("accuracy_state_invalid");
    }

    const accuracyMeters =
      location.accuracyMeters === undefined || location.accuracyMeters === null
        ? null
        : finiteNumber(location.accuracyMeters);
    if (
      location.accuracyMeters !== undefined &&
      location.accuracyMeters !== null &&
      (accuracyMeters === null || accuracyMeters < 0)
    ) {
      throw new Error("accuracy_meters_invalid");
    }

    const geometry = body.geometry as PantavionWaterPatchGeometry;
    assertPantavionWaterPatchGeometry(geometry);
    const bbox = geometryBounds(geometry);

    const fingerprint = mutationFingerprint({
      actorRef: access.actorRef,
      clientMutationId,
      mapId,
      sourceKey,
      assetType,
      operation,
      geometry,
      attributes,
    });

    const admin = createAdminClient();
    const record = {
      asset_type: assetType,
      operation,
      status: "pending_review",
      map_id: mapId,
      source_key: sourceKey,
      source_map_version_id: clean(body.sourceMapVersionId, 100) || null,
      geometry_type: geometry.type,
      geometry,
      crs_authority: geometry.crs.authority,
      crs_code: geometry.crs.code,
      bbox_min_x: bbox.minX,
      bbox_min_y: bbox.minY,
      bbox_max_x: bbox.maxX,
      bbox_max_y: bbox.maxY,
      location_source: locationSource,
      accuracy_state: accuracyState,
      accuracy_meters: accuracyMeters,
      street_name: clean(location.streetName, 500) || null,
      area: clean(location.area, 500) || null,
      postal_code: clean(location.postalCode, 80) || null,
      parcel_reference: clean(location.parcelReference, 200) || null,
      technical_address_id: clean(location.technicalAddressId, 200) || null,
      snapped_asset_id: clean(location.snappedAssetId, 200) || null,
      attributes,
      evidence_refs: stringArray(body.evidenceRefs),
      artifact_refs: stringArray(body.artifactRefs),
      related_job_ids: stringArray(body.relatedJobIds),
      related_report_ids: stringArray(body.relatedReportIds),
      created_by: access.actorRef,
      source_device_id: access.deviceId,
      source_network_version: clean(body.sourceNetworkVersion, 200) || null,
      immutable_fingerprint: fingerprint,
      supersedes_patch_id: clean(body.supersedesPatchId, 100) || null,
      metadata: {
        clientMutationId,
        accessMode: access.mode,
        submittedAt: new Date().toISOString(),
      },
    };

    const { data, error } = await admin
      .from("water_spatial_patches")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await admin
          .from("water_spatial_patches")
          .select("*")
          .eq("immutable_fingerprint", fingerprint)
          .maybeSingle();

        if (!existing.error && existing.data) {
          return NextResponse.json(
            { ok: true, deduplicated: true, patch: existing.data },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      }
      throw error;
    }

    return NextResponse.json(
      { ok: true, deduplicated: false, patch: data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_spatial_patch_create_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function GET(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const url = new URL(request.url);
    const mapId = clean(url.searchParams.get("mapId"), 100);
    const sourceKey = clean(url.searchParams.get("sourceKey"), 160);
    const mine = url.searchParams.get("mine") === "1";
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") || 200), 1),
      500,
    );

    const minX = finiteNumber(url.searchParams.get("minX"));
    const minY = finiteNumber(url.searchParams.get("minY"));
    const maxX = finiteNumber(url.searchParams.get("maxX"));
    const maxY = finiteNumber(url.searchParams.get("maxY"));
    const hasBbox =
      minX !== null && minY !== null && maxX !== null && maxY !== null;

    const admin = createAdminClient();
    let query = admin
      .from("water_spatial_patches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (mapId) query = query.eq("map_id", mapId);
    if (sourceKey) query = query.eq("source_key", sourceKey);

    if (mine) {
      query = query.eq("created_by", access.actorRef);
    } else if (access.mode !== "admin-session") {
      query = query.in("status", [
        "approved_overlay",
        "officialization_candidate",
        "officialized",
      ]);
    }

    if (hasBbox) {
      query = query
        .lte("bbox_min_x", maxX)
        .gte("bbox_max_x", minX)
        .lte("bbox_min_y", maxY)
        .gte("bbox_max_y", minY);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        accessMode: access.mode,
        mine,
        patches: data ?? [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_spatial_patch_read_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
