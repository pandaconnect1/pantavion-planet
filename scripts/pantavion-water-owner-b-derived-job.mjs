import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const CURRENT_GENERATOR = "pantavion-map-b-derived-v4";
// Dry run: generate and verify locally, upload nothing, keep the current manifest.
const DRY_RUN = process.env.PANTAVION_WATER_DERIVED_DRY_RUN === "YES";
// Inventory: read the drawing, write what it holds (layers, blocks, tank/valve/
// area texts) to private storage beside the derived tiles. No tiles change.
const INVENTORY = process.env.PANTAVION_WATER_NETWORK_INVENTORY === "YES";
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
  if (current && !DRY_RUN && !INVENTORY) {
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
        PANTAVION_WATER_MAP_B_UPLOAD_DERIVED: DRY_RUN || INVENTORY ? "NO" : "YES",
        PANTAVION_WATER_MAP_B_INVENTORY: INVENTORY ? "YES" : "NO",
        PANTAVION_WATER_MAP_B_INVENTORY_OUT: join(work, "inventory.json"),
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
    if (INVENTORY) {
      const body = readFileSync(join(work, "inventory.json"));
      const inventoryPath = "water-network-private/derived/map-b/" + source.sha256 + "/inventory.json";
      const up = await admin.storage.from("personal-media").upload(inventoryPath, body, {
        upsert: true, contentType: "application/json", cacheControl: "0",
      });
      if (up.error) throw Error("inventory_upload_failed: " + up.error.message);
      const inv = JSON.parse(String(body));
      const discoveryBody = readFileSync(join(work, "inventory.json.discovery.jsonl.gz"));
      const discovery = JSON.parse(String(readFileSync(join(work, "inventory.json.discovery-summary.json"))));
      const discoveryUpload = await admin.storage.from("personal-media").upload(
        "water-network-private/derived/map-b/" + source.sha256 + "/discovery.jsonl.gz", discoveryBody,
        { upsert: true, contentType: "application/gzip", cacheControl: "0" },
      );
      if (discoveryUpload.error) throw Error("discovery_upload_failed: " + discoveryUpload.error.message);
      annotate("notice", "Full drawing evidence discovery", JSON.stringify({ ...discovery.summary, sykamCandidates: discovery.sykamCandidateRefs.length, notReproduced: discovery.extractorStats.notReproduced }));
      annotate("notice", "Sykaminou text-match candidates (not verified site identification)", JSON.stringify(discovery.sykamCandidates));
      // GitHub keeps only 10 notices per step: the register, boundary and
      // water-layer findings go first.
      if (process.env.PANTAVION_WATER_INVENTORY_READ_ONLY === "YES") {
        annotate("notice", "Read-only hidden layer and flow audit", JSON.stringify({
          sourceSha256: source.sha256,
          layers: inv.layers.length,
          hiddenLayers: inv.layers.filter((l) => l.sourceOff || l.sourceFrozen).length,
          flowLabels: inv.flowEvidence?.labelCandidates?.length ?? 0,
          flowSymbols: inv.flowEvidence?.symbolCandidates?.length ?? 0,
          tankCandidates: inv.register?.assets?.filter((a) => a.kind === "tank").length ?? 0,
          waterFlowVerified: false, databaseAssetsChanged: false,
        }));
        return;
      }
      const reg = inv.register;
      if (reg) {
        // Rows from the drawing are replaced as a set; rows from the field
        // (origin other than "drawing") are never touched here.
        const now = new Date().toISOString();
        const areaRows = reg.areas.map((a) => ({
          code: a.code, source_sha256: source.sha256, layer: a.layer, outline: a.outline, area_m2: a.areaM2,
          centroid_x: a.centroid[0], centroid_y: a.centroid[1], bounds: a.bounds, ring: a.ring, updated_at: now,
        }));
        const assetRows = reg.assets.map((a) => ({
          number: a.number, source_sha256: source.sha256, kind: a.kind, dn: a.dn ?? null, x: a.x, y: a.y,
          layer: a.layer ?? null, block: a.block ?? null, area_code: a.area ?? null,
          street: a.street?.name ?? null, street_distance: a.street?.distance ?? null,
          tag: a.tag?.text ?? null, tag_distance: a.tag?.distance ?? null,
          name: a.name ?? null, capacity_m3: a.capacityM3 ?? null, proposed: Boolean(a.proposed),
          origin: "drawing", updated_at: now,
        }));
        const del = await admin.from("water_network_assets").delete().eq("source_sha256", source.sha256).eq("origin", "drawing");
        if (del.error) throw Error("register_assets_clear_failed: " + del.error.message);
        const areasUp = await admin.from("water_network_areas").upsert(areaRows, { onConflict: "code" });
        if (areasUp.error) throw Error("register_areas_write_failed: " + areasUp.error.message);
        for (let i = 0; i < assetRows.length; i += 500) {
          const up = await admin.from("water_network_assets").upsert(assetRows.slice(i, i + 500), { onConflict: "number" });
          if (up.error) throw Error("register_assets_write_failed: " + up.error.message);
        }
        annotate("notice", "Register written", JSON.stringify({ areas: areaRows.length, assets: assetRows.length,
          withStreet: assetRows.filter((r) => r.street).length }));
        annotate("notice", "Register areas", JSON.stringify({
          areas: reg.areas.length,
          closed: reg.areas.filter((a) => a.outline === "closed").length,
          hull: reg.areas.filter((a) => a.outline === "hull").map((a) => a.code),
          list: reg.areas.map((a) => [a.code, a.outline, a.areaM2, a.centroid.map(Math.round)]),
        }));
        annotate("notice", "Register assets per area", JSON.stringify({
          assets: reg.assets.length, duplicateCopies: reg.duplicateCopies,
          tagged: reg.assets.filter((a) => a.tag).length,
          perArea: reg.summary,
        }));
        annotate("notice", "Register tanks", JSON.stringify(reg.assets.filter((a) => a.kind === "tank")
          .map((a) => [a.number, a.name, a.capacityM3, a.proposed ? "proposed" : "", a.area])));
      }
      annotate("notice", "Inventory pink dashed layers (area/zone boundaries)", JSON.stringify(
        inv.pinkDashedLayers.slice(0, 40).map((l) => [l.layer, l.pinkDashed, l.total, l.top.map((t) => `${t.color}/${t.lineType}:${t.n}`).join(" ")])));
      const water = inv.layers.filter((l) => /^(W-|FH|A\.V|PRV|DEXAMENH|PUMP|AERITHS|DIAKOPTHS)/i.test(l.layer));
      annotate("notice", "Inventory water layer extents", JSON.stringify(water.map((l) => [l.layer, l.segments, l.blocks, l.texts, l.minX, l.minY, l.maxX, l.maxY])));
      annotate("notice", "Inventory blocks (top 120)", JSON.stringify(inv.blocks.slice(0, 120).map((b) => [b.block, b.count, b.layers[0]?.layer])));
      annotate("notice", "Inventory layers with blocks or texts", JSON.stringify(inv.layers
        .filter((l) => l.blocks || l.texts).slice(0, 150).map((l) => [l.layer, l.segments, l.blocks, l.texts])));
      annotate("notice", "Network inventory totals", JSON.stringify({ path: inventoryPath, bytes: body.length, ...inv.totals }));
      // One annotation per category: a combined one is cut at the length limit.
      for (const [k, v] of Object.entries(inv.keywords)) {
        annotate("notice", `Inventory ${k} (${v.count})`, JSON.stringify({
          layers: v.layers.map((l) => [l.layer, l.n]),
          samples: v.samples.slice(0, 25).map((x) => [x.text.replace(/\s+/g, " "), x.layer, Math.round(x.x), Math.round(x.y)]),
        }));
      }
      console.log(JSON.stringify({ ok: true, mapId: "B", state: "inventory_written", path: inventoryPath }));
      return;
    }
    if (DRY_RUN) {
      const summary = out.slice(out.indexOf("{"));
      annotate("notice", "Map B derived dry run", summary.slice(0, 5000));
      console.log(JSON.stringify({ ok: true, mapId: "B", state: "dry_run_verified", heapMb: HEAP_MB }));
      return;
    }
    // The manifest is uploaded last, seconds before this read; storage can lag,
    // so retry before declaring a freshly published manifest missing.
    let data = null;
    let error = null;
    for (let attempt = 1; attempt <= 6; attempt += 1) {
      ({ data, error } = await admin.storage.from("personal-media").download(path));
      if (!error && data) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
    if (error || !data) throw Error("derived_manifest_missing: " + (error?.message || "no data"));
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

