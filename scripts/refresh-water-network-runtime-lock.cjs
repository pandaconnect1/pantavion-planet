#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MANIFEST = path.join(
  ROOT,
  "core",
  "infrastructure",
  "water",
  "water-network-runtime-lock.json",
);

if (process.env.PANTAVION_WATER_LOCK_REFRESH !== "YES") {
  console.error("water_lock_refresh_explicit_authority_required");
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (manifest.marker !== "pantavion_water_network_runtime_lock_v1") {
  fail("water_lock_marker_invalid");
}
if (manifest.version !== 1) fail("water_lock_version_invalid");

const truth = manifest.sourceTruth || {};
if (
  truth.placemarks !== 122857 ||
  truth.lineStrings !== 125398 ||
  truth.coordinatePoints !== 528063
) {
  fail("water_lock_source_truth_changed");
}

const invariants = manifest.invariants || {};
if (
  invariants.privateSourceOnly !== true ||
  invariants.browserFullNetworkAllowed !== false ||
  invariants.rawMasterPublicExposureAllowed !== false ||
  invariants.serverAuthorizationRequired !== true ||
  invariants.segmentedBrowserDeliveryRequired !== true
) {
  fail("water_lock_invariants_changed");
}

const protectedFiles = manifest.protectedFiles;
if (
  !protectedFiles ||
  typeof protectedFiles !== "object" ||
  Array.isArray(protectedFiles) ||
  Object.keys(protectedFiles).length < 15
) {
  fail("water_lock_protected_file_set_invalid");
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

const refreshed = {};
for (const relative of Object.keys(protectedFiles).sort()) {
  if (
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes("..") ||
    relative.includes("\0")
  ) {
    fail("water_lock_unsafe_protected_path:" + relative);
  }

  const full = path.join(ROOT, relative);
  if (!fs.existsSync(full) || !fs.statSync(full).isFile()) {
    fail("water_lock_protected_file_missing:" + relative);
  }

  refreshed[relative] = sha256(full);
}

manifest.lockedAtUtc = new Date().toISOString();
manifest.protectedFiles = refreshed;
manifest.refreshEvidence = {
  reason:
    process.env.PANTAVION_WATER_LOCK_REFRESH_REASON ||
    "deliberate production hotfix lock refresh",
  sourceCommit: process.env.GITHUB_SHA || null,
  protectedFileCount: Object.keys(refreshed).length,
  invariantMutationAllowed: false,
  sourceTruthMutationAllowed: false,
};

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

console.log(
  JSON.stringify(
    {
      marker: "pantavion_water_network_lock_refresh_v1",
      ok: true,
      protectedFileCount: Object.keys(refreshed).length,
      sourceTruth: manifest.sourceTruth,
      invariants: manifest.invariants,
      refreshEvidence: manifest.refreshEvidence,
    },
    null,
    2,
  ),
);
