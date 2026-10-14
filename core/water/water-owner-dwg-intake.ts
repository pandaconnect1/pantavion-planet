/**
 * Immutable byte-wise DWG intake for founder-selected Water B/C candidates.
 *
 * Unlike fixed canonical master identities, this accepts any file that
 * meets structural header/size checks. No accepted upload may overwrite
 * the active map until separately reviewed and geospatially verified.
 */
export type OwnerDwgTargetMap = "B" | "C";

export const OWNER_DWG_MAX_BYTES = 512 * 1024 * 1024;
export const OWNER_DWG_CHUNK_BYTES = 32 * 1024 * 1024;
export const OWNER_DWG_BUCKET = "personal-media";
export const OWNER_DWG_REPRESENTATION = "founder-selected-dwg-chunked-v1";
export const OWNER_DWG_HEADER_VERSIONS = new Set([
  "AC1009", "AC1012", "AC1014", "AC1015",
  "AC1018", "AC1021", "AC1024", "AC1027", "AC1032",
]);

const REQUEST_PATTERN = /^water-map-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ownerDwgMap(value: unknown): OwnerDwgTargetMap | null {
  return value === "B" || value === "C" ? value : null;
}

export function validOwnerDwgRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_PATTERN.test(value);
}

export function ownerDwgFilename(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").trim();
  if (!cleaned || cleaned.length > 200 || /[/\\\u0000-\u001f\u007f]/.test(cleaned)) return null;
  if (!/\.dwg$/i.test(cleaned)) return null;
  return cleaned;
}

export function ownerDwgHeader(value: unknown): string | null {
  return typeof value === "string" && OWNER_DWG_HEADER_VERSIONS.has(value)
    ? value
    : null;
}

export function validateOwnerDwgSelection(input: {
  targetMap: unknown;
  fileName: unknown;
  fileSize: unknown;
  header: unknown;
}) {
  const targetMap = ownerDwgMap(input.targetMap);
  const fileName = ownerDwgFilename(input.fileName);
  const fileSize = input.fileSize;
  const header = ownerDwgHeader(input.header);
  if (!targetMap || !fileName || !header ||
      typeof fileSize !== "number" || !Number.isSafeInteger(fileSize) ||
      fileSize < 6 || fileSize > OWNER_DWG_MAX_BYTES) {
    return null;
  }
  return { targetMap, fileName, fileSize, header };
}

export function ownerDwgPieceCount(fileSize: number): number {
  return Math.ceil(fileSize / OWNER_DWG_CHUNK_BYTES);
}

export function ownerDwgExpectedPieceBytes(
  fileSize: number,
  index: number,
): number | null {
  const count = ownerDwgPieceCount(fileSize);
  if (!Number.isSafeInteger(fileSize) || fileSize < 6 ||
      !Number.isInteger(index) || index < 0 || index >= count) {
    return null;
  }
  return Math.min(OWNER_DWG_CHUNK_BYTES, fileSize - index * OWNER_DWG_CHUNK_BYTES);
}

export function ownerDwgPrefix(map: OwnerDwgTargetMap, requestId: string) {
  if (!validOwnerDwgRequestId(requestId)) {
    throw new Error("water_owner_dwg_invalid_request_id");
  }
  return `water-network-private/owner-intake/map-${map.toLowerCase()}/${requestId}`;
}

export function ownerDwgPiecePath(map: OwnerDwgTargetMap, requestId: string, index: number) {
  if (!Number.isInteger(index) || index < 0 || index > 999) {
    throw new Error("water_owner_dwg_invalid_piece_index");
  }
  return `${ownerDwgPrefix(map, requestId)}/chunks/${String(index).padStart(3, "0")}.part`;
}

export function ownerDwgManifestPath(map: OwnerDwgTargetMap, requestId: string) {
  return `${ownerDwgPrefix(map, requestId)}/manifest.json`;
}

export function ownerDwgVerifiedPath(map: OwnerDwgTargetMap, requestId: string) {
  return `${ownerDwgPrefix(map, requestId)}/verified.json`;
}
