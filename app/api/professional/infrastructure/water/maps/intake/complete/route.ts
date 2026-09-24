import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import {
  PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES,
} from "@/core/intake/pantavion-artifact-storage-policy";
import { createPantavionArtifactWorkOrderCandidate } from "@/core/intake/pantavion-universal-artifact-intake";
import { persistPantavionFounderWorkOrder } from "@/core/kernel/pantavion-work-order-runtime";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";
import { classifyWaterMapArtifact } from "@/core/water/water-map-format-registry";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "water-map-ingest-private";
const INLINE_STREAM_SHA256_MAX_BYTES = 256 * 1024 * 1024;

function clean(value: unknown, max = 1000) {
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
    throw new Error("water_map_signed_read_failed");
  }

  return data.signedUrl;
}

async function inspectStoredHeader(path: string, expectedSize: number) {
  const url = await signedReadUrl(path);
  const response = await fetch(url, {
    headers: {
      Range: `bytes=0-${PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES - 1}`,
    },
    cache: "no-store",
  });

  if (!response.ok) throw new Error("water_map_storage_read_failed");

  const totalBytes = parseTotalBytes(
    response.headers.get("content-range"),
    response.headers.get("content-length"),
  );

  if (
    response.status !== 206 &&
    expectedSize > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES
  ) {
    await response.body?.cancel().catch(() => undefined);
    throw new Error("water_map_storage_range_not_supported");
  }

  const sample = Buffer.from(await response.arrayBuffer());
  if (
    sample.byteLength > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES &&
    expectedSize > PANTAVION_ARTIFACT_HEADER_SAMPLE_BYTES
  ) {
    throw new Error("water_map_storage_range_overflow");
  }

  return {
    totalBytes,
    sample,
    contentType: response.headers.get("content-type"),
    rangeStatus: response.status,
  };
}

async function computeStoredSha256(path: string, expectedSize: number) {
  if (expectedSize > INLINE_STREAM_SHA256_MAX_BYTES) {
    return null;
  }

  const url = await signedReadUrl(path);
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok || !response.body) {
    throw new Error("water_map_storage_full_read_failed");
  }

  const hash = createHash("sha256");
  const reader = response.body.getReader();
  let observedSize = 0;

  while (true) {
    const part = await reader.read();
    if (part.done) break;
    observedSize += part.value.byteLength;
    if (observedSize > expectedSize) {
      throw new Error("water_map_stored_size_mismatch");
    }
    hash.update(part.value);
  }

  if (observedSize !== expectedSize) {
    throw new Error("water_map_stored_size_mismatch");
  }

  return hash.digest("hex");
}

function databaseAdapterState(
  state: ReturnType<typeof classifyWaterMapArtifact>["adapterState"],
) {
  if (state === "known_adapter" || state === "convert") return "known_adapter";
  if (state === "adapter_required") return "adapter_required";
  return "raw_only";
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeWaterMapIngestActor(request);
    if (!actor.ok) {
      return noStore({ ok: false, error: actor.error }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return noStore(
        { ok: false, error: "water_map_complete_payload_invalid" },
        { status: 400 },
      );
    }

    const input = body as Record<string, unknown>;
    const requestId = clean(input.requestId, 120);
    if (!/^water-map-[0-9a-f-]{36}$/i.test(requestId)) {
      return noStore(
        { ok: false, error: "water_map_request_id_invalid" },
        { status: 400 },
      );
    }

    const admin = createAdminClient();
    const { data: row, error: rowError } = await admin
      .from("water_map_ingest_catalog")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (rowError) throw rowError;
    if (!row) {
      return noStore(
        { ok: false, error: "water_map_request_not_found" },
        { status: 404 },
      );
    }

    if (
      actor.kind !== "admin_session" &&
      (row.actor_kind !== "approved_device" ||
        !actor.deviceId ||
        row.device_id !== actor.deviceId)
    ) {
      return noStore(
        { ok: false, error: "water_map_request_actor_mismatch" },
        { status: 403 },
      );
    }

    const expectedSize = Number(row.file_size_bytes);
    if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
      throw new Error("water_map_expected_size_invalid");
    }

    const storagePath = String(row.storage_path || "");
    if (
      row.storage_bucket !== BUCKET ||
      !storagePath.startsWith("raw/") ||
      storagePath.includes("..")
    ) {
      throw new Error("water_map_storage_path_invalid");
    }

    const inspected = await inspectStoredHeader(storagePath, expectedSize);
    if (
      inspected.totalBytes !== null &&
      inspected.totalBytes !== expectedSize
    ) {
      await admin
        .from("water_map_ingest_catalog")
        .update({
          ingest_state: "quarantined",
          metadata: {
            ...(row.metadata || {}),
            storedSizeMismatch: true,
            expectedSize,
            observedSize: inspected.totalBytes,
            originalPreserved: true,
            deleted: false,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("request_id", requestId);

      return noStore(
        {
          ok: false,
          status: "water_map_preserved_blocked",
          error: "water_map_stored_size_mismatch",
          expectedSize,
          observedSize: inspected.totalBytes,
          storage: {
            bucket: BUCKET,
            path: storagePath,
            private: true,
            preserved: true,
            deleted: false,
          },
        },
        { status: 409 },
      );
    }

    const computedSha256 = await computeStoredSha256(
      storagePath,
      expectedSize,
    );
    const fullHashVerification = computedSha256
      ? "verified"
      : "worker_required";

    const classification = classifyWaterMapArtifact({
      sourceId: `water-map:${requestId}`,
      fileName: String(row.original_file_name || "water-map.bin"),
      sizeBytes: expectedSize,
      mimeType:
        inspected.contentType ||
        String(row.mime_type || "application/octet-stream"),
      firstBytesBase64: inspected.sample.toString("base64"),
      sha256: computedSha256,
      sha256VerifiedFromBytes: Boolean(computedSha256),
      storageReference: `supabase://${BUCKET}/${storagePath}`,
      sourceDate: new Date().toISOString(),
      notes: [
        `server_storage_range_status:${inspected.rangeStatus}`,
        `full_hash_verification:${fullHashVerification}`,
        row.coordinate_reference_system
          ? `declared_crs:${row.coordinate_reference_system}`
          : "declared_crs:none",
      ],
    });

    const quarantine =
      classification.adapterState === "quarantine" ||
      classification.artifact.security.quarantineRequired;

    let execution:
      | {
          executionId: string;
          status: string;
          workOrderId: string;
          deduplicated: boolean;
        }
      | null = null;
    let queueError: string | null = null;

    if (!quarantine) {
      try {
        const candidate = createPantavionArtifactWorkOrderCandidate(
          classification.artifact,
        );
        const persisted = await persistPantavionFounderWorkOrder(
          candidate.submission,
        );
        execution = {
          executionId: persisted.execution.executionId,
          status: persisted.execution.status,
          workOrderId: persisted.workOrder.id,
          deduplicated: persisted.deduplicated,
        };
      } catch (error) {
        queueError =
          error instanceof Error
            ? error.message.slice(0, 300)
            : "water_map_work_order_queue_failed";
      }
    }

    const nextState = quarantine
      ? "quarantined"
      : execution
        ? "queued"
        : classification.adapterState === "adapter_required" ||
            classification.adapterState === "preserve"
          ? "adapter_required"
          : "uploaded";

    const { error: updateError } = await admin
      .from("water_map_ingest_catalog")
      .update({
        detected_format: classification.artifact.detection.formatId,
        format_family: classification.artifact.detection.family,
        adapter_state: databaseAdapterState(classification.adapterState),
        ingest_state: nextState,
        sha256: computedSha256,
        metadata: {
          ...(row.metadata || {}),
          universalIntakeId: classification.artifact.intakeId,
          supportState: classification.artifact.detection.supportState,
          adapter: classification.artifact.detection.adapter,
          risk: classification.artifact.detection.risk,
          confidence: classification.artifact.detection.confidence,
          waterRelevant: classification.waterRelevant,
          fullHashVerification,
          headerObservedFromStoredBytes: true,
          queueError,
          workOrderExecutionId: execution?.executionId || null,
          workOrderId: execution?.workOrderId || null,
          originalPreserved: true,
          deleted: false,
          canonicalMutationAllowed: false,
        },
        provenance: {
          ...(row.provenance || {}),
          completedAt: new Date().toISOString(),
          actualStoredHeaderObserved: true,
          fullHashVerification,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("request_id", requestId);

    if (updateError) throw updateError;

    return noStore({
      ok: true,
      status:
        nextState === "queued"
          ? "water_map_preserved_verified_and_queued"
          : nextState === "quarantined"
            ? "water_map_preserved_quarantined"
            : "water_map_preserved_processing_pending",
      requestId,
      classification: {
        intakeId: classification.artifact.intakeId,
        formatId: classification.artifact.detection.formatId,
        family: classification.artifact.detection.family,
        supportState: classification.artifact.detection.supportState,
        adapter: classification.artifact.detection.adapter,
        risk: classification.artifact.detection.risk,
        confidence: classification.artifact.detection.confidence,
        adapterState: classification.adapterState,
        truth: classification.truth,
      },
      verification: {
        sizeVerified: true,
        headerObservedFromStoredBytes: true,
        fullHashVerification,
        computedSha256,
        largeFileHashWorkerRequired:
          fullHashVerification === "worker_required",
      },
      storage: {
        bucket: BUCKET,
        path: storagePath,
        private: true,
        preserved: true,
        deleted: false,
      },
      execution,
      reviewState: row.review_state,
      ingestState: nextState,
      truth:
        nextState === "queued"
          ? "The raw original is privately preserved and server-inspected. A proposal-only durable work order exists for conversion/adapter/engineering processing. This is not yet a VERIFIED_LIVE network layer."
          : nextState === "quarantined"
            ? "The raw original is privately preserved but quarantined. No execution authority was granted."
            : "The raw original is privately preserved and server-inspected. Processing remains explicit because no durable work order was successfully queued yet.",
    });
  } catch (error) {
    const marker =
      error instanceof Error ? error.message : "water_map_complete_failed";
    return noStore(
      {
        ok: false,
        error: [
          "water_map_signed_read_failed",
          "water_map_storage_read_failed",
          "water_map_storage_range_not_supported",
          "water_map_storage_range_overflow",
          "water_map_storage_full_read_failed",
          "water_map_stored_size_mismatch",
          "water_map_expected_size_invalid",
          "water_map_storage_path_invalid",
        ].includes(marker)
          ? marker
          : "water_map_complete_failed",
      },
      { status: 500 },
    );
  }
}
