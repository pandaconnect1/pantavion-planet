import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_RENDER_PATH =
  "water/private/maps/master-b-render/PANTAVION_WATER_MASTER_B_RENDER.pdf";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getBlobToken() {
  return clean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_TOKEN);
}

function getRenderPath() {
  return clean(process.env.PANTAVION_WATER_MASTER_B_RENDER_BLOB_PATH) || DEFAULT_RENDER_PATH;
}

export async function GET() {
  try {
    const token = getBlobToken();
    const renderPath = getRenderPath();

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
      prefix: renderPath,
      limit: 10,
      token,
    });

    const blob = result.blobs.find((item) => item.pathname === renderPath);

    if (!blob) {
      return NextResponse.json(
        {
          ok: false,
          error: "master_b_render_not_found",
          renderPath,
        },
        { status: 404 },
      );
    }

    const candidate = blob as typeof blob & { downloadUrl?: string };
    const sourceUrl = candidate.downloadUrl || blob.url;

    let upstream = await fetch(sourceUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!upstream.ok) {
      upstream = await fetch(sourceUrl, { cache: "no-store" });
    }

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        {
          ok: false,
          error: "master_b_render_fetch_failed",
          status: upstream.status,
        },
        { status: 502 },
      );
    }

    const bytes = Buffer.from(await upstream.arrayBuffer());

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
        "Content-Disposition": 'inline; filename="PANTAVION_WATER_MASTER_B_RENDER.pdf"',
        "X-Pantavion-Water-Map": "master-b-internal-render",
        "X-Pantavion-Water-Source": blob.pathname,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "master_b_render_route_failed",
        details: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500 },
    );
  }
}
