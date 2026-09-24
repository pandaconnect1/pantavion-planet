import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_FUNCTION_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-water-authentic-source-vault-signer";

const ALLOWED_SOURCE_IDS = new Set([
  "map-b-canonical",
  "legacy-map-bc-george",
  "older-2025-master",
]);

export async function POST(request: Request) {
  if (!await hasWaterAdminAuthorization(request)) {
    return NextResponse.json(
      { ok: false, error: "water_admin_session_required" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const bridgeKey = process.env.PANTAVION_WATER_UPLOAD_BRIDGE_KEY?.trim();
  if (!bridgeKey) {
    return NextResponse.json(
      { ok: false, error: "water_upload_bridge_not_configured" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const body = await request.json().catch(() => null);
  const sourceId =
    body && typeof body.sourceId === "string" ? body.sourceId.trim() : "";
  const action =
    body && body.action === "verify" ? "verify" : "sign";

  if (!ALLOWED_SOURCE_IDS.has(sourceId)) {
    return NextResponse.json(
      { ok: false, error: "unknown_authentic_water_source" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const response = await fetch(SUPABASE_FUNCTION_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "x-pantavion-upload-bridge-key": bridgeKey,
    },
    body: JSON.stringify({ sourceId, action }),
  });

  const payload = await response.json().catch(() => ({
    ok: false,
    error: "water_source_vault_bridge_invalid_response",
  }));

  return NextResponse.json(payload, {
    status: response.status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
