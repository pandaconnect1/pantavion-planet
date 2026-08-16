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

export async function POST(request: Request) {
  if (!hasWaterAdminSession(request)) {
    return Response.json(
      { ok: false, status: "water_admin_session_required" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from(FINAL_MASTER_DWG_STORAGE_BUCKET)
      .createSignedUploadUrl(FINAL_MASTER_DWG_STORAGE_PATH, { upsert: true });

    if (error || !data?.signedUrl || !data?.token) {
      return Response.json(
        {
          ok: false,
          status: "signed_upload_url_failed",
          message: error?.message || "signed_upload_url_failed",
        },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return Response.json(
      {
        ok: true,
        bucket: FINAL_MASTER_DWG_STORAGE_BUCKET,
        path: data.path || FINAL_MASTER_DWG_STORAGE_PATH,
        signedUrl: data.signedUrl,
        token: data.token,
        fileName: FINAL_MASTER_DWG_FILE_NAME,
        expectedSizeBytes: FINAL_MASTER_DWG_SIZE_BYTES,
        expectedSha256: FINAL_MASTER_DWG_SHA256,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "signed_upload_url_error",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
