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

function safeSecretMatch(expected: string, actual: string) {
  if (!expected || !actual) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(actual);
  return left.length === right.length && timingSafeEqual(left, right);
}

function transferAuthorized(request: Request) {
  const primary = (process.env.PANTAVION_WATER_TRANSFER_SECRET || "").trim();
  const libraryImport = (
    process.env.PANTAVION_WATER_LIBRARY_IMPORT_SECRET || ""
  ).trim();
  const actual = (request.headers.get("x-pantavion-transfer-secret") || "").trim();

  return (
    safeSecretMatch(primary, actual) ||
    safeSecretMatch(libraryImport, actual)
  );
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
  };
}

export async function POST(request: Request) {
  if (!transferAuthorized(request)) {
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

  try {
    if (action === "sign-upload") {
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

    if (action === "head" || action === "status") {
      const signed = presignObjectHead(key, 300);
      const response = await fetch(signed.url, {
        method: "HEAD",
        cache: "no-store",
      });

      const contentLength = Number(response.headers.get("content-length") || 0);

      return noStore({
        ok: true,
        action,
        sourceKey,
        key,
        present: response.ok,
        httpStatus: response.status,
        contentLength,
        expectedSizeBytes: source.byteSize,
        sizeMatches: response.ok && contentLength === source.byteSize,
        etag: response.headers.get("etag"),
      });
    }

    if (action === "verify") {
      const result = await verifyObject(sourceKey);
      return noStore(
        {
          ...result,
          sourceKey,
          expectedSizeBytes: source.byteSize,
          expectedSha256: source.sha256,
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
