import { hasWaterAdminSession } from "@/core/security/water-admin-session";
import {
  LEGACY_MAP_BC_FILE_NAME,
  LEGACY_MAP_BC_SHA256,
  LEGACY_MAP_BC_SIZE_BYTES,
  LEGACY_MAP_BC_STORAGE_BUCKET,
  LEGACY_MAP_BC_STORAGE_PATH,
} from "@/core/water/legacy-map-bc-source";
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
    const folder = "water-network-private/source-masters/legacy-map-bc";
    const { data: existing, error: listError } = await admin.storage
      .from(LEGACY_MAP_BC_STORAGE_BUCKET)
      .list(folder, { search: LEGACY_MAP_BC_FILE_NAME, limit: 10 });

    if (listError) {
      return Response.json(
        { ok: false, status: "legacy_map_bc_list_failed", message: listError.message },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    if (existing?.some((item) => item.name === LEGACY_MAP_BC_FILE_NAME)) {
      return Response.json(
        {
          ok: true,
          status: "already_present",
          bucket: LEGACY_MAP_BC_STORAGE_BUCKET,
          path: LEGACY_MAP_BC_STORAGE_PATH,
          fileName: LEGACY_MAP_BC_FILE_NAME,
          expectedSizeBytes: LEGACY_MAP_BC_SIZE_BYTES,
          expectedSha256: LEGACY_MAP_BC_SHA256,
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const { data, error } = await admin.storage
      .from(LEGACY_MAP_BC_STORAGE_BUCKET)
      .createSignedUploadUrl(LEGACY_MAP_BC_STORAGE_PATH, { upsert: false });

    if (error || !data?.token) {
      return Response.json(
        {
          ok: false,
          status: "legacy_map_bc_signed_upload_failed",
          message: error?.message || "missing_upload_token",
        },
        { status: 500, headers: { "Cache-Control": "private, no-store" } },
      );
    }

    return Response.json(
      {
        ok: true,
        status: "ready",
        bucket: LEGACY_MAP_BC_STORAGE_BUCKET,
        path: data.path || LEGACY_MAP_BC_STORAGE_PATH,
        signedUrl: data.signedUrl,
        token: data.token,
        fileName: LEGACY_MAP_BC_FILE_NAME,
        expectedSizeBytes: LEGACY_MAP_BC_SIZE_BYTES,
        expectedSha256: LEGACY_MAP_BC_SHA256,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        status: "legacy_map_bc_upload_url_error",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
