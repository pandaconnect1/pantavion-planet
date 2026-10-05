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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

  if (
    authorization === "library_import" &&
    !["sign-upload", "head", "status", "verify"].includes(action)
  ) {
    return noStore({ ok: false, error: "library_import_action_denied" }, 403);
  }

  try {
    if (action === "sign-upload") {
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
        signedUrl: signed.url,
        expiresSeconds: signed.expiresSeconds,
      });
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
      const state = await headObject(sourceKey);
      return noStore({
        ok: true,
        action,
        sourceKey,
        expectedSizeBytes: source.byteSize,
        ...state,
      });
    }

    if (action === "status") {
      const state = await verifiedObjectState(sourceKey);
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
      const result = await verifyObject(sourceKey);
      const verificationMarker = result.ok
        ? await writeVerificationMarker(sourceKey, {
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