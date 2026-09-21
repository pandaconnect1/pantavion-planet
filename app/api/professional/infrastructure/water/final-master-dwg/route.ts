import { hasWaterAdminSession } from "@/core/security/water-admin-session";
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

export async function GET(request: Request) {
  if (!hasWaterAdminSession(request)) {
    return Response.json(
      { ok: false, status: "water_admin_session_required" },
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
