import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import {
  presignObjectDownload,
  presignObjectHead,
  presignObjectUpload,
} from "@/core/infrastructure/water/s3-compatible-object-storage";
import {
  WATER_MAP_B_SOURCE_CANDIDATES,
  type WaterMapBSourceKey,
} from "@/core/water/water-map-b-source-candidates";
import {
  createAdminClient,
  hasSupabaseAdminCredential,
} from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const SUPABASE_BUCKET = "personal-media";
const CANONICAL_SUPABASE_PROJECT_REF = "cxhulvwkagzufbjsdwwu";
const CANONICAL_CHUNK_SIZE_BYTES = 32 * 1024 * 1024;

function noStore(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function resolveSourceKey(value: unknown): WaterMapBSourceKey {
  return value === "legacy-george-85m"
    ? "legacy-george-85m"
    : "canonical-2026-andreaspap";
}

function sourceObjectKey(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  return `water/canonical/map-${source.mapId.toLowerCase()}/${source.sha256}.dwg`;
}

function verificationObjectKey(sourceKey: WaterMapBSourceKey) {
  return `${sourceObjectKey(sourceKey)}.verified.json`;
}

type TransferAuthorization = "primary" | "library_import" | null;

type VerificationMarker = {
  marker: "pantavion_water_canonical_object_verification_v1";
  sourceKey: WaterMapBSourceKey;
  sha256: string;
  sizeBytes: number;
  header: string;
  etag: string | null;
  verifiedAt: string;
};

function safeSecretMatch(expected: string, actual: string) {
  if (!expected || !actual) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function transferAuthorization(request: Request): TransferAuthorization {
  const primary = (process.env.PANTAVION_WATER_TRANSFER_SECRET || "").trim();
  const libraryImport = (
    process.env.PANTAVION_WATER_LIBRARY_IMPORT_SECRET || ""
  ).trim();
  const actual = (request.headers.get("x-pantavion-transfer-secret") || "").trim();

  if (safeSecretMatch(primary, actual)) return "primary";
  if (safeSecretMatch(libraryImport, actual)) return "library_import";
  return null;
}

async function headObject(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const key = sourceObjectKey(sourceKey);
  const signed = presignObjectHead(key, 300);
  const response = await fetch(signed.url, {
    method: "HEAD",
    cache: "no-store",
  });
  const contentLength = Number(response.headers.get("content-length") || 0);

  return {
    key,
    present: response.ok,
    httpStatus: response.status,
    contentLength,
    sizeMatches: response.ok && contentLength === source.byteSize,
    etag: response.headers.get("etag"),
  };
}

async function readVerificationMarker(
  sourceKey: WaterMapBSourceKey,
): Promise<VerificationMarker | null> {
  const signed = presignObjectDownload(verificationObjectKey(sourceKey), 120);
  const response = await fetch(signed.url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) return null;

  const marker = (await response.json().catch(() => null)) as VerificationMarker | null;
  return marker?.marker === "pantavion_water_canonical_object_verification_v1"
    ? marker
    : null;
}

async function writeVerificationMarker(
  sourceKey: WaterMapBSourceKey,
  result: {
    sha256: string;
    sizeBytes: number;
    header: string;
    etag: string | null;
  },
) {
  const marker: VerificationMarker = {
    marker: "pantavion_water_canonical_object_verification_v1",
    sourceKey,
    sha256: result.sha256,
    sizeBytes: result.sizeBytes,
    header: result.header,
    etag: result.etag,
    verifiedAt: new Date().toISOString(),
  };

  const signed = presignObjectUpload(verificationObjectKey(sourceKey), 300);
  const response = await fetch(signed.url, {
    method: "PUT",
    cache: "no-store",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(marker),
  });

  if (!response.ok) {
    throw new Error(`water_object_verification_marker_write_failed_${response.status}`);
  }

  return marker;
}


async function supabaseObjectState(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createAdminClient();
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

async function readSupabaseVerificationMarker(
  sourceKey: WaterMapBSourceKey,
): Promise<VerificationMarker | null> {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .download(`${source.storagePath}.verified.json`);

  if (error || !data) return null;
  const marker = JSON.parse(await data.text()) as VerificationMarker | null;
  return marker?.marker === "pantavion_water_canonical_object_verification_v1"
    ? marker
    : null;
}

async function writeSupabaseVerificationMarker(
  sourceKey: WaterMapBSourceKey,
  result: {
    sha256: string;
    sizeBytes: number;
    header: string;
    etag: string | null;
  },
) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createAdminClient();
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

async function verifySupabaseObject(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const admin = createAdminClient();
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

async function verifiedSupabaseObjectState(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const raw = await supabaseObjectState(sourceKey);
  const marker = raw.present
    ? await readSupabaseVerificationMarker(sourceKey)
    : null;
  const verified = Boolean(
    raw.present &&
      raw.sizeMatches &&
      marker &&
      marker.sourceKey === sourceKey &&
      marker.sha256 === source.sha256 &&
      marker.sizeBytes === source.byteSize &&
      marker.header === source.dwgHeader,
  );

  return {
    ...raw,
    markerPresent: Boolean(marker),
    verified,
  };
}

async function createSupabaseSignedUpload(sourceKey: WaterMapBSourceKey) {
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

  const admin = createAdminClient();
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


function canonicalChunkPrefix(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  return `water-network-private/source-masters/chunked/map-${source.mapId.toLowerCase()}/${source.sha256}`;
}

function canonicalChunkCount(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  return Math.ceil(source.byteSize / CANONICAL_CHUNK_SIZE_BYTES);
}

function canonicalChunkExpectedSize(
  sourceKey: WaterMapBSourceKey,
  chunkIndex: number,
) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const total = canonicalChunkCount(sourceKey);
  if (!Number.isInteger(chunkIndex) || chunkIndex < 0 || chunkIndex >= total) {
    return null;
  }
  if (chunkIndex < total - 1) return CANONICAL_CHUNK_SIZE_BYTES;
  return source.byteSize - CANONICAL_CHUNK_SIZE_BYTES * (total - 1);
}

function canonicalChunkPath(sourceKey: WaterMapBSourceKey, chunkIndex: number) {
  return `${canonicalChunkPrefix(sourceKey)}/chunks/${String(chunkIndex).padStart(3, "0")}.part`;
}

function canonicalChunkManifestPath(sourceKey: WaterMapBSourceKey) {
  return `${canonicalChunkPrefix(sourceKey)}/manifest.json`;
}

function canonicalChunkVerificationPath(sourceKey: WaterMapBSourceKey) {
  return `${canonicalChunkPrefix(sourceKey)}/verified.json`;
}

async function supabasePathState(path: string) {
  const admin = createAdminClient();
  const slash = path.lastIndexOf("/");
  const folder = path.slice(0, slash);
  const objectName = path.slice(slash + 1);
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .list(folder, { search: objectName, limit: 10 });
  if (error) throw error;
  const item = data?.find((entry) => entry.name === objectName) ?? null;
  const metadata =
    item?.metadata && typeof item.metadata === "object"
      ? (item.metadata as Record<string, unknown>)
      : null;
  return {
    present: Boolean(item),
    sizeBytes: Number(metadata?.size ?? 0),
    etag: metadata ? String(metadata.eTag ?? metadata.etag ?? "") || null : null,
  };
}

async function createSupabaseChunkSignedUpload(
  sourceKey: WaterMapBSourceKey,
  chunkIndex: number,
) {
  const expectedSizeBytes = canonicalChunkExpectedSize(sourceKey, chunkIndex);
  if (expectedSizeBytes === null) {
    return {
      ok: false as const,
      status: 400,
      error: "invalid_chunk_index",
    };
  }

  const path = canonicalChunkPath(sourceKey, chunkIndex);
  const existing = await supabasePathState(path);
  if (existing.present) {
    return {
      ok: false as const,
      status: 409,
      error: "canonical_chunk_already_present",
      path,
      expectedSizeBytes,
    };
  }

  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from(SUPABASE_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data?.token) {
    throw new Error(
      `water_supabase_chunk_signed_upload_failed:${error?.message || "missing_token"}`,
    );
  }

  return {
    ok: true as const,
    status: 200,
    bucket: SUPABASE_BUCKET,
    path,
    token: data.token,
    chunkIndex,
    expectedSizeBytes,
    totalChunks: canonicalChunkCount(sourceKey),
    chunkSizeBytes: CANONICAL_CHUNK_SIZE_BYTES,
  };
}

async function chunkedSupabaseStatus(sourceKey: WaterMapBSourceKey) {
  const totalChunks = canonicalChunkCount(sourceKey);
  const chunks = [];
  for (let index = 0; index < totalChunks; index += 1) {
    const path = canonicalChunkPath(sourceKey, index);
    const expectedSizeBytes = canonicalChunkExpectedSize(sourceKey, index)!;
    const state = await supabasePathState(path);
    chunks.push({
      index,
      path,
      expectedSizeBytes,
      present: state.present,
      sizeBytes: state.sizeBytes,
      sizeMatches: state.present && state.sizeBytes === expectedSizeBytes,
      etag: state.etag,
    });
  }

  const markerPath = canonicalChunkVerificationPath(sourceKey);
  const admin = createAdminClient();
  const { data: markerBlob } = await admin.storage
    .from(SUPABASE_BUCKET)
    .download(markerPath);
  const marker = markerBlob
    ? (JSON.parse(await markerBlob.text()) as Record<string, unknown>)
    : null;
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];

  return {
    provider: "supabase-storage" as const,
    representation: "chunked-private-canonical-v1" as const,
    prefix: canonicalChunkPrefix(sourceKey),
    totalChunks,
    chunkSizeBytes: CANONICAL_CHUNK_SIZE_BYTES,
    chunks,
    present: chunks.every((chunk) => chunk.present),
    sizeMatches: chunks.every((chunk) => chunk.sizeMatches),
    markerPresent:
      marker?.marker === "pantavion_water_canonical_chunked_verification_v1",
    verified:
      marker?.marker === "pantavion_water_canonical_chunked_verification_v1" &&
      marker?.sourceKey === sourceKey &&
      marker?.sha256 === source.sha256 &&
      Number(marker?.sizeBytes) === source.byteSize &&
      marker?.header === source.dwgHeader &&
      chunks.every((chunk) => chunk.sizeMatches),
  };
}

async function verifySupabaseChunkedObject(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const totalChunks = canonicalChunkCount(sourceKey);
  const admin = createAdminClient();
  const overallHash = createHash("sha256");
  let totalSizeBytes = 0;
  let header = Buffer.alloc(0);
  const chunkRecords: Array<{
    index: number;
    path: string;
    sizeBytes: number;
    sha256: string;
    etag: string | null;
  }> = [];

  for (let index = 0; index < totalChunks; index += 1) {
    const path = canonicalChunkPath(sourceKey, index);
    const expectedSizeBytes = canonicalChunkExpectedSize(sourceKey, index)!;
    const { data, error } = await admin.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(path, 900);

    if (error || !data?.signedUrl) {
      return {
        ok: false as const,
        status: 404,
        error: "water_canonical_chunk_missing",
        chunkIndex: index,
        path,
      };
    }

    const response = await fetch(data.signedUrl, { cache: "no-store" });
    if (!response.ok || !response.body) {
      return {
        ok: false as const,
        status: response.status || 502,
        error: "water_canonical_chunk_read_failed",
        chunkIndex: index,
        path,
      };
    }

    const chunkHash = createHash("sha256");
    let chunkSizeBytes = 0;
    const reader = response.body.getReader();
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      const bytes = Buffer.from(part.value);
      chunkSizeBytes += bytes.byteLength;
      totalSizeBytes += bytes.byteLength;
      chunkHash.update(bytes);
      overallHash.update(bytes);
      if (header.byteLength < 6) {
        header = Buffer.concat([
          header,
          bytes.subarray(0, 6 - header.byteLength),
        ]);
      }
    }

    if (chunkSizeBytes !== expectedSizeBytes) {
      return {
        ok: false as const,
        status: 409,
        error: "water_canonical_chunk_size_mismatch",
        chunkIndex: index,
        path,
        expectedSizeBytes,
        actualSizeBytes: chunkSizeBytes,
      };
    }

    chunkRecords.push({
      index,
      path,
      sizeBytes: chunkSizeBytes,
      sha256: chunkHash.digest("hex"),
      etag: response.headers.get("etag"),
    });
  }

  const sha256 = overallHash.digest("hex");
  const dwgHeader = header.subarray(0, 6).toString("ascii");
  const verified =
    totalSizeBytes === source.byteSize &&
    sha256 === source.sha256 &&
    dwgHeader === source.dwgHeader;

  if (!verified) {
    return {
      ok: false as const,
      status: 409,
      error: "water_chunked_canonical_identity_mismatch",
      sizeBytes: totalSizeBytes,
      sha256,
      header: dwgHeader,
      chunks: chunkRecords,
    };
  }

  const verifiedAt = new Date().toISOString();
  const manifest = {
    schemaVersion: "pantavion-water-chunked-canonical-v1",
    representation: "chunked-private-canonical-v1",
    sourceKey,
    mapId: source.mapId,
    fileName: source.fileName,
    sha256,
    sizeBytes: totalSizeBytes,
    header: dwgHeader,
    chunkSizeBytes: CANONICAL_CHUNK_SIZE_BYTES,
    totalChunks,
    chunks: chunkRecords,
    rawBrowserExposureAllowed: false,
    immutableOriginalRequired: true,
    verifiedAt,
  };
  const marker = {
    marker: "pantavion_water_canonical_chunked_verification_v1",
    sourceKey,
    mapId: source.mapId,
    sha256,
    sizeBytes: totalSizeBytes,
    header: dwgHeader,
    totalChunks,
    chunkSizeBytes: CANONICAL_CHUNK_SIZE_BYTES,
    verifiedAt,
  };

  const manifestUpload = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(
      canonicalChunkManifestPath(sourceKey),
      Buffer.from(JSON.stringify(manifest, null, 2) + "\n", "utf8"),
      { upsert: true, contentType: "application/json", cacheControl: "0" },
    );
  if (manifestUpload.error) {
    throw new Error(
      `water_chunked_manifest_write_failed:${manifestUpload.error.message}`,
    );
  }

  const markerUpload = await admin.storage
    .from(SUPABASE_BUCKET)
    .upload(
      canonicalChunkVerificationPath(sourceKey),
      Buffer.from(JSON.stringify(marker, null, 2) + "\n", "utf8"),
      { upsert: true, contentType: "application/json", cacheControl: "0" },
    );
  if (markerUpload.error) {
    throw new Error(
      `water_chunked_marker_write_failed:${markerUpload.error.message}`,
    );
  }

  return {
    ok: true as const,
    status: 200,
    representation: "chunked-private-canonical-v1" as const,
    sourceKey,
    mapId: source.mapId,
    sizeBytes: totalSizeBytes,
    sha256,
    header: dwgHeader,
    totalChunks,
    chunkSizeBytes: CANONICAL_CHUNK_SIZE_BYTES,
    manifestPath: canonicalChunkManifestPath(sourceKey),
    verificationPath: canonicalChunkVerificationPath(sourceKey),
  };
}

async function verifiedObjectState(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const raw = await headObject(sourceKey);
  const marker = raw.present ? await readVerificationMarker(sourceKey) : null;
  const verified = Boolean(
    raw.present &&
      raw.sizeMatches &&
      marker &&
      marker.sourceKey === sourceKey &&
      marker.sha256 === source.sha256 &&
      marker.sizeBytes === source.byteSize &&
      marker.header === source.dwgHeader &&
      marker.etag === raw.etag,
  );

  return { ...raw, markerPresent: Boolean(marker), verified };
}

async function verifyObject(sourceKey: WaterMapBSourceKey) {
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const key = sourceObjectKey(sourceKey);
  const signed = presignObjectDownload(key, 900);
  const response = await fetch(signed.url, { cache: "no-store" });

  if (!response.ok || !response.body) {
    return {
      ok: false as const,
      status: response.status || 502,
      error: "water_object_read_failed",
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
    key,
    sizeBytes,
    sha256,
    header: dwgHeader,
    etag: response.headers.get("etag"),
  };
}

export async function POST(request: Request) {
  const authorization = transferAuthorization(request);
  if (!authorization) {
    return noStore({ ok: false, error: "unauthorized" }, 403);
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const action = typeof body.action === "string" ? body.action : "status";
  const sourceKey = resolveSourceKey(body.sourceKey);
  const source = WATER_MAP_B_SOURCE_CANDIDATES[sourceKey];
  const key = sourceObjectKey(sourceKey);

  const libraryImportActionAllowed =
    ["sign-upload", "head", "status", "verify"].includes(action) ||
    ["sign-chunk-upload", "chunk-status", "verify-chunked"].includes(action);

  if (authorization === "library_import" && !libraryImportActionAllowed) {
    return noStore({ ok: false, error: "library_import_action_denied" }, 403);
  }

  try {
    if (action === "sign-upload") {
      if (hasSupabaseAdminCredential()) {
        const signed = await createSupabaseSignedUpload(sourceKey);
        if (!signed.ok) {
          return noStore(
            {
              ok: false,
              error: signed.error,
              sourceKey,
              key: source.storagePath,
              immutable: true,
            },
            signed.status,
          );
        }

        return noStore({
          ok: true,
          action,
          sourceKey,
          key: source.storagePath,
          fileName: source.fileName,
          expectedSizeBytes: source.byteSize,
          expectedSha256: source.sha256,
          contentType: "application/acad",
          provider: signed.provider,
          bucket: signed.bucket,
          path: signed.path,
          token: signed.token,
          resumableEndpoint: signed.resumableEndpoint,
          chunkSizeBytes: signed.chunkSizeBytes,
          expiresSeconds: 7200,
        });
      }

      const existing = await headObject(sourceKey);
      if (existing.present) {
        return noStore(
          {
            ok: false,
            error: "canonical_object_already_present",
            sourceKey,
            key,
            immutable: true,
          },
          409,
        );
      }

      const signed = presignObjectUpload(key, 1800);
      return noStore({
        ok: true,
        action,
        sourceKey,
        key,
        fileName: source.fileName,
        expectedSizeBytes: source.byteSize,
        expectedSha256: source.sha256,
        contentType: "application/acad",
        provider: "s3-compatible",
        signedUrl: signed.url,
        expiresSeconds: signed.expiresSeconds,
      });
    }

    if (action === "sign-chunk-upload") {
      if (!hasSupabaseAdminCredential()) {
        return noStore(
          { ok: false, error: "supabase_admin_required_for_chunked_ingest" },
          503,
        );
      }

      const chunkIndex = Number(body.chunkIndex);
      const signed = await createSupabaseChunkSignedUpload(sourceKey, chunkIndex);
      if (!signed.ok) {
        return noStore(
          {
            ok: false,
            action,
            sourceKey,
            error: signed.error,
            chunkIndex,
            immutable: true,
          },
          signed.status,
        );
      }

      return noStore({
        ok: true,
        action,
        sourceKey,
        provider: "supabase-storage",
        representation: "chunked-private-canonical-v1",
        bucket: signed.bucket,
        path: signed.path,
        token: signed.token,
        chunkIndex: signed.chunkIndex,
        expectedChunkSizeBytes: signed.expectedSizeBytes,
        totalChunks: signed.totalChunks,
        chunkSizeBytes: signed.chunkSizeBytes,
        expectedSourceSizeBytes: source.byteSize,
        expectedSourceSha256: source.sha256,
        expiresSeconds: 7200,
      });
    }

    if (action === "chunk-status") {
      if (!hasSupabaseAdminCredential()) {
        return noStore(
          { ok: false, error: "supabase_admin_required_for_chunked_ingest" },
          503,
        );
      }
      const state = await chunkedSupabaseStatus(sourceKey);
      return noStore({
        ok: true,
        action,
        sourceKey,
        expectedSizeBytes: source.byteSize,
        expectedSha256: source.sha256,
        ...state,
      });
    }

    if (action === "verify-chunked") {
      if (!hasSupabaseAdminCredential()) {
        return noStore(
          { ok: false, error: "supabase_admin_required_for_chunked_ingest" },
          503,
        );
      }
      const result = await verifySupabaseChunkedObject(sourceKey);
      return noStore(
        {
          ...result,
          action,
          expectedSizeBytes: source.byteSize,
          expectedSha256: source.sha256,
        },
        result.status,
      );
    }

    if (action === "sign-download") {
      const signed = presignObjectDownload(key, 900);
      return noStore({
        ok: true,
        action,
        sourceKey,
        key,
        fileName: source.fileName,
        sizeBytes: source.byteSize,
        sha256: source.sha256,
        signedUrl: signed.url,
        expiresSeconds: signed.expiresSeconds,
      });
    }

    if (action === "head") {
      const state = hasSupabaseAdminCredential()
        ? await supabaseObjectState(sourceKey)
        : await headObject(sourceKey);
      return noStore({
        ok: true,
        action,
        sourceKey,
        expectedSizeBytes: source.byteSize,
        ...state,
      });
    }

    if (action === "status") {
      const state = hasSupabaseAdminCredential()
        ? await verifiedSupabaseObjectState(sourceKey)
        : await verifiedObjectState(sourceKey);
      return noStore({
        ok: true,
        action,
        sourceKey,
        expectedSizeBytes: source.byteSize,
        expectedSha256: source.sha256,
        ...state,
      });
    }

    if (action === "verify") {
      const usingSupabase = hasSupabaseAdminCredential();
      const result = usingSupabase
        ? await verifySupabaseObject(sourceKey)
        : await verifyObject(sourceKey);
      const verificationMarker = result.ok
        ? usingSupabase
          ? await writeSupabaseVerificationMarker(sourceKey, {
              sha256: result.sha256,
              sizeBytes: result.sizeBytes,
              header: result.header,
              etag: result.etag,
            })
          : await writeVerificationMarker(sourceKey, {
              sha256: result.sha256,
              sizeBytes: result.sizeBytes,
              header: result.header,
              etag: result.etag,
            })
        : null;

      return noStore(
        {
          ...result,
          sourceKey,
          provider: usingSupabase ? "supabase-storage" : "s3-compatible",
          expectedSizeBytes: source.byteSize,
          expectedSha256: source.sha256,
          verificationMarkerWritten: Boolean(verificationMarker),
        },
        result.status,
      );
    }

    return noStore({ ok: false, error: "unknown_action" }, 400);
  } catch (error) {
    return noStore(
      {
        ok: false,
        sourceKey,
        error:
          error instanceof Error
            ? error.message
            : "water_object_transfer_failed",
      },
      500,
    );
  }
}