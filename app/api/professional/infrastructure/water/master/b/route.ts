import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import {
  FINAL_MASTER_DWG_FILE_NAME,
  FINAL_MASTER_DWG_SHA256,
  FINAL_MASTER_DWG_SIZE_BYTES,
  FINAL_MASTER_DWG_STORAGE_BUCKET,
  FINAL_MASTER_DWG_STORAGE_PATH,
} from "@/core/water/final-master-dwg-source";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REGISTRY_MARKER = "pantavion_water_b_master_registry_api_v2";

export async function GET(request: Request) {
  if (!(await hasWaterAdminAuthorization(request))) {
    return NextResponse.json(
      {
        ok: false,
        marker: REGISTRY_MARKER,
        error: "unauthorized",
        policy: {
          rawDwgDownloadAllowed: false,
          publicAccessAllowed: false,
          approvedUserMapViewOnly: true,
        },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const admin = createAdminClient();

    const [{ data: registry, error: registryError }, storageResult] = await Promise.all([
      admin
        .from("water_map_ingest_catalog")
        .select(
          "source_id, original_file_name, file_size_bytes, storage_bucket, storage_path, detected_format, adapter_state, ingest_state, review_state, coordinate_reference_system, sha256, metadata, provenance, updated_at",
        )
        .eq("storage_bucket", FINAL_MASTER_DWG_STORAGE_BUCKET)
        .eq("storage_path", FINAL_MASTER_DWG_STORAGE_PATH)
        .maybeSingle(),
      (async () => {
        const folder = FINAL_MASTER_DWG_STORAGE_PATH.slice(
          0,
          FINAL_MASTER_DWG_STORAGE_PATH.lastIndexOf("/"),
        );
        const objectName = FINAL_MASTER_DWG_STORAGE_PATH.slice(
          FINAL_MASTER_DWG_STORAGE_PATH.lastIndexOf("/") + 1,
        );

        const { data, error } = await admin.storage
          .from(FINAL_MASTER_DWG_STORAGE_BUCKET)
          .list(folder, { search: objectName, limit: 10 });

        return {
          available: !error && Boolean(data?.some((item) => item.name === objectName)),
          error: error?.message || null,
        };
      })(),
    ]);

    if (registryError) throw registryError;

    const registryIdentityMatches = Boolean(
      registry &&
        registry.original_file_name === FINAL_MASTER_DWG_FILE_NAME &&
        Number(registry.file_size_bytes) === FINAL_MASTER_DWG_SIZE_BYTES &&
        registry.sha256 === FINAL_MASTER_DWG_SHA256 &&
        registry.detected_format === "dwg",
    );

    const verifiedReady = Boolean(
      registryIdentityMatches &&
        registry?.ingest_state === "ready" &&
        (registry?.review_state === "trusted_admin" ||
          registry?.review_state === "approved"),
    );

    return NextResponse.json(
      {
        ok: true,
        marker: REGISTRY_MARKER,
        access: "founder",
        bMaster: {
          role: "B_AUTHENTIC_MASTER_MAP",
          sourceFormat: "DWG",
          storageProvider: "supabase-storage",
          bucket: FINAL_MASTER_DWG_STORAGE_BUCKET,
          path: FINAL_MASTER_DWG_STORAGE_PATH,
          expectedFileName: FINAL_MASTER_DWG_FILE_NAME,
          expectedSizeBytes: FINAL_MASTER_DWG_SIZE_BYTES,
          expectedSha256: FINAL_MASTER_DWG_SHA256,
          binaryAvailable: storageResult.available,
          registryPresent: Boolean(registry),
          registryIdentityMatches,
          verifiedReady,
          adapterState: registry?.adapter_state || null,
          coordinateReferenceSystem: registry?.coordinate_reference_system || null,
          updatedAt: registry?.updated_at || null,
        },
        policy: {
          approvedUsersSeeBMapViewInsidePantavion: true,
          rawDwgDownloadAllowedForApprovedUsers: false,
          publicAccessAllowed: false,
          githubUploadAllowed: false,
          browserFullNetworkLoadAllowed: false,
          directMasterMutationAllowed: false,
          founderAdminControlsNewVersions: true,
        },
        next: {
          uploadCanonicalBinaryRequired: !storageResult.available,
          registryVerificationRequired: storageResult.available && !verifiedReady,
          bDerivedViewRequired: true,
          cIntelligentMapRequired: true,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        marker: REGISTRY_MARKER,
        error: "map_b_registry_check_failed",
        message: error instanceof Error ? error.message : "unknown_error",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
