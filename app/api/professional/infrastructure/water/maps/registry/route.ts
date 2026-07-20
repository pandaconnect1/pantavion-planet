import { createHash } from "crypto";

import { list } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getPantavionWaterAbcMapSystemContract } from "@/core/infrastructure/water/water-abc-map-system-contract";
import { hasWaterAdminSession } from "@/core/security/water-admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlobLike = {
  url: string;
  downloadUrl?: string;
  pathname: string;
};

type ApprovedWaterDevicePayload = {
  status?: string;
  revoked?: boolean;
  tokenHash?: string;
};

type RegistryRequestBody = {
  deviceId?: string;
  deviceToken?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

  return response.json() as Promise<ApprovedWaterDevicePayload>;
}

async function approvedDeviceMatches(deviceId: string, deviceToken: string) {
  if (!deviceId || !deviceToken) return false;

  try {
    const pathname = `water/private/approved-devices/${deviceId}.json`;
    const result = await list({
      prefix: pathname,
      limit: 1,
    });

    const blob = (result.blobs as BlobLike[]).find((item) => item.pathname === pathname);
    if (!blob) return false;

    const payload = await readJsonBlob(blob);
    const tokenHash = hashToken(deviceToken);

    if (clean(payload.status) !== "approved") return false;
    if (payload.revoked === true) return false;
    if (clean(payload.tokenHash) !== tokenHash) return false;

    return true;
  } catch {
    return false;
  }
}

async function authorizeRegistryAccess(request: Request, body: RegistryRequestBody) {
  const deviceId = clean(body.deviceId);
  const deviceToken = clean(body.deviceToken);

  if (hasWaterAdminSession(request)) {
    return {
      ok: true,
      mode: "admin-session" as const,
    };
  }

  if (await approvedDeviceMatches(deviceId, deviceToken)) {
    return {
      ok: true,
      mode: "approved-user" as const,
    };
  }

  return {
    ok: false,
    mode: "denied" as const,
  };
}

function readSourcePresence() {
  return {
    bMasterPrivateBlobReferenceConfigured: Boolean(
      process.env.PANTAVION_WATER_B_MASTER_BLOB_PATH ||
        process.env.PANTAVION_WATER_DTX_BLOB_PATH ||
        process.env.PANTAVION_WATER_DWG_BLOB_PATH ||
        process.env.PANTAVION_WATER_SOURCE_BLOB_PATH,
    ),
    derivedOperationalGeoIndexConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    cMapTelemetryProviderConfigured: Boolean(process.env.PANTAVION_WATER_TELEMETRY_PROVIDER),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistryRequestBody;
    const access = await authorizeRegistryAccess(request, body);

    if (!access.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "water_maps_require_approved_access",
          noApprovalNoMaps: true,
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        accessMode: access.mode,
        contract: getPantavionWaterAbcMapSystemContract(),
        sourcePresence: readSourcePresence(),
        runtimeBoundary: {
          rawBMasterReturned: false,
          rawDtxCadDownloadProvided: false,
          publicFullExportProvided: false,
          browserFullNetworkLoaded: false,
          userCanMutateMasterDirectly: false,
        },
        checkedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-Pantavion-Water-Maps": "approved-a-b-c-registry",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "water_maps_registry_failed",
      },
      { status: 500 },
    );
  }
}
