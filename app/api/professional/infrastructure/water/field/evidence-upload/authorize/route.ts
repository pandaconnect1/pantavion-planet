import "server-only";

import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { PANTAVION_ARTIFACT_TUS_CHUNK_BYTES } from "@/core/intake/pantavion-artifact-storage-policy";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "personal-media";
const CANONICAL_SUPABASE_URL = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const APPROVED_DEVICE_MAX_BYTES = 128 * 1024 * 1024;
const ADMIN_MAX_BYTES = 512 * 1024 * 1024;
const APPROVED_DEVICE_PENDING_LIMIT = 12;

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
  return normalized || "field-evidence.bin";
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
    throw new Error("water_field_supabase_project_ref_invalid");
  }
  return `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`;
}

export async function POST(request: Request) {
  try {
    const access = await authorizeWaterMapRequest(request);
    if (!access.ok) {
      return noStore({ ok: false, error: access.error }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return noStore(
        { ok: false, error: "water_field_upload_payload_invalid" },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;
    const fileName = clean(input.fileName, 512);
    const fileSize = typeof input.fileSize === "number" ? input.fileSize : Number.NaN;
    const mimeType = clean(input.mimeType, 200) || "application/octet-stream";

    if (!fileName || !Number.isSafeInteger(fileSize) || fileSize <= 0) {
      return noStore(
        { ok: false, error: "water_field_upload_payload_invalid" },
        { status: 400 },
      );
    }

    const maxBytes =
      access.mode === "admin-session"
        ? ADMIN_MAX_BYTES
        : APPROVED_DEVICE_MAX_BYTES;

    if (fileSize > maxBytes) {
      return noStore(
        {
          ok: false,
          error: "water_field_upload_size_exceeded",
          maxBytes,
        },
        { status: 413 },
      );
    }

    const admin = createAdminClient();

    if (access.mode === "approved-device" && access.deviceId) {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { count, error: countError } = await admin
        .from("water_field_artifact_uploads")
        .select("upload_id", { count: "exact", head: true })
        .eq("device_id", access.deviceId)
        .gte("created_at", twoHoursAgo)
        .in("upload_state", ["awaiting_upload", "uploaded", "hash_pending"]);

      if (countError) throw countError;
      if ((count || 0) >= APPROVED_DEVICE_PENDING_LIMIT) {
        return noStore(
          {
            ok: false,
            error: "water_field_upload_pending_limit",
            pendingLimit: APPROVED_DEVICE_PENDING_LIMIT,
          },
          { status: 429 },
        );
      }
    }

    const requestId = `water-field-artifact-${randomUUID()}`;
    const date = new Date();
    const yyyy = String(date.getUTCFullYear());
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const storagePath =
      `water-network-private/field-evidence/${yyyy}/${mm}/${dd}/${requestId}/${safeFileName(fileName)}`;

    const { error: insertError } = await admin
      .from("water_field_artifact_uploads")
      .insert({
        request_id: requestId,
        actor_kind: access.mode === "admin-session" ? "admin_session" : "approved_device",
        actor_ref: access.actorRef,
        device_id: access.deviceId,
        original_file_name: fileName,
        mime_type: mimeType,
        file_size_bytes: fileSize,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        upload_state: "awaiting_upload",
        metadata: {
          private: true,
          fieldEvidence: true,
          canonicalMutationAllowed: false,
        },
        provenance: {
          source: "pantavion-water-field-artifact-upload",
          authorizedAt: new Date().toISOString(),
          accessMode: access.mode,
        },
      });

    if (insertError) throw insertError;

    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(storagePath, { upsert: false });

    if (error || !data?.token) {
      await admin
        .from("water_field_artifact_uploads")
        .update({
          upload_state: "failed",
          metadata: {
            private: true,
            fieldEvidence: true,
            failure: "signed_upload_authorization_failed",
          },
        })
        .eq("request_id", requestId);

      throw new Error("water_field_signed_upload_failed");
    }

    return noStore({
      ok: true,
      status: "water_field_upload_authorized",
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
      truth: {
        authorizationOnly: true,
        bytesUploaded: false,
        rawPrivate: true,
        canonicalMutationAllowed: false,
      },
    });
  } catch (error) {
    const marker =
      error instanceof Error ? error.message : "water_field_upload_authorize_failed";
    return noStore(
      {
        ok: false,
        error: [
          "water_field_signed_upload_failed",
          "water_field_supabase_project_ref_invalid",
        ].includes(marker)
          ? marker
          : "water_field_upload_authorize_failed",
      },
      { status: 500 },
    );
  }
}
