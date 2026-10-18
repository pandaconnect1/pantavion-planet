import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const CURRENT_GENERATOR = "pantavion-map-b-derived-v4";
// Dry run: generate and verify locally, upload nothing, keep the current manifest.
const DRY_RUN = process.env.PANTAVION_WATER_DERIVED_DRY_RUN === "YES";
// The v3 extract holds every styled segment, fill and text of a 13M-line drawing
// at once; the default V8 heap is far smaller than the runner's memory.
const HEAP_MB = Math.max(4096, Math.floor((totalmem() / 1048576) * 0.8));

// GitHub keeps step logs behind signed blob URLs; an annotation is readable from
// the run page and the checks API, so the reason for a failure is never lost.
function annotate(level, title, text) {
  const body = String(text || "").slice(-6000).replace(/%/g, "%25").replace(/\r/g, "").replace(/\n/g, "%0A");
  console.log(`::${level} title=${title}::${body}`);
}
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
  // Tiles from an older generator are rebuilt: v3 carries the drawing's own
  // colours, linetypes, lineweights, fills and text instead of a preview style.
  let current = null;
  if (!existing.error && existing.data) {
    current = JSON.parse(await existing.data.text());
    if (current.generatorVersion !== CURRENT_GENERATOR) {
      console.log(JSON.stringify({ mapId: "B", state: "rebuilding_older_derived", from: current.generatorVersion, to: CURRENT_GENERATOR }));
      current = null;
    }
  }
  if (current && !DRY_RUN) {
    const manifest = current;
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
    const result = spawnSync(process.execPath, [`--max-old-space-size=${HEAP_MB}`, "scripts/pantavion-water-map-b-generate-derived.mjs"], {
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 64 * 1024 * 1024,
      timeout: 100 * 60 * 1000,
      env: {
        ...process.env,
        PANTAVION_WATER_MAP_B_SOURCE_KEY: "canonical-2026-andreaspap",
        PANTAVION_WATER_MAP_B_DWG_PATH: file,
        PANTAVION_WATER_MAP_B_UPLOAD_DERIVED: DRY_RUN ? "NO" : "YES",
        PANTAVION_WATER_MAP_B_DERIVED_OUT: join(work, "out"),
      },
    });
    const out = String(result.stdout || "");
    const err = String(result.stderr || "");
    process.stdout.write(out);
    process.stderr.write(err);
    if (result.error || result.status !== 0) {
      annotate("error", "Map B derived generator failed", JSON.stringify({
        heapMb: HEAP_MB, status: result.status, signal: result.signal,
        spawnError: result.error ? String(result.error.message) : null,
      }) + "\n" + err.slice(-5000));
      throw Error("derived_generator_failed");
    }
    if (DRY_RUN) {
      const summary = out.slice(out.indexOf("{"));
      annotate("notice", "Map B derived dry run", summary.slice(0, 5000));
      console.log(JSON.stringify({ ok: true, mapId: "B", state: "dry_run_verified", heapMb: HEAP_MB }));
      return;
    }
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
main().catch(e => { annotate("error", "Map B derived job failed", e.message); console.error(e.message); process.exitCode = 1; });
