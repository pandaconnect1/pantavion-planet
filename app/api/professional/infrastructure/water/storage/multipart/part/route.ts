import { NextResponse } from "next/server";

import { presignUploadPart } from "@/core/infrastructure/water/s3-compatible-object-storage";
import { authorizeWaterMapIngestActor } from "@/core/water/water-map-ingest-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const partNumber = Number(body.partNumber);

    if (
      !key.startsWith("water/private/raw/") ||
      !uploadId ||
      !Number.isInteger(partNumber) ||
      partNumber < 1 ||
      partNumber > 10000
    ) {
      return NextResponse.json(
        { ok: false, error: "multipart_part_payload_invalid" },
        { status: 400 },
      );
    }

    const signed = presignUploadPart({
      key,
      uploadId,
      partNumber,
      expiresSeconds: 900,
    });

    return NextResponse.json(
      {
        ok: true,
        partNumber,
        uploadUrl: signed.url,
        expiresSeconds: signed.expiresSeconds,
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
            : "multipart_part_sign_failed",
      },
      { status: 503 },
    );
  }
}
