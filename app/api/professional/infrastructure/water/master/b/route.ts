import { list } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REGISTRY_MARKER = "pantavion_water_b_master_registry_api_v1";

type BlobAvailability = {
  available: boolean;
  count: number;
  error?: string;
  samplePaths?: string[];
};

function readEnv(name: string): string {
  return (process.env[name] || "").trim();
}

function getFounderAccessCode(): string {
  return (
    readEnv("PANTAVION_WATER_FOUNDER_ACCESS_CODE") ||
    readEnv("PANTAVION_WATER_ADMIN_ACCESS_CODE") ||
    readEnv("PANTAVION_ADMIN_ACCESS_CODE")
  );
}

function isFounderAuthorized(request: NextRequest): boolean {
  const expectedCode = getFounderAccessCode();

  if (!expectedCode) {
    return false;
  }

  const submittedCode =
    request.headers.get("x-pantavion-water-founder-code") ||
    request.headers.get("x-pantavion-admin-code") ||
    request.cookies.get("pantavion_water_founder_code")?.value ||
    "";

  return submittedCode.trim() === expectedCode;
}

async function checkPrivateBlobPrefix(
  prefix: string,
  expectedExactPath?: string
): Promise<BlobAvailability> {
  const token = readEnv("BLOB_READ_WRITE_TOKEN");

  if (!token) {
    return {
      available: false,
      count: 0,
      error: "missing_blob_token",
    };
  }

  if (!prefix) {
    return {
      available: false,
      count: 0,
      error: "missing_prefix",
    };
  }

  try {
    const result = await list({
      prefix,
      limit: 1000,
      token,
    });

    const paths = result.blobs.map((blob) => blob.pathname);

    return {
      available: expectedExactPath ? paths.includes(expectedExactPath) : paths.length > 0,
      count: paths.length,
      samplePaths: paths.slice(0, 10),
    };
  } catch (error) {
    return {
      available: false,
      count: 0,
      error: error instanceof Error ? error.message : "unknown_blob_error",
    };
  }
}

export async function GET(request: NextRequest) {
  if (!isFounderAuthorized(request)) {
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
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const version = readEnv("PANTAVION_WATER_B_MASTER_NATIVE_DWG_VERSION");
  const chunkPrefix = readEnv("PANTAVION_WATER_B_MASTER_NATIVE_DWG_CHUNK_PREFIX");
  const manifestPath =
    readEnv("PANTAVION_WATER_B_MASTER_NATIVE_DWG_MANIFEST_PATH") ||
    readEnv("PANTAVION_WATER_DWG_BLOB_PATH");

  const originalSha256 = readEnv("PANTAVION_WATER_B_MASTER_NATIVE_DWG_ORIGINAL_SHA256");
  const compressedSha256 = readEnv("PANTAVION_WATER_B_MASTER_NATIVE_DWG_COMPRESSED_SHA256");

  const envReady = Boolean(
    version &&
      chunkPrefix &&
      manifestPath &&
      originalSha256 &&
      compressedSha256
  );

  const manifestCheck = await checkPrivateBlobPrefix(manifestPath, manifestPath);
  const chunkCheck = await checkPrivateBlobPrefix(
    chunkPrefix ? `${chunkPrefix}/` : ""
  );

  return NextResponse.json(
    {
      ok: true,
      marker: REGISTRY_MARKER,
      access: "founder",
      bMaster: {
        role: "B_AUTHENTIC_MASTER_MAP",
        sourceFormat: "DWG",
        storageFormat: "gzip-chunked-private-blob",
        version,
        envReady,
        manifestPath,
        chunkPrefix,
        originalSha256,
        compressedSha256,
        manifestAvailable: manifestCheck.available,
        chunkObjectsAvailable: chunkCheck.available,
        chunkObjectCount: chunkCheck.count,
      },
      blobChecks: {
        manifest: manifestCheck,
        chunks: chunkCheck,
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
        bDerivedViewRequired: true,
        cIntelligentMapRequired: true,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
