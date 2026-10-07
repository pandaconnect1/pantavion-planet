import { createHash } from "node:crypto";
import { WATER_MAP_B_SOURCE_CANDIDATES, type WaterMapBSourceKey } from "@/core/water/water-map-b-source-candidates";
import { createAdminClient } from "@/lib/supabase/admin";
const SUPABASE_BUCKET = "personal-media";
const CANONICAL_SUPABASE_PROJECT_REF = "cxhulvwkagzufbjsdwwu";
const CANONICAL_SUPABASE_URL = `https://${CANONICAL_SUPABASE_PROJECT_REF}.supabase.co`;

function createCanonicalAdminClient() {
  return createAdminClient({ url: CANONICAL_SUPABASE_URL });
}
type VerificationMarker = {
  marker: "pantavion_water_canonical_object_verification_v1";
  sourceKey: WaterMapBSourceKey;
  sha256: string;
  sizeBytes: number;
  header: string;
  etag: string | null;
  verifiedAt: string;
};
export async function supabaseObjectState(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createCanonicalAdminClient();
  const folder = source.storagePath.slice(0, source.storagePath.lastIndexOf("/"));
  const objectName = source.storagePath.slice(source.storagePath.lastIndexOf("/") + 1);
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .list(folder, { search: objectName, limit: 10 });

  if (error) throw error;

  const item = data?.find((entry) => entry.name === objectName) ?? null;
  const contentLength = Number(
    item?.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>).size ?? 0
      : 0,
  );

  return {
    provider: "supabase-storage" as const,
    bucket: SUPABASE_BUCKET,
    path: source.storagePath,
    present: Boolean(item),
    contentLength,
    sizeMatches: Boolean(item) && contentLength === source.byteSize,
    etag:
      item?.metadata && typeof item.metadata === "object"
        ? String((item.metadata as Record<string, unknown>).eTag ?? "") || null
        : null,
  };
}

export async function writeSupabaseVerificationMarker(
  sourceKey: WaterMapBSourceKey,
  result: {
    sha256: string;
    sizeBytes: number;
    header: string;
    etag: string | null;
  },
) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createCanonicalAdminClient();
  const marker: VerificationMarker = {
    marker: "pantavion_water_canonical_object_verification_v1",
    sourceKey,
    sha256: result.sha256,
    sizeBytes: result.sizeBytes,
    header: result.header,
    etag: result.etag,
    verifiedAt: new Date().toISOString(),
  };

  const { error } = await admin.storage.from(SUPABASE_BUCKET).upload(
    `${source.storagePath}.verified.json`,
    Buffer.from(JSON.stringify(marker, null, 2) + "\n", "utf8"),
    {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    },
  );

  if (error) {
    throw new Error(`water_supabase_verification_marker_write_failed:${error.message}`);
  }

  return marker;
}

export async function verifySupabaseObject(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createCanonicalAdminClient();
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(source.storagePath, 900);

  if (error || !data?.signedUrl) {
    return {
      ok: false as const,
      status: 404,
      error: "water_supabase_object_read_failed",
    };
  }

  const response = await fetch(data.signedUrl, { cache: "no-store" });
  if (!response.ok || !response.body) {
    return {
      ok: false as const,
      status: response.status || 502,
      error: "water_supabase_object_read_failed",
    };
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
      header = Buffer.concat([
        header,
        chunk.subarray(0, 6 - header.byteLength),
      ]);
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
    status: verified ? 200 : 409,
    error: verified ? null : "water_object_identity_mismatch",
    key: source.storagePath,
    sizeBytes,
    sha256,
    header: dwgHeader,
    etag: response.headers.get("etag"),
  };
}

export async function createSupabaseSignedUpload(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const existing = await supabaseObjectState(sourceKey);
  if (existing.present) {
    return {
      ok: false as const,
      status: 409,
      error: "canonical_object_already_present",
      existing,
    };
  }

  const admin = createCanonicalAdminClient();
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUploadUrl(source.storagePath, { upsert: false });

  if (error || !data?.token) {
    throw new Error(
      `water_supabase_signed_upload_failed:${error?.message || "missing_token"}`,
    );
  }

  return {
    ok: true as const,
    status: 200,
    provider: "supabase-storage" as const,
    bucket: SUPABASE_BUCKET,
    path: source.storagePath,
    token: data.token,
    resumableEndpoint:
      `https://${CANONICAL_SUPABASE_PROJECT_REF}.storage.supabase.co/storage/v1/upload/resumable`,
    chunkSizeBytes: 6 * 1024 * 1024,
  };
}


