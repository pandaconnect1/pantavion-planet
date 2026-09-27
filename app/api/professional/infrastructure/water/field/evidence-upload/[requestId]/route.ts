import "server-only";

import { NextResponse } from "next/server";

import { authorizeWaterMapRequest } from "@/core/security/water-map-request-access";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "personal-media";

export async function GET(
  request: Request,
  context: { params: Promise<{ requestId: string }> },
) {
  const access = await authorizeWaterMapRequest(request);

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const { requestId } = await context.params;

    if (!/^water-field-artifact-[0-9a-f-]{36}$/i.test(requestId)) {
      return NextResponse.json(
        { ok: false, error: "water_field_request_id_invalid" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const admin = createAdminClient();
    const { data: row, error } = await admin
      .from("water_field_artifact_uploads")
      .select("*")
      .eq("request_id", requestId)
      .maybeSingle();

    if (error) throw error;
    if (!row) {
      return NextResponse.json(
        { ok: false, error: "water_field_artifact_not_found" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    const artifactRef = `water-field-artifact:${requestId}`;
    let visible =
      access.mode === "admin-session" || row.actor_ref === access.actorRef;

    if (!visible) {
      const [pinLookup, patchLookup] = await Promise.all([
        admin
          .from("water_map_evidence_pins")
          .select("pin_id")
          .eq("review_state", "approved")
          .contains("artifact_refs", [artifactRef])
          .limit(1),
        admin
          .from("water_spatial_patches")
          .select("patch_id")
          .in("status", [
            "approved_overlay",
            "officialization_candidate",
            "officialized",
          ])
          .contains("artifact_refs", [artifactRef])
          .limit(1),
      ]);

      if (pinLookup.error) throw pinLookup.error;
      if (patchLookup.error) throw patchLookup.error;

      visible =
        Boolean(pinLookup.data?.length) || Boolean(patchLookup.data?.length);
    }

    if (!visible) {
      return NextResponse.json(
        { ok: false, error: "water_field_artifact_not_visible" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const storagePath = String(row.storage_path || "");
    if (
      row.storage_bucket !== BUCKET ||
      !storagePath.startsWith("water-network-private/field-evidence/") ||
      storagePath.includes("..")
    ) {
      throw new Error("water_field_storage_path_invalid");
    }

    const { data, error: signedError } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 120);

    if (signedError || !data?.signedUrl) {
      throw new Error("water_field_signed_read_failed");
    }

    return NextResponse.json(
      {
        ok: true,
        requestId,
        artifactRef,
        fileName: row.original_file_name,
        mimeType: row.mime_type,
        sizeBytes: Number(row.file_size_bytes),
        verification: row.upload_state,
        signedUrl: data.signedUrl,
        expiresInSeconds: 120,
        public: false,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
          "X-Pantavion-Water-Artifact": "private-signed-access",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "water_field_artifact_access_failed",
      },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
