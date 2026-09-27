import "server-only";

import { NextResponse } from "next/server";

import {
  validateWaterMapBAlignment,
  type WaterMapBAlignmentStatus,
  type WaterMapBControlPoint,
} from "@/core/water/water-map-b-alignment-contract";
import { calculateWaterMapBAffineTransform } from "@/core/water/water-map-b-affine-alignment";
import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "@/core/water/water-map-b-source-candidates";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set<WaterMapBAlignmentStatus>([
  "needs_review",
  "partially_georeferenced",
  "manually_aligned",
  "georeferenced",
  "field_confirmed",
  "approximate",
  "rejected",
]);

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function finite(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseSourceKey(value: unknown): WaterMapBSourceKey | null {
  if (
    value === "canonical-2026-andreaspap" ||
    value === "legacy-george-85m"
  ) {
    return value;
  }
  return null;
}

function parseControlPoints(value: unknown): WaterMapBControlPoint[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 200).map((entry, index) => {
    const point =
      entry && typeof entry === "object"
        ? (entry as Record<string, unknown>)
        : {};

    return {
      id: clean(point.id, 160) || `cp-${index + 1}`,
      sourceX: Number(point.sourceX),
      sourceY: Number(point.sourceY),
      longitude: Number(point.longitude),
      latitude: Number(point.latitude),
      accuracyMeters:
        point.accuracyMeters === null || point.accuracyMeters === undefined
          ? null
          : Number(point.accuracyMeters),
      provenance: clean(point.provenance, 1000),
    };
  });
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
    const sourceKey = parseSourceKey(url.searchParams.get("sourceKey"));
    const overlayOnly = url.searchParams.get("overlayAllowed") === "1";

    const admin = createAdminClient();
    let query = admin
      .from("water_map_alignments")
      .select("*")
      .order("created_at", { ascending: false });

    if (sourceKey) query = query.eq("source_key", sourceKey);
    if (overlayOnly) query = query.eq("overlay_allowed", true);

    const { data, error } = await query;
    if (error) throw error;

    const alignments =
      access.mode === "admin-session"
        ? data ?? []
        : (data ?? []).map((row) => ({
            alignment_id: row.alignment_id,
            map_id: row.map_id,
            source_key: row.source_key,
            source_sha256: row.source_sha256,
            source_crs: row.source_crs,
            target_crs: row.target_crs,
            transform_name: row.transform_name,
            rmse_meters: row.rmse_meters,
            max_residual_meters: row.max_residual_meters,
            status: row.status,
            evidence_validated: row.evidence_validated,
            overlay_allowed: row.overlay_allowed,
            reviewed_at: row.reviewed_at,
            created_at: row.created_at,
            updated_at: row.updated_at,
          }));

    return NextResponse.json(
      { ok: true, accessMode: access.mode, alignments },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "water_map_alignment_read_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok || access.mode !== "admin-session") {
    return NextResponse.json(
      { ok: false, error: "founder_or_admin_required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const sourceKey = parseSourceKey(body.sourceKey);

    if (!sourceKey) throw new Error("water_map_alignment_source_key_invalid");

    const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
    const sourceCrs = clean(body.sourceCrs, 160) || null;
    const targetCrs = clean(body.targetCrs, 160);
    const requestedTransformName =
      clean(body.transformName, 200) || "affine_2d_control_points_v1";
    const controlPoints = parseControlPoints(body.controlPoints);
    const calculated = calculateWaterMapBAffineTransform(controlPoints);
    const transformName = calculated.method;

    if (requestedTransformName !== transformName) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_map_alignment_transform_not_supported",
          supportedTransform: transformName,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const rmseMeters = calculated.rmseMeters;
    const maxResidualMeters = calculated.maxResidualMeters;

    const validation = validateWaterMapBAlignment({
      sourceKey,
      sourceCrs,
      targetCrs,
      controlPoints,
      rmseMeters,
      maxResidualMeters,
      transformName,
      sourceSha256: source.sha256,
    });

    if (!validation.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_map_alignment_evidence_invalid",
          validationErrors: validation.errors,
        },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const admin = createAdminClient();
    const versionLookup = await admin
      .from("water_map_versions")
      .select("version_id")
      .eq("source_fingerprint", source.sha256)
      .maybeSingle();

    if (versionLookup.error) throw versionLookup.error;

    const { data, error } = await admin
      .from("water_map_alignments")
      .insert({
        map_id: "B",
        source_key: sourceKey,
        source_sha256: source.sha256,
        map_version_id: versionLookup.data?.version_id || null,
        source_crs: sourceCrs,
        target_crs: targetCrs,
        transform_name: transformName,
        control_points: controlPoints,
        rmse_meters: rmseMeters,
        max_residual_meters: maxResidualMeters,
        transform_parameters: {
          method: calculated.method,
          longitude: calculated.longitude,
          latitude: calculated.latitude,
          controlPointCount: calculated.controlPointCount,
          residuals: calculated.residuals,
        },
        status: "needs_review",
        evidence_validated: true,
        overlay_allowed: false,
        created_by: access.actorRef,
        metadata: {
          sourceFileName: source.fileName,
          canonicalSource: source.canonical,
          validationContract: "2026-09-27.v2",
          noToleranceInvented: true,
          metricsCalculatedServerSide: true,
        },
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ok: true, alignment: data, validation },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "water_map_alignment_create_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
