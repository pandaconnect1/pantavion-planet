import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

type FounderRequestBody = {
  founderCode?: string;
};

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
  uploadedAt?: string | Date;
};

function clean(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function founderOk(value: unknown) {
  const founderCode = process.env.PANTAVION_WATER_FOUNDER_ACCESS_CODE || "";
  return Boolean(founderCode) && clean(value) === founderCode;
}

function privateBlobHeaders(): HeadersInit {
  const token = process.env.BLOB_READ_WRITE_TOKEN || "";

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

async function readJsonBlob(blob: BlobLike) {
  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
    headers: privateBlobHeaders(),
  });

  if (!response.ok) {
    throw new Error(`blob_read_failed_${response.status}`);
  }

  return response.json();
}

function normalizeSubmission(payload: Record<string, unknown>) {
  const device = (payload.device || {}) as Record<string, unknown>;

  return {
    id: clean(payload.id),
    source: clean(payload.source),
    type: clean(payload.type),
    status: clean(payload.status),
    truthLabel: clean(payload.truthLabel),
    title: clean(payload.title),
    description: clean(payload.description),
    submittedBy: clean(payload.submittedBy),
    contact: clean(payload.contact),
    role: clean(payload.role),
    areaLabel: clean(payload.areaLabel),
    roadLabel: clean(payload.roadLabel),
    zoneLabel: clean(payload.zoneLabel),
    latitude: typeof payload.latitude === "number" ? payload.latitude : null,
    longitude: typeof payload.longitude === "number" ? payload.longitude : null,
    evidenceRefs: Array.isArray(payload.evidenceRefs)
      ? payload.evidenceRefs.map((item) => clean(item)).filter(Boolean)
      : [],
    visibleToFounder: payload.visibleToFounder === true,
    visibleToApprovedUsers: payload.visibleToApprovedUsers === true,
    rawSensitiveDataHiddenFromUsers: payload.rawSensitiveDataHiddenFromUsers === true,
    aiEstimateIsVerifiedTruth: payload.aiEstimateIsVerifiedTruth === true,
    createdAt: clean(payload.createdAt),
    updatedAt: clean(payload.updatedAt),
    deviceId: clean(device.id),
    deviceLabel: clean(device.label),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FounderRequestBody;

    if (!founderOk(body.founderCode)) {
      return NextResponse.json(
        {
          ok: false,
          error: "founder_not_authorized",
        },
        { status: 403 },
      );
    }

    const result = await list({
      prefix: "water/private/field-submissions/",
      limit: 300,
    });

    const submissions = [];
    let skippedCount = 0;

    for (const blob of result.blobs as BlobLike[]) {
      try {
        const payload = (await readJsonBlob(blob)) as Record<string, unknown>;
        const item = normalizeSubmission(payload);

        if (item.status === "rejected") {
          continue;
        }

        submissions.push(item);
      } catch {
        skippedCount += 1;
      }
    }

    submissions.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return NextResponse.json({
      ok: true,
      submissions,
      blobCount: result.blobs.length,
      readCount: submissions.length,
      skippedCount,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "field_submissions_failed",
      },
      { status: 500 },
    );
  }
}