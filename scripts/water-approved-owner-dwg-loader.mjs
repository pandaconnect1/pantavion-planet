import { createHash } from "node:crypto";
import { findApprovedOwnerSource } from "./water-approved-owner-resolver.mjs";

const BUCKET = "personal-media";
const PIECE_BYTES = 32 * 1024 * 1024;

async function readJson(admin, path) {
  const { data, error } = await admin.storage.from(BUCKET).download(path);
  if (error || !data) throw new Error("approved_owner_manifest_unavailable");
  try { return JSON.parse(await data.text()); }
  catch { throw new Error("approved_owner_manifest_invalid"); }
}

export async function loadApprovedOwnerDwg(admin, source) {
  const approved = await findApprovedOwnerSource(admin, source);
  if (!approved) return null;

  const manifest = await readJson(admin, approved.prefix + "/manifest.json");
  const totalParts = Math.ceil(source.byteSize / PIECE_BYTES);
  if (manifest.schemaVersion !== "founder-selected-dwg-chunked-v1" ||
      manifest.marker !== "pantavion_water_owner_selected_dwg_verified_v1" ||
      manifest.requestId !== approved.requestId ||
      manifest.targetMap !== source.mapId ||
      manifest.sha256 !== source.sha256 ||
      Number(manifest.sizeBytes) !== source.byteSize ||
      manifest.header !== source.dwgHeader ||
      manifest.bucket !== BUCKET ||
      manifest.rawMasterPrivate !== true ||
      manifest.geographicAlignmentVerified !== false ||
      Number(manifest.chunkSizeBytes) !== PIECE_BYTES ||
      !Array.isArray(manifest.chunks) ||
      manifest.chunks.length !== totalParts) {
    throw new Error("approved_owner_manifest_identity_invalid");
  }

  const sorted = [...manifest.chunks].sort((a, b) => a.index - b.index);
  const blocks = [];
  const hash = createHash("sha256");
  let total = 0;
  for (let i = 0; i < totalParts; i += 1) {
    const part = sorted[i];
    const path = approved.prefix + "/chunks/" + String(i).padStart(3, "0") + ".part";
    const expected = Math.min(PIECE_BYTES, source.byteSize - i * PIECE_BYTES);
    if (!part || part.index !== i || part.path !== path ||
        Number(part.bytes) !== expected ||
        !/^[0-9a-f]{64}$/.test(String(part.sha256))) {
      throw new Error("approved_owner_chunk_manifest_invalid");
    }
    const { data, error } = await admin.storage.from(BUCKET).download(path);
    if (error || !data) throw new Error("approved_owner_chunk_unavailable");
    const block = Buffer.from(await data.arrayBuffer());
    if (block.length !== expected ||
        createHash("sha256").update(block).digest("hex") !== part.sha256) {
      throw new Error("approved_owner_chunk_identity_invalid");
    }
    hash.update(block);
    total += block.length;
    blocks.push(block);
  }
  if (total !== source.byteSize ||
      hash.digest("hex") !== source.sha256 ||
      blocks[0].subarray(0, 6).toString("ascii") !== source.dwgHeader) {
    throw new Error("approved_owner_canonical_identity_invalid");
  }

  return {
    buffer: Buffer.concat(blocks),
    sourcePath: "supabase://" + BUCKET + "/" + approved.prefix + "/manifest.json",
    acquisition: "founder_approved_private_exact_dwg",
  };
}
