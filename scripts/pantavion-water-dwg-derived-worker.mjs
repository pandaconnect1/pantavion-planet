#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const SOURCES = [
  {
    sourceKey: "canonical-2026-andreaspap",
    mapId: "B",
    byteSize: 205565159,
    sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
    storagePath:
      "water-network-private/source-masters/map-b-original/6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16.dwg",
  },
  {
    sourceKey: "legacy-george-85m",
    mapId: "C",
    byteSize: 85703125,
    sha256: "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
    storagePath:
      "water-network-private/source-masters/map-c-original/038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800.dwg",
  },
];

const BUCKET = "personal-media";
const SUPABASE_URL =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  "https://cxhulvwkagzufbjsdwwu.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  "";

if (!SUPABASE_KEY) {
  console.error("water_dwg_derived_worker_admin_credential_missing");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const generator = path.join(__dirname, "pantavion-water-map-b-generate-derived.mjs");

async function manifestExists(source) {
  const prefix = `water-network-private/derived/map-${source.mapId.toLowerCase()}/${source.sha256}`;
  const { data, error } = await admin.storage
    .from(BUCKET)
    .list(prefix, { search: "manifest.json", limit: 10 });

  if (error) throw error;
  return Boolean(data?.some((item) => item.name === "manifest.json"));
}

// Transfer verification is independent of the older UI ingest catalog.
// The generator rechecks the actual source bytes before producing any tiles.
async function verifiedTransferExists(source) {
  const prefix = `water-network-private/source-masters/chunked/map-${source.mapId.toLowerCase()}/${source.sha256}`;
  const candidates = [
    [`${source.storagePath}.verified.json`, "pantavion_water_canonical_object_verification_v1"],
    [`${prefix}/verified.json`, "pantavion_water_canonical_chunked_verification_v1"],
  ];
  for (const [markerPath, markerType] of candidates) {
    const { data, error } = await admin.storage.from(BUCKET).download(markerPath);
    if (error) {
      if (["404", "400"].includes(String(error.statusCode)) &&
          /not found|does not exist/i.test(error.message || "")) continue;
      throw new Error("water_transfer_marker_read_failed");
    }
    if (!data) continue;
    let marker;
    try { marker = JSON.parse(await data.text()); }
    catch { throw new Error("water_transfer_marker_invalid_json"); }
    if (marker.marker !== markerType || marker.sourceKey !== source.sourceKey ||
        marker.sha256 !== source.sha256 || marker.sizeBytes !== source.byteSize ||
        marker.header !== "AC1032") {
      throw new Error("water_transfer_marker_identity_mismatch");
    }
    return true;
  }
  return false;
}

async function verifiedIngestExists(source) {
  const { data, error } = await admin
    .from("water_map_ingest_catalog")
    .select("source_id,sha256,file_size_bytes,storage_path,ingest_state,review_state")
    .eq("storage_path", source.storagePath)
    .eq("sha256", source.sha256)
    .eq("ingest_state", "ready")
    .maybeSingle();

  if (error) throw error;
  return Boolean(
    data &&
      (data.review_state === "trusted_admin" || data.review_state === "approved"),
  );
}

async function run() {
  const summary = [];

  for (const source of SOURCES) {
    const verified = (await verifiedIngestExists(source)) || (await verifiedTransferExists(source));
    if (!verified) {
      summary.push({
        mapId: source.mapId,
        sourceKey: source.sourceKey,
        state: "waiting_for_verified_ingest",
      });
      continue;
    }

    const ready = await manifestExists(source);
    if (ready) {
      summary.push({
        mapId: source.mapId,
        sourceKey: source.sourceKey,
        state: "derived_ready",
      });
      continue;
    }

    const result = spawnSync(process.execPath, [generator], {
      stdio: "inherit",
      env: {
        ...process.env,
        PANTAVION_WATER_MAP_B_SOURCE_KEY: source.sourceKey,
        PANTAVION_WATER_MAP_B_UPLOAD_DERIVED: "YES",
        SUPABASE_URL,
        SUPABASE_SECRET_KEY: SUPABASE_KEY,
      },
    });

    if (result.status !== 0) {
      console.error(
        JSON.stringify({
          ok: false,
          mapId: source.mapId,
          sourceKey: source.sourceKey,
          state: "generation_failed",
          exitCode: result.status,
        }),
      );
      process.exit(result.status || 1);
    }

    summary.push({
      mapId: source.mapId,
      sourceKey: source.sourceKey,
      state: "derived_generated",
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        worker: "pantavion_water_dwg_derived_worker_v1",
        summary,
      },
      null,
      2,
    ),
  );
}

run().catch((error) => {
  console.error(
    JSON.stringify({
      ok: false,
      worker: "pantavion_water_dwg_derived_worker_v1",
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  process.exit(1);
});
