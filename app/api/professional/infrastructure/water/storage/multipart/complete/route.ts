import { NextResponse } from "next/server";

import { completeMultipartUpload } from "@/core/infrastructure/water/s3-compatible-object-storage";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PartInput = {
  partNumber?: unknown;
  etag?: unknown;
};

function clean(value: unknown, max = 1200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const actor = await authorizeWaterMapIngestActor(request);
  if (!actor.ok) {
    return NextResponse.json({ ok: false, error: actor.error }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const key = clean(body.key);
    const uploadId = clean(body.uploadId);
    const rawParts = Array.isArray(body.parts) ? (body.parts as PartInput[]) : [];

    const parts = rawParts
      .map((part) => ({
        partNumber: Number(part.partNumber),
        etag: clean(part.etag, 300),
      }))
      .filter(
        (part) =>
          Number.isInteger(part.partNumber) &&
          part.partNumber >= 1 &&
          part.partNumber <= 10000 &&
          Boolean(part.etag),
      );

    if (
      !key.startsWith("water/private/raw/") ||
      !uploadId ||
      parts.length === 0 ||
      parts.length !== rawParts.length
    ) {
      return NextResponse.json(
        { ok: false, error: "multipart_complete_payload_invalid" },
        { status: 400 },
      );
    }

    const completed = await completeMultipartUpload({ key, uploadId, parts });

    return NextResponse.json(
      {
        ok: true,
        status: "multipart_complete",
        key,
        partCount: parts.length,
        rawPrivate: true,
        ...completed,
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
            : "multipart_complete_failed",
      },
      { status: 503 },
    );
  }
}
