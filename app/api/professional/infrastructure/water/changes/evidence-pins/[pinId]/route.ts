import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRANSITIONS: Record<string, Set<string>> = {
  pending: new Set(["approved", "rejected", "superseded"]),
  approved: new Set(["superseded"]),
  rejected: new Set(["superseded"]),
  superseded: new Set(),
};

function clean(value: unknown, max = 2000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ pinId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { pinId } = await context.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("water_map_evidence_pins")
    .select("*")
    .eq("pin_id", pinId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!data) {
    return NextResponse.json(
      { ok: false, error: "water_evidence_pin_not_found" },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const visible =
    access.mode === "admin-session" ||
    data.created_by === access.actorRef ||
    data.review_state === "approved";

  if (!visible) {
    return NextResponse.json(
      { ok: false, error: "water_evidence_pin_not_visible" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(
    { ok: true, pin: data },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ pinId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok || access.mode !== "admin-session") {
    return NextResponse.json(
      { ok: false, error: "founder_or_admin_review_required" },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { pinId } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const nextState = clean(body.reviewState, 80);
    const decisionNote = clean(body.decisionNote, 2000) || null;

    if (!["approved", "rejected", "superseded"].includes(nextState)) {
      throw new Error("water_evidence_pin_review_state_invalid");
    }

    const admin = createAdminClient();
    const current = await admin
      .from("water_map_evidence_pins")
      .select("*")
      .eq("pin_id", pinId)
      .maybeSingle();

    if (current.error) throw current.error;
    if (!current.data) {
      return NextResponse.json(
        { ok: false, error: "water_evidence_pin_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (current.data.review_state === nextState) {
      return NextResponse.json(
        { ok: true, unchanged: true, pin: current.data },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const allowed =
      TRANSITIONS[current.data.review_state]?.has(nextState) ?? false;

    if (!allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_evidence_pin_transition_not_allowed",
          currentState: current.data.review_state,
          requestedState: nextState,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const now = new Date().toISOString();
    const { data, error } = await admin
      .from("water_map_evidence_pins")
      .update({
        review_state: nextState,
        reviewed_by: access.actorRef,
        reviewed_at: now,
        review_note: decisionNote,
      })
      .eq("pin_id", pinId)
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json(
      { ok: true, unchanged: false, pin: data },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "water_evidence_pin_review_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
