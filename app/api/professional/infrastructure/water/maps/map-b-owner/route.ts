import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { evaluatePrivilegedRequestBoundary } from "@/core/security/privileged-request-boundary";
import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "@/core/water/water-map-b-source-candidates";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BUCKET = "personal-media";

function noStore(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  return NextResponse.json(body, { ...init, headers });
}

function resolveSourceKey(value: unknown): WaterMapBSourceKey {
  return value === "legacy-george-85m"
    ? "legacy-george-85m"
    : "canonical-2026-andreaspap";
}

function privilegedBoundaryDenied(request: Request) {
  const decision = evaluatePrivilegedRequestBoundary(request);
  if (decision.allowed) return null;

  return noStore(
    {
      ok: false,
      error:
        decision.reason === "json_required"
          ? "application_json_required"
          : "privileged_request_denied",
    },
    { status: decision.reason === "json_required" ? 415 : 403 },
  );
}

async function registryState(
  admin: ReturnType<typeof createAdminClient>,
  source: (typeof WATER_MAP_B_SOURCE_CANDIDATES)[WaterMapBSourceKey],
) {
  const { data, error } = await admin
    .from("water_map_ingest_catalog")
    .select(
      "source_id,storage_path,sha256,file_size_bytes,ingest_state,review_state",
    )
    .eq("storage_path", source.storagePath)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function verifyExactObject(
  admin: ReturnType<typeof createAdminClient>,
  source: (typeof WATER_MAP_B_SOURCE_CANDIDATES)[WaterMapBSourceKey],
) {
  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(source.storagePath, 300);

  if (error || !data?.signedUrl) {
    return { ok: false as const, error: "water_map_source_not_present", status: 404 };
  }

  const response = await fetch(data.signedUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return { ok: false as const, error: "water_map_source_read_failed", status: 502 };
  }

  const hash = createHash("sha256");
  let sizeBytes = 0;
  let header = Buffer.alloc(0);
  const reader = response.body.getReader();

  while (true) {
    const part = await reader.read();
    if (part.done) break;

    const chunk = Buffer.from(part.value);
    sizeBytes += chunk.byteLength;
    hash.update(chunk);

    if (header.byteLength < 6) {
      header = Buffer.concat([header, chunk.subarray(0, 6 - header.byteLength)]);
    }
  }

  const sha256 = hash.digest("hex");
  const dwgHeader = header.subarray(0, 6).toString("ascii");
  const verified =
    sizeBytes === source.byteSize &&
    sha256 === source.sha256 &&
    dwgHeader === source.dwgHeader;

  return {
    ok: verified,
    error: verified ? null : "water_map_verification_mismatch",
    status: verified ? 200 : 409,
    sizeBytes,
    sha256,
    header: dwgHeader,
  };
}

export async function POST(request: Request) {
  const boundaryResponse = privilegedBoundaryDenied(request);
  if (boundaryResponse) return boundaryResponse;

  if (!(await hasWaterAdminAuthorization(request))) {
    return noStore(
      {
        ok: false,
        error: "water_founder_admin_session_required",
        founderAccessPath: "/professional/infrastructure/water/admin/access",
      },
      { status: 403 },
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const action = typeof body.action === "string" ? body.action : "status";
    const sourceKey = resolveSourceKey(body.sourceKey);
    const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
    const admin = createAdminClient();

    if (action === "status") {
      const registry = await registryState(admin, source);
      const { data: version, error: versionError } = await admin
        .from("water_map_versions")
        .select("version_id,status,version_number,label")
        .eq("source_fingerprint", source.sha256)
        .maybeSingle();

      if (versionError) throw versionError;

      const verified = Boolean(
        registry &&
          registry.sha256 === source.sha256 &&
          Number(registry.file_size_bytes) === source.byteSize &&
          registry.ingest_state === "ready" &&
          (registry.review_state === "trusted_admin" ||
            registry.review_state === "approved"),
      );

      return noStore({
        ok: true,
        status: verified ? "verified" : "missing_or_unverified",
        sourceKey,
        canonical: source.canonical,
        verified,
        fileName: source.fileName,
        sizeBytes: source.byteSize,
        sha256: source.sha256,
        versionId: version?.version_id || null,
        versionStatus: version?.status || null,
      });
    }

    if (action === "sign") {
      const folder = source.storagePath.slice(
        0,
        source.storagePath.lastIndexOf("/"),
      );
      const objectName = source.storagePath.slice(
        source.storagePath.lastIndexOf("/") + 1,
      );

      const { data: existing, error: listError } = await admin.storage
        .from(BUCKET)
        .list(folder, { search: objectName, limit: 10 });

      if (listError) throw listError;

      if (existing?.some((item) => item.name === objectName)) {
        return noStore({
          ok: true,
          status: "already_present",
          sourceKey,
          bucket: BUCKET,
          path: source.storagePath,
          fileName: source.fileName,
          expectedSizeBytes: source.byteSize,
          expectedSha256: source.sha256,
        });
      }

      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUploadUrl(source.storagePath, { upsert: false });

      if (error || !data?.token) {
        throw new Error("water_map_signed_upload_failed");
      }

      return noStore({
        ok: true,
        status: "ready",
        sourceKey,
        bucket: BUCKET,
        path: data.path || source.storagePath,
        token: data.token,
        fileName: source.fileName,
        expectedSizeBytes: source.byteSize,
        expectedSha256: source.sha256,
      });
    }

    if (action === "verify") {
      const result = await verifyExactObject(admin, source);

      if (!result.ok) {
        let quarantinePath: string | null = null;

        if ("sha256" in result && result.sha256) {
          const stamp = new Date().toISOString().replace(/[:.]/g, "-");
          quarantinePath =
            `water-network-private/quarantine/map-${source.mapId.toLowerCase()}/${sourceKey}/${stamp}-${result.sha256}.dwg`;

          const { error: moveError } = await admin.storage
            .from(BUCKET)
            .move(source.storagePath, quarantinePath);

          if (moveError) quarantinePath = null;
        }

        return noStore(
          {
            ok: false,
            error: result.error,
            sourceKey,
            expectedSizeBytes: source.byteSize,
            actualSizeBytes: "sizeBytes" in result ? result.sizeBytes : null,
            expectedSha256: source.sha256,
            actualSha256: "sha256" in result ? result.sha256 : null,
            header: "header" in result ? result.header : null,
            quarantined: Boolean(quarantinePath),
            quarantinePath,
          },
          { status: result.status },
        );
      }

      const now = new Date().toISOString();
      const requestId = `water-${source.mapId.toLowerCase()}-owner-${sourceKey}-${source.sha256.slice(0, 12)}`;
      const record = {
        request_id: requestId,
        actor_kind: "admin_session",
        actor_ref: "water-admin-session",
        device_id: null,
        original_file_name: source.fileName,
        normalized_extension: "dwg",
        mime_type: "application/acad",
        file_size_bytes: source.byteSize,
        storage_bucket: BUCKET,
        storage_path: source.storagePath,
        detected_format: "dwg",
        format_family: "cad",
        adapter_state: "known_adapter",
        ingest_state: "ready",
        review_state: "trusted_admin",
        coordinate_reference_system: null,
        sha256: source.sha256,
        metadata: {
          dwgHeader: source.dwgHeader,
          sourceKey,
          canonicalSource: source.canonical,
          mapId: source.mapId,
          mapRole: source.mapRole,
          viewer: "mlightcad-libredwg",
          readOnly: true,
        },
        provenance: {
          ownerConfirmed: true,
          immutableSource: true,
          uploadedAt: now,
          verification: "sha256+size+dwg-header",
          accessMode: "water-admin-session",
        },
        updated_at: now,
      };

      const current = await registryState(admin, source);
      if (current?.source_id) {
        const { error } = await admin
          .from("water_map_ingest_catalog")
          .update(record)
          .eq("source_id", current.source_id);
        if (error) throw error;
      } else {
        const { error } = await admin.from("water_map_ingest_catalog").insert({
          source_id: crypto.randomUUID(),
          ...record,
          created_at: now,
        });
        if (error) throw error;
      }

      const { data: existingVersion, error: versionLookupError } = await admin
        .from("water_map_versions")
        .select("version_id,status")
        .eq("source_fingerprint", source.sha256)
        .maybeSingle();

      if (versionLookupError) throw versionLookupError;

      let versionId = existingVersion?.version_id || null;
      if (!existingVersion) {
        const { data: insertedVersion, error: versionInsertError } = await admin
          .from("water_map_versions")
          .insert({
            map_id: source.mapId,
            source_key: sourceKey,
            version_number: source.versionNumber,
            label: source.label,
            status: "candidate",
            source_ref: `supabase://${BUCKET}/${source.storagePath}`,
            source_fingerprint: source.sha256,
            storage_bucket: BUCKET,
            storage_path: source.storagePath,
            source_date: null,
            received_by: "water-admin-session",
            crs_authority: null,
            crs_code: null,
            immutable_source: true,
            deleted_automatically: false,
            notes: [
              "Exact DWG bytes verified by size, SHA-256 and AC1032 header.",
              "Geographic alignment remains a separate review step.",
            ],
            metadata: {
              dwgHeader: source.dwgHeader,
              sourceKey,
              canonicalSource: source.canonical,
              mapId: source.mapId,
              mapRole: source.mapRole,
              byteVerified: true,
              geographicAlignmentVerified: false,
            },
          })
          .select("version_id")
          .single();

        if (versionInsertError) throw versionInsertError;
        versionId = insertedVersion.version_id;
      }

      return noStore({
        ok: true,
        status: `verified_exact_owner_map_${source.mapId.toLowerCase()}`,
        sourceKey,
        canonical: source.canonical,
        fileName: source.fileName,
        actualSizeBytes: result.sizeBytes,
        actualSha256: result.sha256,
        header: result.header,
        bucket: BUCKET,
        path: source.storagePath,
        versionId,
        versionStatus: existingVersion?.status || "candidate",
      });
    }

    if (action === "download") {
      const registry = await registryState(admin, source);
      const verified = Boolean(
        registry &&
          registry.sha256 === source.sha256 &&
          Number(registry.file_size_bytes) === source.byteSize &&
          registry.ingest_state === "ready" &&
          (registry.review_state === "trusted_admin" ||
            registry.review_state === "approved"),
      );

      if (!verified) {
        return noStore(
          { ok: false, error: "water_map_source_not_verified", sourceKey },
          { status: 409 },
        );
      }

      const { data, error } = await admin.storage
        .from(BUCKET)
        .createSignedUrl(source.storagePath, 300);

      if (error || !data?.signedUrl) {
        return noStore(
          { ok: false, error: "water_map_signed_download_failed", sourceKey },
          { status: 404 },
        );
      }

      return noStore({
        ok: true,
        status: "ready",
        sourceKey,
        canonical: source.canonical,
        signedUrl: data.signedUrl,
        fileName: source.fileName,
        sizeBytes: source.byteSize,
        sha256: source.sha256,
      });
    }

    return noStore({ ok: false, error: "unknown_action" }, { status: 400 });
  } catch (error) {
    return noStore(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "map_b_owner_server_error",
      },
      { status: 500 },
    );
  }
}
