import { writeFileSync, mkdtempSync, readFileSync, statSync, openSync, readSync, closeSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const sha256 = "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16";
const key = process.env.SUPABASE_SECRET_KEY;
if (!key) throw Error("private_service_credential_required");
const admin = createClient("https://cxhulvwkagzufbjsdwwu.supabase.co", key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const source = { mapId: "B", sha256, byteSize: 205565159, dwgHeader: "AC1032" };
const original = await loadApprovedOwnerDwg(admin, source);
if (!original) throw Error("approved_original_unavailable");

const dir = mkdtempSync(join(tmpdir(), "pantavion-native-b-"));
try {
  const dwg = join(dir, "original.dwg");
  const geojson = join(dir, "native-preview.geojson");
  writeFileSync(dwg, original.buffer, { flag: "wx", mode: 0o600 });
  const result = spawnSync("timeout", [
    "360", process.env.LIBREDWG_READ_BIN || "dwgread",
    "-O", "GeoJSON", "-o", geojson, dwg,
  ], { encoding: "utf8", timeout: 370000, maxBuffer: 1024 * 1024 });
  const exists = (() => { try { return statSync(geojson).size; } catch { return 0; } })();
  let featurePresent = false, closed = false;
  if (exists) {
    const fd = openSync(geojson, "r");
    const count = Math.min(exists, 1048576);
    const first = Buffer.alloc(count), last = Buffer.alloc(count);
    readSync(fd, first, 0, count, 0);
    readSync(fd, last, 0, count, exists - count);
    closeSync(fd);
    featurePresent = first.toString("utf8").includes('"Feature"');
    closed = last.toString("utf8").trimEnd().endsWith("}");
  }
  console.log(JSON.stringify({ kind: "native_LibreDWG_source_CAD_diagnostic",
    mapId: "B", fullOriginalVerified: true, sha256,
    exitCode: result.status, errorSignal: result.signal,
    previewBytes: exists, featurePresent, documentClosed: closed,
    note: "A provisional source-CAD probe, never GIS alignment or live publish",
    errorTail: result.stderr?.slice(-800) }));
  if (result.status !== 0 || !featurePresent || !closed) {
    throw Error("native_GeoJSON_export_incomplete");
  }
  const inspected = spawnSync("python3",
    ["scripts/water-native-b-geojson-probe.py", geojson],
    { encoding: "utf8", timeout: 240000, maxBuffer: 1024 * 1024 });
  console.log(inspected.stdout.slice(-4000));
  if (inspected.status !== 0) {
    console.error(inspected.stderr.slice(-1000));
    throw Error("native_GeoJSON_stream_inspection_failed");
  }
} finally {
  rmSync(dir, { recursive: true, force: true });
}
