import "server-only";

import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clean(value: unknown, max = 1000) {
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

function fingerprint(input: {
  actorRef: string;
  clientMutationId: string;
  mapId: string;
  sourceKey: string | null;
  x: number;
  y: number;
  artifactRefs: string[];
  note: string | null;
}) {
  return createHash("sha256")
    .update(JSON.stringify({ version: 1, ...input }))
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
    const crsAuthority = clean(body.crsAuthority, 20);
    const crsCode = clean(body.crsCode, 40);
    const x = finiteNumber(body.x);
    const y = finiteNumber(body.y);
    const accuracyMeters =
      body.accuracyMeters === undefined || body.accuracyMeters === null
        ? null
        : finiteNumber(body.accuracyMeters);
    const artifactRefs = stringArray(body.artifactRefs);
    const note = clean(body.note, 5000) || null;

    if (!clientMutationId) throw new Error("client_mutation_id_required");
    if (!mapId) throw new Error("map_id_required");
    if (!crsAuthority || !crsCode) throw new Error("crs_required");
    if (x === null || y === null) throw new Error("evidence_pin_coordinate_invalid");
    if (
      body.accuracyMeters !== undefined &&
      body.accuracyMeters !== null &&
      (accuracyMeters === null || accuracyMeters < 0)
    ) {
      throw new Error("accuracy_meters_invalid");
    }

    const locationSource = clean(body.locationSource, 80) || "unknown";
    const accuracyState = clean(body.accuracyState, 80) || "unknown";
    const pinFingerprint = fingerprint({
      actorRef: access.actorRef,
      clientMutationId,
      mapId,
      sourceKey,
      x,
      y,
      artifactRefs,
      note,
    });

    const admin = createAdminClient();
    const record = {
      map_id: mapId,
      source_key: sourceKey,
      map_version_id: clean(body.mapVersionId, 100) || null,
      linked_patch_id: clean(body.linkedPatchId, 100) || null,
      x,
      y,
      crs_authority: crsAuthority,
      crs_code: crsCode,
      location_source: locationSource,
      accuracy_state: accuracyState,
      accuracy_meters: accuracyMeters,
      street_name: clean(body.streetName, 500) || null,
      technical_address_id: clean(body.technicalAddressId, 200) || null,
      note,
      artifact_refs: artifactRefs,
      ai_observation: objectValue(body.aiObservation),
      review_state: "pending",
      created_by: access.actorRef,
      source_device_id: access.deviceId,
      immutable_fingerprint: pinFingerprint,
    };

    const { data, error } = await admin
      .from("water_map_evidence_pins")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await admin
          .from("water_map_evidence_pins")
          .select("*")
          .eq("immutable_fingerprint", pinFingerprint)
          .maybeSingle();

        if (!existing.error && existing.data) {
          return NextResponse.json(
            { ok: true, deduplicated: true, pin: existing.data },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      }
      throw error;
    }

    return NextResponse.json(
      { ok: true, deduplicated: false, pin: data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_evidence_pin_create_failed",
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
      .from("water_map_evidence_pins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (mapId) query = query.eq("map_id", mapId);
    if (sourceKey) query = query.eq("source_key", sourceKey);

    if (mine) {
      query = query.eq("created_by", access.actorRef);
    } else if (access.mode !== "admin-session") {
      query = query.eq("review_state", "approved");
    }

    if (hasBbox) {
      query = query
        .gte("x", minX)
        .lte("x", maxX)
        .gte("y", minY)
        .lte("y", maxY);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      {
        ok: true,
        accessMode: access.mode,
        mine,
        pins: data ?? [],
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_evidence_pin_read_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
