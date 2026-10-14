import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const source = {
  mapId: "B", byteSize: 205565159, dwgHeader: "AC1032",
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
};
const admin = createClient(
  "https://cxhulvwkagzufbjsdwwu.supabase.co",
  process.env.SUPABASE_SECRET_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

async function main() {
  if (!process.env.SUPABASE_SECRET_KEY) throw Error("admin_credential_missing");
  const path = "water-network-private/derived/map-b/" + source.sha256 + "/manifest.json";
  const existing = await admin.storage.from("personal-media").download(path);
  if (!existing.error && existing.data) {
    const manifest = JSON.parse(await existing.data.text());
    if (manifest.ok !== true || manifest.sourceSha256 !== source.sha256 ||
        !Array.isArray(manifest.tiles) || manifest.tiles.length === 0 ||
        manifest.geographicAlignmentVerified !== false) {
      throw Error("existing_derived_manifest_invalid");
    }
    console.log(JSON.stringify({ ok: true, mapId: "B", state: "derived_ready", tiles: manifest.tiles.length }));
    return;
  }
  const original = await loadApprovedOwnerDwg(admin, source);
  if (!original) throw Error("approved_exact_original_not_found");
  const work = mkdtempSync(join(tmpdir(), "water-b-"));
  try {
    const file = join(work, "verified.dwg");
    writeFileSync(file, original.buffer, { flag: "wx", mode: 0o600 });
    const result = spawnSync(process.execPath, ["scripts/pantavion-water-map-b-generate-derived.mjs"], {
      stdio: "inherit",
      timeout: 35 * 60 * 1000,
      env: {
        ...process.env,
        PANTAVION_WATER_MAP_B_SOURCE_KEY: "canonical-2026-andreaspap",
        PANTAVION_WATER_MAP_B_DWG_PATH: file,
        PANTAVION_WATER_MAP_B_UPLOAD_DERIVED: "YES",
      },
    });
    if (result.error || result.status !== 0) throw Error("derived_generator_failed");
    const { data, error } = await admin.storage.from("personal-media").download(path);
    if (error || !data) throw Error("derived_manifest_missing");
    const manifest = JSON.parse(await data.text());
    if (manifest.ok !== true || manifest.sourceSha256 !== source.sha256 ||
        !Array.isArray(manifest.tiles) || manifest.tiles.length === 0 ||
        manifest.geographicAlignmentVerified !== false) {
      throw Error("derived_output_not_verified");
    }
    console.log(JSON.stringify({ ok: true, mapId: "B", derivedTiles: manifest.tiles.length,
      lines: manifest.totalLineSegments, geographicAlignmentVerified: false }));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}
main().catch(e => { console.error(e.message); process.exitCode = 1; });
