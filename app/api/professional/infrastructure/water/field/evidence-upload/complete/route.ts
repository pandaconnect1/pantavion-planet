import "server-only";

import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES } from "@/core/intake/pantavion-artifact-storage-policy";
import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "personal-media";
const INLINE_HASH_MAX_BYTES = 64 * 1024 * 1024;

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function noStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

function parseTotalBytes(
  contentRange: string | null,
  contentLength: string | null,
) {
  if (contentRange) {
    const match = /\/([0-9]+)$/.exec(contentRange.trim());
    if (match) {
      const value = Number.parseInt(match[1], 10);
      if (Number.isSafeInteger(value)) return value;
    }
  }

  if (contentLength) {
    const value = Number.parseInt(contentLength, 10);
    if (Number.isSafeInteger(value)) return value;
  }

  return null;
}

async function signedReadUrl(path: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, 60);

  if (error || !data?.signedUrl) {
    throw new Error("water_field_signed_read_failed");
  }

  return data.signedUrl;
}

async function inspectStoredObject(path: string, expectedSize: number) {
  const url = await signedReadUrl(path);
  const response = await fetch(url, {
    headers: {
      Range: `bytes=0-${PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES - 1}`,
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("water_field_storage_read_failed");

  const totalBytes = parseTotalBytes(
    response.headers.get("content-range"),
    response.headers.get("content-length"),
  );

  if (
    response.status !== 206 &&
    expectedSize > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES
  ) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("water_field_storage_range_not_supported");
  }

  const sample = Buffer.from(await response.arrayBuffer());

  return {
    totalBytes,
    sampleBytes: sample.byteLength,
    contentType: response.headers.get("content-type"),
  };
}

async function computeSha256(path: string, expectedSize: number) {
  if (expectedSize > INLINE_HASH_MAX_BYTES) {
    return null;
  }

  const url = await signedReadUrl(path);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || !response.body) {
    throw new Error("water_field_storage_full_read_failed");
  }

  const hash = createHash("sha256");
  const reader = response.body.getReader();
  let observedSize = 0;

  while (true) {
    const part = await reader.read();
    if (part.done) break;
    observedSize += part.value.byteLength;
    if (observedSize > expectedSize) {
      throw new Error("water_field_stored_size_mismatch");
    }
    hash.update(part.value);
  }

  if (observedSize !== expectedSize) {
    throw new Error("water_field_stored_size_mismatch");
  }

  return hash.digest("hex");
}

export async function POST(request: Request) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return noStore({ ok: false, error: access.error }, { status: 403 });
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return noStore(
        { ok: false, error: "water_field_complete_payload_invalid" },
        { status: 400 },
      );
    }

    const requestId = clean(
      (body as Record<string, unknown>).requestId,
      120,
    );

    if (!/^water-field-artifact-[0-9a-f-]{36}$/i.test(requestId)) {
      return noStore(
        { ok: false, error: "water_field_request_id_invalid" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: row, error: rowError } = await admin
      .from("water_field_artifact_uploads")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (rowError) throw rowError;
    if (!row) {
      return noStore(
        { ok: false, error: "water_field_upload_request_not_found" },
        { status: 404 },
      );
    }

    if (
      access.mode !== "admin-session" &&
      (row.actor_kind !== "approved_device" ||
        !access.deviceId ||
        row.device_id !== access.deviceId ||
        row.actor_ref !== access.actorRef)
    ) {
      return noStore(
        { ok: false, error: "water_field_upload_actor_mismatch" },
        { status: 403 },
      );
    }

    if (row.upload_state === "verified" || row.upload_state === "hash_pending") {
      return noStore({
        ok: true,
        deduplicated: true,
        requestId,
        artifactRef: `water-field-artifact:${requestId}`,
        fileName: row.original_file_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.file_size_bytes),
        sha256: row.sha256 || null,
        verification:
          row.upload_state === "verified" ? "verified" : "hash_pending",
        private: true,
      });
    }

    const expectedSize = Number(row.file_size_bytes);
    if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
      throw new Error("water_field_expected_size_invalid");
    }

    const storagePath = String(row.storage_path || "");
    if (
      row.storage_bucket !== BUCKET ||
      !storagePath.startsWith("water-network-private/field-evidence/") ||
      storagePath.includes("..")
    ) {
      throw new Error("water_field_storage_path_invalid");
    }

    const inspected = await inspectStoredObject(storagePath, expectedSize);

    if (
      inspected.totalBytes !== null &&
      inspected.totalBytes !== expectedSize
    ) {
      await admin
        .from("water_field_artifact_uploads")
        .update({
          upload_state: "quarantined",
          metadata: {
            ...(row.metadata || {}),
            expectedSize,
            observedSize: inspected.totalBytes,
            sizeMismatch: true,
            private: true,
            preserved: true,
            deleted: false,
          },
          provenance: {
            ...(row.provenance || {}),
            completedAt: new Date().toISOString(),
            verification: "size_mismatch",
          },
        })
        .eq("request_id", requestId);

      return noStore(
        {
          ok: false,
          status: "water_field_artifact_preserved_blocked",
          error: "water_field_stored_size_mismatch",
          expectedSize,
          observedSize: inspected.totalBytes,
          private: true,
          preserved: true,
        },
        { status: 409 },
      );
    }

    const sha256 = await computeSha256(storagePath, expectedSize);
    const verification = sha256 ? "verified" : "hash_pending";
    const nextState = sha256 ? "verified" : "hash_pending";

    const { error: updateError } = await admin
      .from("water_field_artifact_uploads")
      .update({
        upload_state: nextState,
        sha256,
        mime_type: inspected.contentType || row.mime_type,
        metadata: {
          ...(row.metadata || {}),
          storedSizeVerified: true,
          headerSampleObserved: inspected.sampleBytes > 0,
          fullHashVerification: verification,
          private: true,
          preserved: true,
          deleted: false,
        },
        provenance: {
          ...(row.provenance || {}),
          completedAt: new Date().toISOString(),
          verification:
            verification === "verified"
              ? "stored-size+sha256"
              : "stored-size;sha256-worker-pending",
        },
      })
      .eq("request_id", requestId);

    if (updateError) throw updateError;

    return noStore({
      ok: true,
      deduplicated: false,
      status:
        nextState === "verified"
          ? "water_field_artifact_verified"
          : "water_field_artifact_hash_pending",
      requestId,
      artifactRef: `water-field-artifact:${requestId}`,
      fileName: row.original_file_name,
      mimeType: inspected.contentType || row.mime_type,
      sizeBytes: expectedSize,
      sha256,
      verification,
      private: true,
      preserved: true,
      publicUrl: null,
    });
  } catch (error) {
    const marker =
      error instanceof Error ? error.message : "water_field_complete_failed";

    return noStore(
      {
        ok: false,
        error: [
          "water_field_signed_read_failed",
          "water_field_storage_read_failed",
          "water_field_storage_range_not_supported",
          "water_field_storage_full_read_failed",
          "water_field_stored_size_mismatch",
          "water_field_expected_size_invalid",
          "water_field_storage_path_invalid",
        ].includes(marker)
          ? marker
          : "water_field_complete_failed",
      },
      { status: 500 },
    );
  }
}
