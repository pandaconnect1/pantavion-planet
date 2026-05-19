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

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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
      prefix: "water/private/access-requests/",
      limit: 200,
    });

    const requests = [];
    let skippedCount = 0;

    for (const blob of result.blobs as BlobLike[]) {
      try {
        const payload = await readJsonBlob(blob);
        // hide rejected active requests from the live founder/admin queue.
        if (clean(payload.status) === "rejected") {
          continue;
        }

        const device = payload.device || {};

        requests.push({
          id: clean(payload.id),
          firstName: clean(payload.firstName),
          lastName: clean(payload.lastName),
          title: clean(payload.title),
          organization: clean(payload.organization),
          emailOrPhone: clean(payload.emailOrPhone),
          reason: clean(payload.reason),
          status: clean(payload.status),
          createdAt: clean(payload.createdAt),
          deviceId: clean(device.id),
          deviceLabel: clean(device.label),
          hasDeviceToken: Boolean(clean(device.tokenHash)),
        });
      } catch {
        skippedCount += 1;
      }
    }

    requests.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return NextResponse.json({
      ok: true,
      requests,
      blobCount: result.blobs.length,
      readCount: requests.length,
      skippedCount,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "requests_failed",
      },
      { status: 500 },
    );
  }
}