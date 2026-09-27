import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_REVIEW_STATUSES = new Set([
  "pending_review",
  "approved_overlay",
  "officialization_candidate",
  "officialized",
  "conflict",
  "rejected",
  "superseded",
]);

const TRANSITIONS: Record<string, Set<string>> = {
  local_only: new Set(["pending_review", "superseded"]),
  pending_review: new Set(["approved_overlay", "conflict", "rejected", "superseded"]),
  approved_overlay: new Set([
    "officialization_candidate",
    "conflict",
    "superseded",
  ]),
  officialization_candidate: new Set(["officialized", "conflict", "superseded"]),
  officialized: new Set(["superseded"]),
  conflict: new Set(["pending_review", "approved_overlay", "rejected", "superseded"]),
  rejected: new Set(["superseded"]),
  superseded: new Set(),
};

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ patchId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { patchId } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("water_spatial_patches")
    .select("*")
    .eq("patch_id", patchId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "water_patch_not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const visible =
    access.mode === "admin-session" ||
    data.created_by === access.actorRef ||
    ["approved_overlay", "officialization_candidate", "officialized"].includes(
      data.status,
    );

  if (!visible) {
    return NextResponse.json(
      { ok: false, error: "water_patch_not_visible" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, patch: data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ patchId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok || access.mode !== "admin-session") {
    return NextResponse.json(
      { ok: false, error: "founder_or_admin_review_required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { patchId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const nextStatus = clean(body.status, 80);
    const decisionNote = clean(body.decisionNote, 2000) || null;

    if (!ALLOWED_REVIEW_STATUSES.has(nextStatus)) {
      throw new Error("water_patch_review_status_invalid");
    }

    const admin = createAdminClient();
    const current = await admin
      .from("water_spatial_patches")
      .select("*")
      .eq("patch_id", patchId)
      .maybeSingle();

    if (current.error) throw current.error;
    if (!current.data) {
      return NextResponse.json(
        { ok: false, error: "water_patch_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (current.data.status === nextStatus) {
      return NextResponse.json(
        { ok: true, unchanged: true, patch: current.data },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const allowed = TRANSITIONS[current.data.status]?.has(nextStatus) ?? false;
    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_patch_transition_not_allowed",
          currentStatus: current.data.status,
          requestedStatus: nextStatus,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const now = new Date().toISOString();
    const update = {
      status: nextStatus,
      reviewed_by: access.actorRef,
      reviewed_at: now,
      decision_note: decisionNote,
    };

    const { data, error } = await admin
      .from("water_spatial_patches")
      .update(update)
      .eq("patch_id", patchId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ok: true, unchanged: false, patch: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_patch_review_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
