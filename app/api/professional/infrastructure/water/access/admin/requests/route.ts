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

async function readJsonBlob(blob: BlobLike) {
  const response = await fetch(blob.downloadUrl || blob.url, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("blob_read_failed");
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
      limit: 100,
    });

    const requests = [];

    for (const blob of result.blobs as BlobLike[]) {
      try {
        const payload = await readJsonBlob(blob);

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
        });
      } catch {
        // Skip unreadable request without exposing private storage details.
      }
    }

    requests.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    return NextResponse.json({
      ok: true,
      requests,
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
