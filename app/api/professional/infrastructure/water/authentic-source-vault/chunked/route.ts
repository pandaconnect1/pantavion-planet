import { NextResponse } from "next/server";

import { POST as internalWaterObjectTransfer } from "@/app/api/internal/water/object-transfer/route";
import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";

/**
 * Authenticated founder/admin bridge for canonical Water B and C source ingestion.
 *
 * The privileged transfer secret never leaves the Render server. The browser
 * receives ONLY per-object signed upload tokens for 32 MiB private pieces.
 * Every piece remains a raw byte-range of the original DWG, NOT a geographic
 * or editable slice of the water network.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SOURCE_KEYS = new Set(["canonical-2026-andreaspap", "legacy-george-85m"]);
const ACTIONS = new Set(["sign-chunk-upload", "chunk-status", "verify-chunked"]);

function response(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  if (!(await hasWaterAdminAuthorization(request))) {
    return response({ ok: false, error: "water_admin_session_required" }, 403);
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(request.url).host) {
        return response({ ok: false, error: "water_upload_origin_denied" }, 403);
      }
    } catch {
      return response({ ok: false, error: "water_upload_origin_invalid" }, 403);
    }
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body && typeof body.action === "string" ? body.action : "";
  const sourceKey = body && typeof body.sourceKey === "string" ? body.sourceKey : "";

  if (!ACTIONS.has(action) || !SOURCE_KEYS.has(sourceKey)) {
    return response({ ok: false, error: "unsupported_water_source_or_action" }, 400);
  }

  if (action === "sign-chunk-upload" &&
      (typeof body?.chunkIndex !== "number" || !Number.isInteger(body.chunkIndex) || body.chunkIndex < 0)) {
    return response({ ok: false, error: "invalid_chunk_index" }, 400);
  }

  const transferSecret =
    process.env.PANTAVION_WATER_LIBRARY_IMPORT_SECRET?.trim() ||
    process.env.PANTAVION_WATER_TRANSFER_SECRET?.trim();

  if (!transferSecret) {
    return response({ ok: false, error: "water_transfer_bridge_not_configured" }, 503);
  }

  // Invoke the existing, already reviewed private chunk/verification service.
  // This avoids introducing a second byte-validation or map-truth mechanism.
  const transferRequest = new Request(request.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-pantavion-transfer-secret": transferSecret,
    },
    body: JSON.stringify({
      action,
      sourceKey,
      ...(action === "sign-chunk-upload" ? { chunkIndex: body!.chunkIndex } : {}),
    }),
  });

  try {
    return await internalWaterObjectTransfer(transferRequest);
  } catch {
    return response({ ok: false, error: "water_transfer_bridge_failed" }, 502);
  }
}
