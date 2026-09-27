import "server-only";

import { NextResponse } from "next/server";

import {
  canEnableWaterMapBGeographicOverlay,
  type WaterMapBAlignmentStatus,
} from "@/core/water/water-map-b-alignment-contract";
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

export async function GET(
  request: Request,
  context: { params: Promise<{ alignmentId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { alignmentId } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("water_map_alignments")
    .select("*")
    .eq("alignment_id", alignmentId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "water_map_alignment_not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const alignment =
    access.mode === "admin-session"
      ? data
      : {
          alignment_id: data.alignment_id,
          map_id: data.map_id,
          source_key: data.source_key,
          source_sha256: data.source_sha256,
          source_crs: data.source_crs,
          target_crs: data.target_crs,
          transform_name: data.transform_name,
          rmse_meters: data.rmse_meters,
          max_residual_meters: data.max_residual_meters,
          status: data.status,
          evidence_validated: data.evidence_validated,
          overlay_allowed: data.overlay_allowed,
          reviewed_at: data.reviewed_at,
          updated_at: data.updated_at,
        };

  return NextResponse.json(
    { ok: true, accessMode: access.mode, alignment },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ alignmentId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok || access.mode !== "admin-session") {
    return NextResponse.json(
      { ok: false, error: "founder_or_admin_review_required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { alignmentId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const status = clean(body.status, 80) as WaterMapBAlignmentStatus;
    const reviewNote = clean(body.reviewNote, 4000) || null;
    const requestedOverlayAllowed = body.overlayAllowed === true;

    if (!STATUSES.has(status)) {
      throw new Error("water_map_alignment_status_invalid");
    }

    const admin = createAdminClient();
    const current = await admin
      .from("water_map_alignments")
      .select("*")
      .eq("alignment_id", alignmentId)
      .maybeSingle();

    if (current.error) throw current.error;
    if (!current.data) {
      return NextResponse.json(
        { ok: false, error: "water_map_alignment_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const now = new Date().toISOString();
    const overlayAllowed =
      requestedOverlayAllowed &&
      canEnableWaterMapBGeographicOverlay({
        status,
        evidenceValidated: current.data.evidence_validated === true,
        reviewedBy: access.actorRef,
        reviewedAt: now,
      });

    if (requestedOverlayAllowed && !overlayAllowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_map_alignment_overlay_not_allowed",
          status,
          evidenceValidated: current.data.evidence_validated === true,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const { data, error } = await admin
      .from("water_map_alignments")
      .update({
        status,
        overlay_allowed: overlayAllowed,
        reviewed_by: access.actorRef,
        reviewed_at: now,
        review_note: reviewNote,
      })
      .eq("alignment_id", alignmentId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ok: true, alignment: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "water_map_alignment_review_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
