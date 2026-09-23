import { createHash } from "crypto";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { migrateLegacyApprovedDeviceIfPresent } from "@/core/water/water-access-store";
import {
  FINAL_MASTER_DWG_FILE_NAME,
  FINAL_MASTER_DWG_SHA256,
  FINAL_MASTER_DWG_SIZE_BYTES,
  FINAL_MASTER_DWG_STORAGE_BUCKET,
  FINAL_MASTER_DWG_STORAGE_PATH,
} from "@/core/water/final-master-dwg-source";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function privateHeaders() {
  return {
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Pantavion-File-Type": "original-dwg",
    "X-Pantavion-Source": "MAP_B_EXACT_ORIGINAL",
    "X-Pantavion-Size-Bytes": String(FINAL_MASTER_DWG_SIZE_BYTES),
    "X-Pantavion-SHA256": FINAL_MASTER_DWG_SHA256,
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function hasApprovedMapBAccess(request: Request) {
  if (await hasWaterAdminAuthorization(request)) return true;

  const deviceId = clean(request.headers.get("x-pantavion-water-device-id"));
  const deviceToken = clean(request.headers.get("x-pantavion-water-device-token"));

  if (!deviceId || !deviceToken) return false;

  return Boolean(
    await migrateLegacyApprovedDeviceIfPresent(
      deviceId,
      hashToken(deviceToken),
    ),
  );
}

export async function GET(request: Request) {
  if (!(await hasApprovedMapBAccess(request))) {
    return Response.json(
      { ok: false, status: "water_access_not_approved" },
      { status: 403, headers: privateHeaders() },
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(FINAL_MASTER_DWG_STORAGE_BUCKET)
      .createSignedUrl(FINAL_MASTER_DWG_STORAGE_PATH, 60, {
        download: FINAL_MASTER_DWG_FILE_NAME,
      });

    if (error || !data?.signedUrl) {
      return Response.json(
        {
          ok: false,
          status: "original_dwg_not_available",
          fileName: FINAL_MASTER_DWG_FILE_NAME,
          expectedSizeBytes: FINAL_MASTER_DWG_SIZE_BYTES,
          expectedSha256: FINAL_MASTER_DWG_SHA256,
          storagePath: FINAL_MASTER_DWG_STORAGE_PATH,
        },
        { status: 404, headers: privateHeaders() },
      );
    }

    return Response.redirect(data.signedUrl, 307);
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "original_dwg_storage_error",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: privateHeaders() },
    );
  }
}
