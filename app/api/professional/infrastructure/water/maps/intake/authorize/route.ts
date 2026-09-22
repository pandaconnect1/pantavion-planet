import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import {
  PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES,
  PANTAVION_ARTIFACT_TUS_CHUNK_BYTES,
  PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES,
} from "@/core/intake/pantavion-artifact-storage-policy";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";
import { classifyWaterMapArtifact } from "@/core/water/water-map-format-registry";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "water-map-ingest-private";
const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const APPROVED_DEVICE_MAX_BYTES = 512 * 1024 * 1024;
const APPROVED_DEVICE_PENDING_LIMIT = 3;

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function noStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

function safeFileName(value: string) {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\\/\0\r\n]+/g, "-")
    .replace(/[^\p{L}\p{N}._()\- ]+/gu, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(-180);
  return normalized || "water-map.bin";
}

function configuredSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    CANONICAL_SUPABASE_URL
  );
}

function tusEndpointFor(url: string) {
  const parsed = new URL(url);
  const projectRef = parsed.hostname.split(".")[0];
  if (!/^[a-z0-9-]{8,80}$/i.test(projectRef)) {
    throw new Error("water_map_supabase_project_ref_invalid");
  }
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

function databaseAdapterState(
  state: ReturnType<typeof classifyWaterMapArtifact>["adapterState"],
) {
  if (state === "known_adapter" || state === "convert") return "known_adapter";
  if (state === "adapter_required") return "adapter_required";
  return "raw_only";
}

function initialIngestState(
  state: ReturnType<typeof classifyWaterMapArtifact>["adapterState"],
) {
  return state === "quarantine" ? "quarantined" : "awaiting_upload";
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeWaterMapIngestActor(request);
    if (!actor.ok) {
      return noStore(
        { ok: false, error: actor.error },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return noStore(
        { ok: false, error: "water_map_upload_payload_invalid" },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;
    const fileName = clean(input.fileName, 512);
    const fileSize = typeof input.fileSize === "number" ? input.fileSize : Number.NaN;
    const mimeType =
      clean(input.mimeType, 200) || "application/octet-stream";
    const firstBytesBase64 = clean(input.firstBytesBase64, 4096) || null;
    const coordinateReferenceSystem =
      clean(input.coordinateReferenceSystem, 120) || null;

    if (!fileName || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
      return noStore(
        { ok: false, error: "water_map_upload_payload_invalid" },
        { status: 400 },
      );
    }

    const maxBytes =
      actor.kind === "admin_session"
        ? PANTAVION_ARTIFACT_UPLOAD_MAX_BYTES
        : APPROVED_DEVICE_MAX_BYTES;

    if (fileSize > maxBytes) {
      return noStore(
        {
          ok: false,
          error: "water_map_upload_size_exceeded",
          maxBytes,
        },
        { status: 413 },
      );
    }

    if (firstBytesBase64) {
      let decoded: Buffer;
      try {
        decoded = Buffer.from(firstBytesBase64, "base64");
      } catch {
        return noStore(
          { ok: false, error: "water_map_header_sample_invalid" },
          { status: 400 },
        );
      }
      if (decoded.byteLength > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES) {
        return noStore(
          { ok: false, error: "water_map_header_sample_too_large" },
          { status: 400 },
        );
      }
    }

    const admin = createAdminClient();

    if (actor.kind === "approved_device" && actor.deviceId) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await admin
        .from("water_map_ingest_catalog")
        .select("source_id", { count: "exact", head: true })
        .eq("device_id", actor.deviceId)
        .gte("created_at", twoHoursAgo)
        .in("ingest_state", [
          "awaiting_upload",
          "uploaded",
          "queued",
          "processing",
        ]);

      if (countError) throw countError;
      if ((count || 0) >= APPROVED_DEVICE_PENDING_LIMIT) {
        return noStore(
          {
            ok: false,
            error: "water_map_upload_pending_limit",
            pendingLimit: APPROVED_DEVICE_PENDING_LIMIT,
          },
          { status: 429 },
        );
      }
    }

    const requestId = `water-map-${randomUUID()}`;
    const sourceId = `water-map:${requestId}`;
    const classification = classifyWaterMapArtifact({
      sourceId,
      fileName,
      sizeBytes: fileSize,
      mimeType,
      firstBytesBase64,
      notes: coordinateReferenceSystem
        ? [`declared_crs:${coordinateReferenceSystem}`]
        : [],
    });

    const date = new Date();
    const yyyy = String(date.getUTCFullYear());
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const storagePath = `raw/${yyyy}/${mm}/${dd}/${requestId}/${safeFileName(fileName)}`;

    const reviewState =
      actor.kind === "admin_session" ? "trusted_admin" : "review_required";
    const ingestState = initialIngestState(classification.adapterState);

    const { error: insertError } = await admin
      .from("water_map_ingest_catalog")
      .insert({
        request_id: requestId,
        actor_kind: actor.kind,
        actor_ref: actor.actorRef,
        device_id: actor.deviceId,
        original_file_name: fileName,
        normalized_extension: classification.artifact.detection.extension || "",
        mime_type: mimeType,
        file_size_bytes: fileSize,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        detected_format: classification.artifact.detection.formatId,
        format_family: classification.artifact.detection.family,
        adapter_state: databaseAdapterState(classification.adapterState),
        ingest_state: ingestState,
        review_state: reviewState,
        coordinate_reference_system: coordinateReferenceSystem,
        metadata: {
          universalIntakeId: classification.artifact.intakeId,
          supportState: classification.artifact.detection.supportState,
          adapter: classification.artifact.detection.adapter,
          risk: classification.artifact.detection.risk,
          confidence: classification.artifact.detection.confidence,
          waterRelevant: classification.waterRelevant,
          rawPreservationRequired: true,
          canonicalMutationAllowed: false,
        },
        provenance: {
          source: "pantavion-water-user-map-upload",
          sourceId,
          capturedAt: new Date().toISOString(),
          actorKind: actor.kind,
        },
      });

    if (insertError) throw insertError;

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      await admin
        .from("water_map_ingest_catalog")
        .update({
          ingest_state: "failed",
          metadata: {
            universalIntakeId: classification.artifact.intakeId,
            failure: "signed_upload_authorization_failed",
            rawPreservationRequired: true,
            canonicalMutationAllowed: false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", requestId);

      throw new Error("water_map_signed_upload_failed");
    }

    return noStore({
      ok: true,
      status: "water_map_upload_authorized",
      requestId,
      upload: {
        bucket: BUCKET,
        path: data.path || storagePath,
        token: data.token,
        tusEndpoint: tusEndpointFor(configuredSupabaseUrl()),
        chunkSizeBytes: PANTAVION_ARTIFACT_TUS_CHUNK_BYTES,
        expectedSizeBytes: fileSize,
        maxBytes,
      },
      classification: {
        intakeId: classification.artifact.intakeId,
        formatId: classification.artifact.detection.formatId,
        family: classification.artifact.detection.family,
        supportState: classification.artifact.detection.supportState,
        adapter: classification.artifact.detection.adapter,
        risk: classification.artifact.detection.risk,
        confidence: classification.artifact.detection.confidence,
        adapterState: classification.adapterState,
        waterRelevant: classification.waterRelevant,
        truth: classification.truth,
      },
      reviewState,
      truth: {
        authorizationOnly: true,
        bytesUploaded: false,
        rawPrivate: true,
        canonicalMutationAllowed: false,
        unknownFutureFormatsPreserved: true,
      },
    });
  } catch (error) {
    const marker =
      error instanceof Error
        ? error.message
        : "water_map_upload_authorize_failed";
    return noStore(
      {
        ok: false,
        error:
          marker === "water_map_signed_upload_failed" ||
          marker === "water_map_supabase_project_ref_invalid"
            ? marker
            : "water_map_upload_authorize_failed",
      },
      { status: 500 },
    );
  }
}
