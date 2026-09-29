import { NextResponse } from "next/server";

import {
  createMultipartUpload,
  newPrivateWaterObjectKey,
} from "@/core/infrastructure/water/s3-compatible-object-storage";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_OBJECT_BYTES = 50 * 1000 * 1000 * 1000 * 1000;

function clean(value: unknown, max = 512) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const actor = await authorizeWaterMapIngestActor(request);
  if (!actor.ok) {
    return NextResponse.json(
      { ok: false, error: actor.error },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const fileName = clean(body.fileName);
    const mapId = clean(body.mapId, 32);
    const fileSize = Number(body.fileSize);

    if (!fileName || !Number.isSafeInteger(fileSize) || fileSize <= 0 || fileSize > MAX_OBJECT_BYTES) {
      return NextResponse.json(
        { ok: false, error: "water_object_upload_payload_invalid" },
        { status: 400 },
      );
    }

    const key = newPrivateWaterObjectKey(fileName, mapId);
    const { uploadId } = await createMultipartUpload(key);

    return NextResponse.json(
      {
        ok: true,
        status: "multipart_created",
        key,
        uploadId,
        recommendedPartSizeBytes: 64 * 1024 * 1024,
        maxObjectBytes: MAX_OBJECT_BYTES,
        rawPrivate: true,
        directBrowserUpload: true,
        serverBodyProxy: false,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error && error.message === "PANTAVION_OBJECT_STORAGE_NOT_CONFIGURED"
            ? "object_storage_not_configured"
            : "multipart_create_failed",
      },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
