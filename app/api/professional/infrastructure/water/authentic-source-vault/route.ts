import { createSupabaseSignedUpload, verifySupabaseObject, writeSupabaseVerificationMarker } from "@/core/water/authentic-source-upload";
import { hasSupabaseAdminCredential } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEMP_UPLOAD_HOST = "pantavion-planet-production-deb2.up.railway.app";

function hasTemporaryUploadWindow(request: Request) {
  if (process.env.PANTAVION_WATER_TEMP_UPLOAD_OPEN !== "true") return false;

  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  if (host !== TEMP_UPLOAD_HOST) return false;

  const until = Date.parse(process.env.PANTAVION_WATER_TEMP_UPLOAD_UNTIL || "");
  return Number.isFinite(until) && Date.now() < until;
}

export const maxDuration = 300;

const SUPABASE_FUNCTION_URL =
  "https://cxhulvwkagzufbjsdwwu.supabase.co/functions/v1/pantavion-water-authentic-source-vault-signer";

const ALLOWED_SOURCE_IDS = new Set([
  "map-a-original",
  "map-b-canonical",
  "map-c-canonical",
  "legacy-map-bc-george",
  "older-2025-master",
]);

export async function POST(request: Request) {
  if (!(await hasWaterAdminAuthorization(request)) && !hasTemporaryUploadWindow(request)) {
    return NextResponse.json(
      { ok: false, error: "water_admin_session_required" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
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

  const sourceKey = sourceId === "map-b-canonical"
    ? "canonical-2026-andreaspap"
    : sourceId === "map-c-canonical" ? "legacy-george-85m" : null;
  if (sourceKey) {
    if (!hasSupabaseAdminCredential()) {
      return NextResponse.json({ ok: false, error: "water_storage_admin_not_configured" },
        { status: 503, headers: { "Cache-Control": "private, no-store" } });
    }
    try {
      if (action === "sign") {
        const signed = await createSupabaseSignedUpload(sourceKey);
        if (!signed.ok && signed.error === "canonical_object_already_present") {
          return NextResponse.json({ ok: true, status: "already_present" },
            { headers: { "Cache-Control": "private, no-store" } });
        }
        return NextResponse.json(signed,
          { status: signed.status, headers: { "Cache-Control": "private, no-store" } });
      }
      const result = await verifySupabaseObject(sourceKey);
      if (result.ok) {
        await writeSupabaseVerificationMarker(sourceKey, {
          sha256: result.sha256, sizeBytes: result.sizeBytes,
          header: result.header, etag: result.etag,
        });
      }
      return NextResponse.json({
        ...result,
        actualSizeBytes: "sizeBytes" in result ? result.sizeBytes : undefined,
        actualSha256: "sha256" in result ? result.sha256 : undefined,
      }, { status: result.status, headers: { "Cache-Control": "private, no-store" } });
    } catch {
      return NextResponse.json({ ok: false, error: "water_private_storage_request_failed" },
        { status: 502, headers: { "Cache-Control": "private, no-store" } });
    }
  }

  const bridgeKey = process.env.PANTAVION_WATER_UPLOAD_BRIDGE_KEY?.trim();
  if (!bridgeKey) {
    return NextResponse.json(
      { ok: false, error: "water_upload_bridge_not_configured" },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
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

