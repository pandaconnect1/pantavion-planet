import { createHash } from "crypto";
import { NextResponse } from "next/server";

import { getPantavionWaterAbcMapSystemContract } from "@/core/infrastructure/water/water-abc-map-system-contract";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import { waterApprovedDeviceMatches } from "@/core/water/water-access-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistryRequestBody = { deviceId?: string; deviceToken?: string };

function clean(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function hashToken(value: string) { return createHash("sha256").update(value).digest("hex"); }

async function authorizeRegistryAccess(request: Request, body: RegistryRequestBody) {
  if (hasWaterAdminSession(request)) return { ok: true, mode: "admin-session" as const };
  const deviceId = clean(body.deviceId);
  const deviceToken = clean(body.deviceToken);
  if (!deviceId || !deviceToken) return { ok: false, mode: "denied" as const };
  try {
    const approved = await waterApprovedDeviceMatches(deviceId, hashToken(deviceToken));
    if (approved) return { ok: true, mode: "approved-user" as const };
  } catch {}
  return { ok: false, mode: "denied" as const };
}

function readSourcePresence() {
  return {
    bMasterPrivateReferenceConfigured: Boolean(
      process.env.PANTAVION_WATER_B_MASTER_BLOB_PATH ||
      process.env.PANTAVION_WATER_DTX_BLOB_PATH ||
      process.env.PANTAVION_WATER_DWG_BLOB_PATH ||
      process.env.PANTAVION_WATER_SOURCE_BLOB_PATH
    ),
    canonicalAuthorizationStore: "supabase-postgres",
    cMapTelemetryProviderConfigured: Boolean(process.env.PANTAVION_WATER_TELEMETRY_PROVIDER),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as RegistryRequestBody;
    const access = await authorizeRegistryAccess(request, body);
    if (!access.ok) return NextResponse.json(
      { ok: false, error: "water_maps_require_approved_access", noApprovalNoMaps: true },
      { status: 403, headers: { "Cache-Control": "no-store" } }
    );
    return NextResponse.json({
      ok: true,
      accessMode: access.mode,
      contract: getPantavionWaterAbcMapSystemContract(),
      sourcePresence: readSourcePresence(),
      runtimeBoundary: {
        rawBMasterReturned: false,
        rawDtxCadDownloadProvided: false,
        publicFullNetworkExport: false,
        browserFullNetworkLoad: false,
        userCanMutateMaster: false,
        authorizationFailClosed: true,
        authorizationProviderNeutral: true,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "water_maps_registry_failed" }, { status: 500 });
  }
}
