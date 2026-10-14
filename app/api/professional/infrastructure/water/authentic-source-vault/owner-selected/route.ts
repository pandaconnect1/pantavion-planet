import { createHash, randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { hasWaterAdminAuthorization } from "@/core/security/water-admin-authorization";
import { hasPantavionFounderSession } from "@/core/security/pantavion-founder-session";
import { isAllowedWaterVaultOrigin } from "@/core/security/water-vault-origin";
import {
  OWNER_DWG_BUCKET,
  OWNER_DWG_CHUNK_BYTES,
  OWNER_DWG_REPRESENTATION,
  ownerDwgExpectedPieceBytes,
  ownerDwgHeader,
  ownerDwgManifestPath,
  ownerDwgMap,
  ownerDwgPieceCount,
  ownerDwgPiecePath,
  ownerDwgVerifiedPath,
  validOwnerDwgRequestId,
  validateOwnerDwgSelection,
  type OwnerDwgTargetMap,
} from "@/core/water/water-owner-dwg-intake";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// A founder may choose B or C and ANY valid DWG; this is a PRIVATE CANDIDATE
// path only. Do not write to canonical masters, approved versions, GIS tiles,
// Map A, or the public viewer from this route.
const CATALOG = "water_map_ingest_catalog";
const SOURCE_MARKER = "pantavion_water_owner_selected_dwg_verified_v1";

function reply(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store", Pragma: "no-cache" },
  });
}

async function founderOnlyReview(request: Request): Promise<boolean> {
  if (hasPantavionFounderSession(request)) return true;
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return false;
    const { data: founder, error: rpcError } = await supabase.rpc("pantavion_is_active_founder");
    return !rpcError && founder === true;
  } catch {
    return false;
  }
}

type CandidateRow = {
  request_id: string;
  actor_kind: string;
  original_file_name: string;
  file_size_bytes: number | string;
  storage_bucket: string;
  storage_path: string;
  sha256: string | null;
  ingest_state: string;
  review_state: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function fileParts(row: CandidateRow) {
  const map = ownerDwgMap(row.metadata?.targetMap);
  const requestId = row.request_id;
  const size = Number(row.file_size_bytes);
  const header = ownerDwgHeader(row.metadata?.dwgHeader);
  if (
    row.actor_kind !== "admin_session" ||
    row.metadata?.ownerSelectedDwgV1 !== true ||
    !map || !header || !validOwnerDwgRequestId(requestId) ||
    !Number.isSafeInteger(size) || size < 6 || size > 512 * 1024 * 1024 ||
    row.storage_bucket !== OWNER_DWG_BUCKET ||
    row.storage_path !== ownerDwgManifestPath(map, requestId)
  ) return null;
  return { map, requestId, size, header };
}

async function readCandidate(requestId: unknown) {
  if (!validOwnerDwgRequestId(requestId)) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.from(CATALOG).select(
    "request_id,actor_kind,original_file_name,file_size_bytes,storage_bucket,storage_path,sha256,ingest_state,review_state,metadata,created_at",
  ).eq("request_id", requestId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as CandidateRow;
  return fileParts(row) ? row : null;
}

async function pieceInfo(map: OwnerDwgTargetMap, requestId: string, size: number) {
  const admin = createAdminClient();
  const pieces = [];
  for (let index = 0; index < ownerDwgPieceCount(size); index += 1) {
    const path = ownerDwgPiecePath(map, requestId, index);
    const folder = path.slice(0, path.lastIndexOf("/"));
    const name = path.slice(path.lastIndexOf("/") + 1);
    const { data, error } = await admin.storage.from(OWNER_DWG_BUCKET)
      .list(folder, { search: name, limit: 10 });
    if (error) throw error;
    const item = data?.find(x => x.name === name);
    const metadata = item?.metadata && typeof item.metadata === "object"
      ? item.metadata as Record<string, unknown>
      : null;
    const expectedBytes = ownerDwgExpectedPieceBytes(size, index)!;
    const bytes = metadata ? Number(metadata.size ?? 0) : 0;
    pieces.push({
      index,
      present: Boolean(item),
      sizeMatches: Boolean(item && bytes === expectedBytes),
      sizeBytes: bytes,
      expectedBytes,
    });
  }
  return pieces;
}

async function readMarker(map: OwnerDwgTargetMap, requestId: string) {
  const { data, error } = await createAdminClient().storage.from(OWNER_DWG_BUCKET)
    .download(ownerDwgVerifiedPath(map, requestId));
  if (error || !data) return null;
  try {
    const value = JSON.parse(await data.text());
    return value && typeof value === "object" ? value as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

function markerMatches(
  marker: Record<string, unknown> | null,
  row: CandidateRow,
  map: OwnerDwgTargetMap,
  size: number,
  header: string,
) {
  return marker?.marker === SOURCE_MARKER &&
    marker.requestId === row.request_id &&
    marker.targetMap === map &&
    marker.sha256 === row.sha256 &&
    Number(marker.sizeBytes) === size &&
    marker.header === header;
}

async function begin(body: Record<string, unknown>) {
  const input = validateOwnerDwgSelection({
    targetMap: body.targetMap,
    fileName: body.fileName,
    fileSize: body.fileSize,
    header: body.header,
  });
  if (!input) return reply({ ok: false, error: "owner_dwg_invalid_file_or_target" }, 400);
  const submittedHashes = body.chunkSha256;
  if (!Array.isArray(submittedHashes) ||
      submittedHashes.length !== ownerDwgPieceCount(input.fileSize) ||
      !submittedHashes.every(item => typeof item === "string" && /^[0-9a-f]{64}$/.test(item))) {
    return reply({ ok: false, error: "owner_dwg_expected_piece_hashes_required" }, 400);
  }

  const admin = createAdminClient();
  const { count, error: countError } = await admin.from(CATALOG)
    .select("source_id", { head: true, count: "exact" })
    .contains("metadata", { ownerSelectedDwgV1: true })
    .eq("ingest_state", "awaiting_upload");
  if (countError) throw countError;
  if ((count || 0) >= 25) {
    return reply({ ok: false, error: "owner_dwg_pending_capacity_reached" }, 429);
  }

  const requestId = `water-map-${randomUUID()}`;
  const manifest = ownerDwgManifestPath(input.targetMap, requestId);
  const { error } = await admin.from(CATALOG).insert({
    request_id: requestId,
    actor_kind: "admin_session",
    actor_ref: "founder-water-vault",
    original_file_name: input.fileName,
    normalized_extension: "dwg",
    mime_type: "application/acad",
    file_size_bytes: input.fileSize,
    storage_bucket: OWNER_DWG_BUCKET,
    storage_path: manifest,
    detected_format: "autocad_dwg",
    format_family: "cad_2d",
    adapter_state: "known_adapter",
    ingest_state: "awaiting_upload",
    review_state: "review_required",
    metadata: {
      ownerSelectedDwgV1: true,
      targetMap: input.targetMap,
      dwgHeader: input.header,
      chunkSizeBytes: OWNER_DWG_CHUNK_BYTES,
      totalChunks: ownerDwgPieceCount(input.fileSize),
      expectedChunkSha256: submittedHashes,
      representation: OWNER_DWG_REPRESENTATION,
      rawPreservationRequired: true,
      canonicalMutationAllowed: false,
      approvalRequired: true,
      geometricVerificationRequired: true,
    },
    provenance: {
      source: "pantavion-water-founder-selected-dwg",
      receivedAt: new Date().toISOString(),
    },
  });
  if (error) throw error;

  return reply({
    ok: true,
    requestId,
    targetMap: input.targetMap,
    fileName: input.fileName,
    fileSize: input.fileSize,
    header: input.header,
    totalChunks: ownerDwgPieceCount(input.fileSize),
    reviewState: "review_required",
    canonicalMutationAllowed: false,
  });
}

async function status(row: CandidateRow) {
  const { map, requestId, size, header } = fileParts(row)!;
  const [pieces, marker] = await Promise.all([
    pieceInfo(map, requestId, size),
    readMarker(map, requestId),
  ]);
  const verified = pieces.every(p => p.sizeMatches) &&
    markerMatches(marker, row, map, size, header);
  return reply({
    ok: true,
    requestId,
    targetMap: map,
    fileName: row.original_file_name,
    fileSize: size,
    header,
    totalChunks: pieces.length,
    chunks: pieces,
    expectedChunkSha256: row.metadata?.expectedChunkSha256,
    verified,
    sha256: verified ? row.sha256 : null,
    ingestState: row.ingest_state,
    reviewState: row.review_state,
    publishedLive: false,
    canonicalMutationAllowed: false,
  });
}

async function signPiece(row: CandidateRow, indexValue: unknown) {
  const { map, requestId, size } = fileParts(row)!;
  const index = indexValue;
  if (typeof index !== "number" || !Number.isInteger(index)) {
    return reply({ ok: false, error: "owner_dwg_invalid_part_index" }, 400);
  }
  const expectedBytes = ownerDwgExpectedPieceBytes(size, index);
  if (expectedBytes === null) {
    return reply({ ok: false, error: "owner_dwg_invalid_part_index" }, 400);
  }
  if (row.review_state !== "review_required" ||
      !["awaiting_upload", "uploaded"].includes(row.ingest_state)) {
    return reply({ ok: false, error: "owner_dwg_locked_after_review" }, 409);
  }
  const pieces = await pieceInfo(map, requestId, size);
  if (pieces[index].present) {
    return reply({ ok: false, error: "owner_dwg_part_already_present", chunkIndex: index }, 409);
  }
  const path = ownerDwgPiecePath(map, requestId, index);
  const { data, error } = await createAdminClient().storage.from(OWNER_DWG_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });
  if (error || !data?.token) {
    return reply({ ok: false, error: "owner_dwg_upload_token_failed" }, 502);
  }
  return reply({
    ok: true,
    bucket: OWNER_DWG_BUCKET,
    path,
    token: data.token,
    chunkIndex: index,
    expectedChunkSizeBytes: expectedBytes,
    totalChunks: pieces.length,
  });
}

async function verify(row: CandidateRow) {
  const { map, requestId, size, header: expectedHeader } = fileParts(row)!;
  if (row.review_state !== "review_required") {
    return reply({ ok: false, error: "owner_dwg_already_reviewed" }, 409);
  }
  const pieces = await pieceInfo(map, requestId, size);
  if (!pieces.every(p => p.sizeMatches)) {
    return reply({ ok: false, error: "owner_dwg_parts_missing_or_wrong_size", chunks: pieces }, 409);
  }

  const hash = createHash("sha256");
  let readBytes = 0;
  let headerBytes = Buffer.alloc(0);
  const chunkHashes: Array<{ index: number; path: string; bytes: number; sha256: string }> = [];
  const admin = createAdminClient();

  for (const part of pieces) {
    const path = ownerDwgPiecePath(map, requestId, part.index);
    const { data, error } = await admin.storage.from(OWNER_DWG_BUCKET)
      .createSignedUrl(path, 900);
    if (error || !data?.signedUrl) {
      return reply({ ok: false, error: "owner_dwg_part_read_denied", index: part.index }, 502);
    }
    const response = await fetch(data.signedUrl, { cache: "no-store" });
    if (!response.ok || !response.body) {
      return reply({ ok: false, error: "owner_dwg_part_read_failed", index: part.index }, 502);
    }

    const partHash = createHash("sha256");
    let partBytes = 0;
    const reader = response.body.getReader();
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      const bytes = Buffer.from(next.value);
      readBytes += bytes.byteLength;
      partBytes += bytes.byteLength;
      hash.update(bytes);
      partHash.update(bytes);
      if (headerBytes.byteLength < 6) {
        headerBytes = Buffer.concat([headerBytes, bytes.subarray(0, 6 - headerBytes.byteLength)]);
      }
      if (readBytes > size || partBytes > part.expectedBytes) {
        await reader.cancel().catch(() => undefined);
        return reply({ ok: false, error: "owner_dwg_bytes_exceeded", index: part.index }, 409);
      }
    }
    if (partBytes !== part.expectedBytes) {
      return reply({ ok: false, error: "owner_dwg_part_bytes_mismatch", index: part.index }, 409);
    }
    const pieceSha256 = partHash.digest("hex");
    const expectedChunkHash = Array.isArray(row.metadata?.expectedChunkSha256)
      ? row.metadata.expectedChunkSha256[part.index] : null;
    if (pieceSha256 !== expectedChunkHash) {
      return reply({ ok: false, error: "owner_dwg_original_piece_hash_mismatch", index: part.index }, 409);
    }
    chunkHashes.push({ index: part.index, path, bytes: partBytes, sha256: pieceSha256 });
  }

  const header = headerBytes.toString("ascii");
  const sha256 = hash.digest("hex");
  if (readBytes !== size || header !== expectedHeader || !ownerDwgHeader(header)) {
    return reply({
      ok: false,
      error: "owner_dwg_server_verification_failed",
      sizeMatches: readBytes === size,
      headerMatches: header === expectedHeader,
    }, 409);
  }

  // Marker is for a PRIVATE STAGED CANDIDATE, not the production map.
  const marker = {
    marker: SOURCE_MARKER,
    requestId,
    targetMap: map,
    fileName: row.original_file_name,
    sizeBytes: size,
    sha256,
    header,
    verifiedAt: new Date().toISOString(),
    approvalRequired: true,
    publishedLive: false,
    canonicalMutationAllowed: false,
  };
  const manifest = {
    ...marker,
    schemaVersion: OWNER_DWG_REPRESENTATION,
    bucket: OWNER_DWG_BUCKET,
    chunkSizeBytes: OWNER_DWG_CHUNK_BYTES,
    chunks: chunkHashes,
    rawMasterPrivate: true,
    geographicAlignmentVerified: false,
  };
  const prefixPath = ownerDwgManifestPath(map, requestId);
  const markerPath = ownerDwgVerifiedPath(map, requestId);
  const writeManifest = await admin.storage.from(OWNER_DWG_BUCKET).upload(
    prefixPath, Buffer.from(JSON.stringify(manifest) + "\n"), {
      upsert: true, contentType: "application/json", cacheControl: "0",
    });
  if (writeManifest.error) throw writeManifest.error;
  const writeMarker = await admin.storage.from(OWNER_DWG_BUCKET).upload(
    markerPath, Buffer.from(JSON.stringify(marker) + "\n"), {
      upsert: true, contentType: "application/json", cacheControl: "0",
    });
  if (writeMarker.error) throw writeMarker.error;

  const { error: updateError } = await admin.from(CATALOG).update({
    sha256,
    ingest_state: "uploaded",
    review_state: "review_required",
    updated_at: new Date().toISOString(),
    metadata: {
      ...(row.metadata || {}),
      fullByteVerification: "verified",
      sha256,
      verifiedAt: marker.verifiedAt,
      approvalRequired: true,
      canonicalMutationAllowed: false,
      publishedLive: false,
    },
  }).eq("request_id", requestId).eq("review_state", "review_required");
  if (updateError) throw updateError;

  return reply({
    ok: true,
    verified: true,
    requestId,
    targetMap: map,
    sizeBytes: size,
    sha256,
    header,
    totalChunks: pieces.length,
    reviewState: "review_required",
    publishedLive: false,
    canonicalMutationAllowed: false,
  });
}

async function listCandidates() {
  const { data, error } = await createAdminClient().from(CATALOG)
    .select("request_id,original_file_name,file_size_bytes,sha256,ingest_state,review_state,metadata,created_at")
    .contains("metadata", { ownerSelectedDwgV1: true })
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return reply({
    ok: true,
    candidates: (data || []).map(row => ({
      requestId: row.request_id,
      fileName: row.original_file_name,
      fileSize: Number(row.file_size_bytes),
      sha256: row.sha256 || null,
      targetMap: row.metadata?.targetMap,
      ingestState: row.ingest_state,
      reviewState: row.review_state,
      verified: row.metadata?.fullByteVerification === "verified",
      publishedLive: false,
      createdAt: row.created_at,
    })),
  });
}

async function review(request: Request, row: CandidateRow, decision: unknown) {
  if (!(await founderOnlyReview(request))) {
    return reply({ ok: false, error: "founder_review_required" }, 403);
  }
  if (decision !== "approve" && decision !== "reject") {
    return reply({ ok: false, error: "invalid_founder_decision" }, 400);
  }
  if (row.review_state !== "review_required") {
    return reply({ ok: false, error: "already_reviewed" }, 409);
  }

  const parts = fileParts(row)!;
  if (decision === "approve") {
    if (row.ingest_state !== "uploaded" || !row.sha256) {
      return reply({ ok: false, error: "owner_dwg_verify_before_approve" }, 409);
    }
    const pieces = await pieceInfo(parts.map, parts.requestId, parts.size);
    const marker = await readMarker(parts.map, parts.requestId);
    if (!pieces.every(p => p.sizeMatches) ||
        !markerMatches(marker, row, parts.map, parts.size, parts.header)) {
      return reply({ ok: false, error: "owner_dwg_verification_evidence_missing" }, 409);
    }
  }
  const reviewState = decision === "approve" ? "approved" : "rejected";
  const { error } = await createAdminClient().from(CATALOG).update({
    review_state: reviewState,
    updated_at: new Date().toISOString(),
    metadata: {
      ...(row.metadata || {}),
      founderDecision: decision,
      founderReviewedAt: new Date().toISOString(),
      approvedForGISReview: decision === "approve",
      canonicalMutationAllowed: false,
      publishedLive: false,
    },
  }).eq("request_id", row.request_id).eq("review_state", "review_required");
  if (error) throw error;

  return reply({
    ok: true,
    requestId: row.request_id,
    reviewState,
    publishedLive: false,
    canonicalMutationAllowed: false,
    message: decision === "approve"
      ? "Source approved for downstream GIS review, not yet active on any map."
      : "Source rejected for publication; raw evidence preserved.",
  });
}

export async function POST(request: Request) {
  if (!(await hasWaterAdminAuthorization(request))) {
    return reply({ ok: false, error: "water_admin_session_required" }, 403);
  }
  if (!isAllowedWaterVaultOrigin(request.headers.get("origin"))) {
    return reply({ ok: false, error: "water_upload_origin_denied" }, 403);
  }
  const input = await request.json().catch(() => null);
  if (!input || Array.isArray(input) || typeof input !== "object") {
    return reply({ ok: false, error: "owner_dwg_payload_invalid" }, 400);
  }
  const body = input as Record<string, unknown>;
  try {
    switch (body.action) {
      case "begin": return await begin(body);
      case "list": return await listCandidates();
      case "status":
      case "sign-part":
      case "verify":
      case "review": {
        const row = await readCandidate(body.requestId);
        if (!row) return reply({ ok: false, error: "owner_dwg_candidate_not_found" }, 404);
        if (body.action === "status") return await status(row);
        if (body.action === "sign-part") return await signPiece(row, body.chunkIndex);
        if (body.action === "verify") return await verify(row);
        return await review(request, row, body.decision);
      }
      default: return reply({ ok: false, error: "owner_dwg_action_invalid" }, 400);
    }
  } catch (error) {
    console.error("owner_dwg_intake_failed", error instanceof Error ? error.name : "unexpected");
    return reply({ ok: false, error: "owner_dwg_storage_or_catalog_unavailable" }, 503);
  }
}
