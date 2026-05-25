import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PREVIEW_PATH =
  "water/private/maps/master-b-preview/PANTAVION_WATER_MASTER_B_LIVE_PREVIEW.geojson";

function getBlobToken() {
  return process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN || "";
}

function getPreviewPath() {
  return process.env.PANTAVION_WATER_MASTER_B_PREVIEW_BLOB_PATH || DEFAULT_PREVIEW_PATH;
}

export async function GET() {
  try {
    const token = getBlobToken();
    const previewPath = getPreviewPath();

    if (!token) {
      return NextResponse.json(
        {
          ok: false,
          error: "blob_token_missing",
        },
        { status: 500 },
      );
    }

    const result = await list({
      prefix: previewPath,
      limit: 10,
      token,
    });

    const found =
      result.blobs.find((blob) => blob.pathname === previewPath) || result.blobs[0];

    if (!found) {
      return NextResponse.json(
        {
          ok: false,
          error: "master_b_preview_not_found",
          previewPath,
        },
        { status: 404 },
      );
    }

    const candidate = found as typeof found & { downloadUrl?: string };
    const sourceUrl = candidate.downloadUrl || found.url;

    let upstream = await fetch(sourceUrl, {
      cache: "no-store",
    });

    if (!upstream.ok) {
      upstream = await fetch(sourceUrl, {
        cache: "no-store",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "master_b_preview_fetch_failed",
          status: upstream.status,
          pathname: found.pathname,
        },
        { status: 502 },
      );
    }

    const body = await upstream.text();

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/geo+json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Pantavion-Water-Map": "master-b-live-preview",
        "X-Pantavion-Water-Source": found.pathname,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "master_b_preview_route_failed",
        details: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
