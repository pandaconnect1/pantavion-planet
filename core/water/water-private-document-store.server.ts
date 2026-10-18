import "server-only";

import { createAdminClient, hasSupabaseAdminCredential } from "@/lib/supabase/admin";

import {
  isWaterPrivateDocumentPath,
  type WaterPrivateDocumentCollection,
  waterPrivateDocumentPrefix,
} from "./water-private-document-paths.ts";

/**
 * Pantavion-owned storage for private Water records.
 *
 * These records lived in a third-party blob store whose account is no longer
 * funded, which puts every field submission, fault dossier, access request
 * and help thread one billing decision away from deletion. Pantavion holds
 * them from here; the third party is a read-only fallback during the move,
 * never a destination.
 *
 * Keys are unchanged, so a record keeps its identity across the move. Writes
 * land only in Pantavion storage. Reads prefer Pantavion, fall back to the
 * legacy store, and copy what they find back on the way through, so records
 * migrate themselves as they are touched while the bulk copy runs.
 */
export const WATER_PRIVATE_DOCUMENT_BUCKET = "vercel-recovery-private" as const;

const LEGACY_LIST_TIMEOUT_MS = 5000;

export type WaterPrivateDocument = Record<string, unknown>;

export type WaterPrivateDocumentOrigin = "pantavion" | "legacy" | "absent";

export type WaterPrivateDocumentRead = {
  path: string;
  origin: WaterPrivateDocumentOrigin;
  document: WaterPrivateDocument | null;
  backfilled: boolean;
};

export class WaterPrivateDocumentPathError extends Error {
  readonly code = "WATER_PRIVATE_DOCUMENT_PATH_REJECTED";

  constructor(path: unknown) {
    super(`Refused a key outside the private water record space: ${String(path)}`);
    this.name = "WaterPrivateDocumentPathError";
  }
}

function assertPath(path: unknown): asserts path is string {
  if (!isWaterPrivateDocumentPath(path)) {
    throw new WaterPrivateDocumentPathError(path);
  }
}

function legacyToken() {
  return process.env.BLOB_READ_WRITE_TOKEN?.trim() || "";
}

export function hasWaterPrivateDocumentStore() {
  return hasSupabaseAdminCredential();
}

export async function putWaterPrivateDocument(
  path: string,
  document: WaterPrivateDocument,
) {
  assertPath(path);

  const body = `${JSON.stringify(document)}\n`;
  const { error } = await createAdminClient()
    .storage.from(WATER_PRIVATE_DOCUMENT_BUCKET)
    .upload(path, body, {
      contentType: "application/json",
      upsert: true,
    });

  if (error) {
    throw new Error(`water_private_document_write_failed:${error.message}`);
  }

  return { path, sizeBytes: body.length };
}

async function readFromPantavion(
  path: string,
): Promise<WaterPrivateDocument | null> {
  const { data, error } = await createAdminClient()
    .storage.from(WATER_PRIVATE_DOCUMENT_BUCKET)
    .download(path);

  if (error || !data) return null;

  try {
    return JSON.parse(await data.text()) as WaterPrivateDocument;
  } catch {
    return null;
  }
}

type LegacyBlobEntry = {
  pathname: string;
  url?: string;
  downloadUrl?: string;
};

async function legacyList(prefix: string, limit: number) {
  const token = legacyToken();
  if (!token) return [] as LegacyBlobEntry[];

  const { list } = await import("@vercel/blob");

  const result = await Promise.race([
    list({ prefix, limit, token }),
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error("legacy_blob_timeout")),
        LEGACY_LIST_TIMEOUT_MS,
      );
    }),
  ]);

  return (result.blobs as LegacyBlobEntry[]) || [];
}

async function readFromLegacy(
  path: string,
): Promise<WaterPrivateDocument | null> {
  const token = legacyToken();
  if (!token) return null;

  let entries: LegacyBlobEntry[];
  try {
    entries = await legacyList(path, 1);
  } catch {
    return null;
  }

  const entry = entries.find((item) => item.pathname === path);
  const url = entry?.downloadUrl || entry?.url;
  if (!url) return null;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return null;

  try {
    return (await response.json()) as WaterPrivateDocument;
  } catch {
    return null;
  }
}

/**
 * Reads a record, preferring Pantavion storage. A record still held only by
 * the legacy store is copied across on the way through, so reading is itself
 * part of the migration. A failed backfill never fails the read.
 */
export async function getWaterPrivateDocument(
  path: string,
): Promise<WaterPrivateDocumentRead> {
  assertPath(path);

  const owned = await readFromPantavion(path);
  if (owned) {
    return { path, origin: "pantavion", document: owned, backfilled: false };
  }

  const legacy = await readFromLegacy(path);
  if (!legacy) {
    return { path, origin: "absent", document: null, backfilled: false };
  }

  let backfilled = false;
  try {
    await putWaterPrivateDocument(path, legacy);
    backfilled = true;
  } catch {
    // The record is still returned; the bulk copy will retry it.
  }

  return { path, origin: "legacy", document: legacy, backfilled };
}

export type WaterPrivateDocumentListEntry = {
  path: string;
  origin: WaterPrivateDocumentOrigin;
};

/**
 * Lists record keys under a collection, as the union of what Pantavion holds
 * and what the legacy store still has, so nothing disappears from a listing
 * part way through the migration.
 */
export async function listWaterPrivateDocuments(
  collection: WaterPrivateDocumentCollection,
  scope?: unknown,
  limit = 1000,
): Promise<WaterPrivateDocumentListEntry[]> {
  const prefix = waterPrivateDocumentPrefix(collection, scope);
  if (!prefix) return [];

  const seen = new Map<string, WaterPrivateDocumentOrigin>();

  const { data } = await createAdminClient()
    .storage.from(WATER_PRIVATE_DOCUMENT_BUCKET)
    .list(prefix.replace(/\/$/, ""), { limit });

  for (const item of data || []) {
    if (!item?.name?.endsWith(".json")) continue;
    seen.set(`${prefix}${item.name}`, "pantavion");
  }

  try {
    for (const entry of await legacyList(prefix, limit)) {
      if (!seen.has(entry.pathname)) seen.set(entry.pathname, "legacy");
    }
  } catch {
    // A legacy outage must not blank a listing Pantavion can already answer.
  }

  return [...seen.entries()]
    .map(([path, origin]) => ({ path, origin }))
    .sort((left, right) => left.path.localeCompare(right.path));
}
