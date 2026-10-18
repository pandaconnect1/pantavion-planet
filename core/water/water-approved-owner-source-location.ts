/**
 * Resolves where the founder-approved authentic DWG master actually lives.
 *
 * Background: the owner upload path (`owner-intake/map-{b|c}/{requestId}/...`)
 * and the reader paths (`source-masters/...`) were never connected, so every
 * reader looked for a canonical object that the uploader had never written.
 * The approved bytes were present and byte-verified the whole time.
 *
 * This module makes the catalog row the single source of truth for location.
 * It derives nothing it cannot prove, and returns null rather than guessing.
 * It must stay free of framework and vendor imports so it can be unit tested
 * directly and reused by routes, workers and scripts alike.
 */
import {
  OWNER_DWG_BUCKET,
  OWNER_DWG_CHUNK_BYTES,
  OWNER_DWG_REPRESENTATION,
  ownerDwgManifestPath,
  ownerDwgPieceCount,
  ownerDwgPiecePath,
  ownerDwgPrefix,
  ownerDwgVerifiedPath,
  validOwnerDwgRequestId,
  type OwnerDwgTargetMap,
} from "./water-owner-dwg-intake.ts";

export type ApprovedOwnerSourceExpectation = {
  mapId: OwnerDwgTargetMap;
  byteSize: number;
  sha256: string;
  dwgHeader: string;
};

export type ApprovedOwnerSourceCatalogRow = {
  request_id?: unknown;
  actor_kind?: unknown;
  storage_bucket?: unknown;
  storage_path?: unknown;
  sha256?: unknown;
  file_size_bytes?: unknown;
  ingest_state?: unknown;
  review_state?: unknown;
  metadata?: Record<string, unknown> | null;
};

export type ApprovedOwnerSourceLocation = {
  bucket: string;
  requestId: string;
  mapId: OwnerDwgTargetMap;
  prefix: string;
  manifestPath: string;
  verifiedPath: string;
  chunkPaths: string[];
  expectedChunkSizes: number[];
  expectedChunkSha256: string[];
  totalChunks: number;
  chunkSizeBytes: number;
  sizeBytes: number;
  sha256: string;
  dwgHeader: string;
  representation: string;
  publishedLive: boolean;
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function hexDigest(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

/**
 * True only when the row is a founder-approved, fully byte-verified upload
 * whose identity matches the expected master exactly. Any missing or altered
 * governance flag fails closed.
 */
export function approvedOwnerSourceMatches(
  row: ApprovedOwnerSourceCatalogRow | null | undefined,
  expected: ApprovedOwnerSourceExpectation,
): boolean {
  if (!row) return false;
  const requestId = text(row.request_id);
  if (!requestId || !validOwnerDwgRequestId(requestId)) return false;

  let prefix: string;
  try {
    prefix = ownerDwgPrefix(expected.mapId, requestId);
  } catch {
    return false;
  }

  const metadata = row.metadata ?? null;

  return (
    row.actor_kind === "admin_session" &&
    row.storage_bucket === OWNER_DWG_BUCKET &&
    row.storage_path === `${prefix}/manifest.json` &&
    hexDigest(row.sha256) === expected.sha256.toLowerCase() &&
    Number(row.file_size_bytes) === expected.byteSize &&
    row.ingest_state === "uploaded" &&
    row.review_state === "approved" &&
    metadata?.ownerSelectedDwgV1 === true &&
    metadata?.targetMap === expected.mapId &&
    metadata?.fullByteVerification === "verified" &&
    metadata?.approvedForGISReview === true &&
    metadata?.canonicalMutationAllowed === false
  );
}

/**
 * Returns the proven on-disk location of the approved master, or null.
 * Callers must treat null as "not available" and must never fall back to a
 * hardcoded path: that fallback is the defect this module exists to remove.
 */
export function resolveApprovedOwnerSourceLocation(
  row: ApprovedOwnerSourceCatalogRow | null | undefined,
  expected: ApprovedOwnerSourceExpectation,
): ApprovedOwnerSourceLocation | null {
  if (!approvedOwnerSourceMatches(row, expected)) return null;

  const requestId = String(row!.request_id);
  const metadata = row!.metadata ?? {};

  const chunkSizeBytes = Number(metadata.chunkSizeBytes ?? OWNER_DWG_CHUNK_BYTES);
  if (chunkSizeBytes !== OWNER_DWG_CHUNK_BYTES) return null;

  const totalChunks = ownerDwgPieceCount(expected.byteSize);
  if (Number(metadata.totalChunks) !== totalChunks) return null;

  const declaredChunkHashes = Array.isArray(metadata.expectedChunkSha256)
    ? metadata.expectedChunkSha256
    : [];
  if (declaredChunkHashes.length !== totalChunks) return null;

  const expectedChunkSha256: string[] = [];
  for (const candidate of declaredChunkHashes) {
    const digest = hexDigest(candidate);
    if (!digest) return null;
    expectedChunkSha256.push(digest);
  }

  if (text(metadata.dwgHeader) !== expected.dwgHeader) return null;
  if (hexDigest(metadata.sha256) !== expected.sha256.toLowerCase()) return null;
  if (metadata.representation !== OWNER_DWG_REPRESENTATION) return null;

  const chunkPaths: string[] = [];
  const expectedChunkSizes: number[] = [];
  for (let index = 0; index < totalChunks; index += 1) {
    chunkPaths.push(ownerDwgPiecePath(expected.mapId, requestId, index));
    expectedChunkSizes.push(
      Math.min(chunkSizeBytes, expected.byteSize - index * chunkSizeBytes),
    );
  }

  const declaredTotal = expectedChunkSizes.reduce((sum, size) => sum + size, 0);
  if (declaredTotal !== expected.byteSize) return null;

  return {
    bucket: OWNER_DWG_BUCKET,
    requestId,
    mapId: expected.mapId,
    prefix: ownerDwgPrefix(expected.mapId, requestId),
    manifestPath: ownerDwgManifestPath(expected.mapId, requestId),
    verifiedPath: ownerDwgVerifiedPath(expected.mapId, requestId),
    chunkPaths,
    expectedChunkSizes,
    expectedChunkSha256,
    totalChunks,
    chunkSizeBytes,
    sizeBytes: expected.byteSize,
    sha256: expected.sha256.toLowerCase(),
    dwgHeader: expected.dwgHeader,
    representation: OWNER_DWG_REPRESENTATION,
    publishedLive: metadata.publishedLive === true,
  };
}
