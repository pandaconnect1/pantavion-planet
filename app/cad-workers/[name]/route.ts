import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WORKER_UPSTREAMS: Record<string, string> = {
  "dxf-parser-worker.js":
    "https://cdn.jsdelivr.net/npm/@mlightcad/data-model@1.5.5/dist/dxf-parser-worker.js",
  "libredwg-parser-worker.js":
    "https://cdn.jsdelivr.net/npm/@mlightcad/cad-simple-viewer@1.5.5/dist/libredwg-parser-worker.js",
  "mtext-renderer-worker.js":
    "https://cdn.jsdelivr.net/npm/@mlightcad/cad-simple-viewer@1.5.5/dist/mtext-renderer-worker.js",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ name: string }> },
) {
  const { name } = await context.params;
  const upstream = WORKER_UPSTREAMS[name];

  if (!upstream) {
    return new NextResponse("Not found", { status: 404 });
  }

  const response = await fetch(upstream, { cache: "force-cache" });

  if (!response.ok) {
    return new NextResponse(`CAD worker upstream error ${response.status}`, {
      status: 502,
    });
  }

  const body = await response.arrayBuffer();

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=31536000, immutable",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
