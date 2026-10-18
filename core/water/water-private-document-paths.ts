/**
 * Canonical key space for Pantavion Water private JSON records.
 *
 * These records — field submissions, fault dossiers, access requests, help
 * threads — were written to a third-party blob store under `water/private/`.
 * The keys are preserved exactly so a record keeps its identity across the
 * move to Pantavion's own storage: the same record is the same key, before
 * and after. Nothing here is renamed for tidiness.
 *
 * Framework and vendor free, so it can be unit tested and shared by routes,
 * workers and migration tooling alike.
 */
export const WATER_PRIVATE_DOCUMENT_ROOT = "water/private" as const;

export const WATER_PRIVATE_DOCUMENT_COLLECTIONS = [
  "access-requests",
  "approved-devices",
  "fault-approval-inbox/founder-admin",
  "fault-dossiers/pending",
  "field-submissions",
  "help-requests",
  "help-thread-inbox/founder-admin",
  "help-thread-inbox/roles",
  "help-thread-inbox/users",
  "help-threads",
] as const;

export type WaterPrivateDocumentCollection =
  (typeof WATER_PRIVATE_DOCUMENT_COLLECTIONS)[number];

/**
 * Rejects anything that could escape its collection or collide once stored:
 * separators, traversal, control characters, empty or oversized segments.
 */
export function safeWaterDocumentSegment(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").trim();
  if (!cleaned || cleaned.length > 200) return null;
  if (cleaned === "." || cleaned === "..") return null;
  if (/[/\\\u0000-\u001f\u007f]/.test(cleaned)) return null;
  return cleaned;
}

export function waterPrivateDocumentPath(
  collection: WaterPrivateDocumentCollection,
  id: unknown,
): string | null {
  const segment = safeWaterDocumentSegment(id);
  if (!segment) return null;
  return `${WATER_PRIVATE_DOCUMENT_ROOT}/${collection}/${segment}.json`;
}

export function waterPrivateDocumentPrefix(
  collection: WaterPrivateDocumentCollection,
  scope?: unknown,
): string | null {
  if (scope === undefined) {
    return `${WATER_PRIVATE_DOCUMENT_ROOT}/${collection}/`;
  }
  const segment = safeWaterDocumentSegment(scope);
  if (!segment) return null;
  return `${WATER_PRIVATE_DOCUMENT_ROOT}/${collection}/${segment}/`;
}

/**
 * True only for keys inside the private water record space. Used to refuse
 * reads and writes that would reach storage outside it.
 */
export function isWaterPrivateDocumentPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (!value.startsWith(`${WATER_PRIVATE_DOCUMENT_ROOT}/`)) return false;
  if (!value.endsWith(".json")) return false;
  if (value.includes("..") || value.includes("//")) return false;
  if (/[\u0000-\u001f\u007f]/.test(value)) return false;
  return true;
}
