import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = new Set([
  "received",
  "inspected",
  "candidate",
  "approved_reference",
  "superseded_reference",
  "archived",
]);

function clean(value: unknown, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function stringArray(value: unknown, maxItems = 100): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

    const admin = createAdminClient();
    let query = admin
      .from("water_map_versions")
      .select(
        access.mode === "admin-session"
          ? "*"
          : "version_id,map_id,source_key,version_number,label,status,source_date,crs_authority,crs_code,immutable_source,deleted_automatically,notes,metadata,created_at,updated_at",
      )
      .order("version_number", { ascending: false });

    if (mapId) query = query.eq("map_id", mapId);
    if (sourceKey) query = query.eq("source_key", sourceKey);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { ok: true, accessMode: access.mode, versions: data ?? [] },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_map_versions_read_failed",
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
    const mapId = clean(body.mapId, 100);
    const sourceKey = clean(body.sourceKey, 160);
    const label = clean(body.label, 500);
    const status = clean(body.status, 80) || "candidate";
    const sourceRef = clean(body.sourceRef, 2000);
    const sourceFingerprint = clean(body.sourceFingerprint, 200);
    const versionNumber = Number(body.versionNumber);

    if (!mapId || !sourceKey || !label || !sourceRef || !sourceFingerprint) {
      throw new Error("water_map_version_required_fields_missing");
    }
    if (!Number.isInteger(versionNumber) || versionNumber < 1) {
      throw new Error("water_map_version_number_invalid");
    }
    if (!STATUSES.has(status)) {
      throw new Error("water_map_version_status_invalid");
    }

    const admin = createAdminClient();
    const record = {
      map_id: mapId,
      source_key: sourceKey,
      version_number: versionNumber,
      label,
      status,
      source_ref: sourceRef,
      source_fingerprint: sourceFingerprint,
      storage_bucket: clean(body.storageBucket, 300) || null,
      storage_path: clean(body.storagePath, 2000) || null,
      source_date: clean(body.sourceDate, 40) || null,
      received_by: access.actorRef,
      crs_authority: clean(body.crsAuthority, 20) || null,
      crs_code: clean(body.crsCode, 40) || null,
      immutable_source: true,
      deleted_automatically: false,
      notes: stringArray(body.notes),
      metadata: {
        ...objectValue(body.metadata),
        registeredByAccessMode: access.mode,
      },
    };

    const { data, error } = await admin
      .from("water_map_versions")
      .insert(record)
      .select("*")
      .single();

    if (error) {
      if (error.code === "23505") {
        const existing = await admin
          .from("water_map_versions")
          .select("*")
          .eq("source_fingerprint", sourceFingerprint)
          .maybeSingle();

        if (!existing.error && existing.data) {
          return NextResponse.json(
            { ok: true, deduplicated: true, version: existing.data },
            { headers: { "Cache-Control": "no-store" } },
          );
        }
      }
      throw error;
    }

    return NextResponse.json(
      { ok: true, deduplicated: false, version: data },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "water_map_version_create_failed",
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
