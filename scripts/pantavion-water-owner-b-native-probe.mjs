#!/usr/bin/env node
// Read-only diagnostic: use the already approved, exact 205MB founder DWG.
// Do not create, upload, replace, or publish map tiles from this probe.
import { mkdtempSync, writeFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const projectUrl = "https://cxhulvwkagzufbjsdwwu.supabase.co";
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!key) throw new Error("native_probe_missing_authorized_key");
const admin = createClient(projectUrl, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const source = Object.freeze({
  sourceKey: "canonical-2026-andreaspap",
  mapId: "B",
  byteSize: 205565159,
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  dwgHeader: "AC1032",
});
const bin = process.env.PANTAVION_NATIVE_DWG2DXF;
if (!bin || !bin.startsWith("/")) throw new Error("native_probe_binary_path_missing");

async function main() {
  const original = await loadApprovedOwnerDwg(admin, source);
  if (!original) throw new Error("native_probe_approved_source_unavailable");
  console.log(JSON.stringify({
    stage: "source_verified", mapId: source.mapId,
    byteSize: original.buffer.byteLength, sha256: source.sha256, approved: true,
  }));
  const work = mkdtempSync(join(tmpdir(), "pantavion-water-native-probe-"));
  try {
    const input = join(work, "verified-original.dwg");
    const output = join(work, "converted-preview.dxf");
    writeFileSync(input, original.buffer, { mode: 0o600, flag: "wx" });
    const run = spawnSync(bin, ["--as", "r2018", "-o", output, input], {
      timeout: 22 * 60 * 1000,
      maxBuffer: 16 * 1024 * 1024,
      env: { ...process.env, LIBREDWG_TRACE: "0" },
      encoding: "utf8",
    });
    const generatedBytes = (() => {
      try { return statSync(output).size; } catch { return 0; }
    })();
    console.log(JSON.stringify({
      stage: "native_dwg_to_dxf_probe",
      converter: "GNU LibreDWG CLI",
      exitCode: run.status,
      signal: run.signal || null,
      outputBytes: generatedBytes,
      timeout: run.error?.code === "ETIMEDOUT",
    }));
    if (run.error || run.status !== 0 || generatedBytes < 1000) {
      throw new Error("native_probe_conversion_incomplete");
    }

    const check = spawnSync("python3", ["scripts/pantavion-water-native-dxf-probe.py", output], {
      encoding: "utf8", maxBuffer: 8 * 1024 * 1024,
      timeout: 8 * 60 * 1000,
    });
    if (check.stdout) process.stdout.write(check.stdout);
    if (check.error || check.status !== 0) {
      throw new Error("native_probe_dxf_geometry_failed");
    }
    console.log(JSON.stringify({ stage: "native_probe_complete", ok: true }));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(JSON.stringify({ ok: false, stage: "native_probe_failed",
    code: error.message }));
  process.exitCode = 1;
});
