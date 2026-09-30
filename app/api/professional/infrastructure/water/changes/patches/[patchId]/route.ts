import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import {\n  getWaterSpatialPatchViaBridge,\n  reviewWaterSpatialPatchViaBridge,\n} from "@/core/water/water-db-bridge";

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

  try {
    const result = await getWaterSpatialPatchViaBridge(patchId);

    if (!result.ok || !result.patch) {
      return NextResponse.json(
        { ok: false, error: result.error || "water_patch_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const data = result.patch;

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
  } catch {
    return NextResponse.json(
      { ok: false, error: "water_patch_read_failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
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

    const result = await reviewWaterSpatialPatchViaBridge({
      patchId,
      nextStatus,
      decisionNote,
      reviewedBy: access.actorRef,
    });

    if (!result.ok) {
      const status = result.error === "water_patch_not_found"
        ? 404
        : result.error === "water_patch_transition_not_allowed"
          ? 409
          : 400;

      return NextResponse.json(result, {
        status,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
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
