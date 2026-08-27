#!/usr/bin/env node

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(
  ROOT,
  "core",
  "infrastructure",
  "water",
  "water-network-runtime-lock.json",
);
const EXPECTED_MARKER = "pantavion_water_network_runtime_lock_v1";
const REQUIRED_PROTECTED_PATHS = [
  ".github/CODEOWNERS",
  ".github/workflows/pantavion-water-network-lock.yml",
  "app/api/professional/infrastructure/water/access/authorize/route.ts",
  "app/api/professional/infrastructure/water/admin/session/route.ts",
  "app/api/professional/infrastructure/water/segment/bbox/route.ts",
  "app/professional/infrastructure/water/admin/access/page.tsx",
  "app/professional/infrastructure/water/live/controlled-water-segment-client.tsx",
  "app/professional/infrastructure/water/live/page.tsx",
  "core/infrastructure/water/controlled-water-segment-index-provider.ts",
  "core/infrastructure/water/private-water-segment-reader.ts",
  "core/security/privileged-request-boundary.ts",
  "core/security/water-admin-session.ts",
  "scripts/pantavion-water-network-runtime-lock.cjs",
  "scripts/water-guardian-production-smoke.cjs",
  "scripts/water-segment-reader-regression.mjs",
];
const BLOCKED_PUBLIC_EXTENSIONS = new Set([
  ".db",
  ".dwg",
  ".dxf",
  ".geojson",
  ".gpkg",
  ".kml",
  ".kmz",
  ".shp",
  ".sqlite",
]);

function normalize(relativePath) {
  return relativePath.replace(/\\/g, "/");
}

function sha256(filePath) {
  return crypto
    .createHash("sha256")
    .update(fs.readFileSync(filePath))
    .digest("hex");
}

function walk(directory) {
  if (!fs.existsSync(directory)) return [];

  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

function isSafeRepositoryPath(relativePath) {
  if (!relativePath || path.isAbsolute(relativePath)) return false;

  const normalized = normalize(path.normalize(relativePath));

  return normalized !== ".." && !normalized.startsWith("../");
}

function readManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error("Water network runtime lock manifest is missing.");
  }

  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
}

const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

let manifest;

try {
  manifest = readManifest();
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Could not read water network runtime lock.",
  );
  process.exit(1);
}

assert(manifest.marker === EXPECTED_MARKER, "Lock marker is invalid.");
assert(manifest.version === 1, "Lock version must be 1.");
assert(
  Number.isFinite(Date.parse(manifest.lockedAtUtc)),
  "Lock timestamp must be a valid UTC timestamp.",
);
assert(
  manifest.sourceTruth?.placemarks === 122857,
  "Locked placemark truth must remain 122857.",
);
assert(
  manifest.sourceTruth?.lineStrings === 125398,
  "Locked line-string truth must remain 125398.",
);
assert(
  manifest.sourceTruth?.coordinatePoints === 528063,
  "Locked coordinate-point truth must remain 528063.",
);
assert(
  manifest.invariants?.privateSourceOnly === true,
  "The water source must remain private.",
);
assert(
  manifest.invariants?.browserFullNetworkAllowed === false,
  "The full water network must never be allowed in the browser.",
);
assert(
  manifest.invariants?.rawMasterPublicExposureAllowed === false,
  "The raw water master must never be publicly exposed.",
);
assert(
  manifest.invariants?.serverAuthorizationRequired === true,
  "Server authorization must remain mandatory.",
);
assert(
  manifest.invariants?.segmentedBrowserDeliveryRequired === true,
  "Segmented browser delivery must remain mandatory.",
);

const protectedFiles = manifest.protectedFiles;

assert(
  protectedFiles &&
    typeof protectedFiles === "object" &&
    !Array.isArray(protectedFiles) &&
    Object.keys(protectedFiles).length >= REQUIRED_PROTECTED_PATHS.length,
  `At least ${REQUIRED_PROTECTED_PATHS.length} critical water runtime files must be locked.`,
);

if (protectedFiles && typeof protectedFiles === "object") {
  for (const requiredPath of REQUIRED_PROTECTED_PATHS) {
    const expectedHash = protectedFiles[requiredPath];

    if (typeof expectedHash !== "string" || !/^[a-f0-9]{64}$/.test(expectedHash)) {
      failures.push(`Required protected path is missing or invalid: ${requiredPath}`);
    }
  }

  for (const [relativePath, expectedHash] of Object.entries(protectedFiles)) {
    if (!isSafeRepositoryPath(relativePath)) {
      failures.push(`Unsafe protected path: ${relativePath}`);
      continue;
    }

    const absolutePath = path.join(ROOT, relativePath);

    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      failures.push(`Protected file is missing: ${relativePath}`);
      continue;
    }

    const actualHash = sha256(absolutePath);

    if (actualHash !== expectedHash) {
      failures.push(
        `Protected file changed without a deliberate lock refresh: ${relativePath}`,
      );
    }
  }
}

const publicDirectory = path.join(ROOT, "public");

for (const filePath of walk(publicDirectory)) {
  if (BLOCKED_PUBLIC_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    failures.push(
      `Blocked public water/geospatial asset: ${normalize(path.relative(ROOT, filePath))}`,
    );
  }
}

for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (
    entry.isFile() &&
    BLOCKED_PUBLIC_EXTENSIONS.has(path.extname(entry.name).toLowerCase())
  ) {
    failures.push(`Blocked root water/geospatial asset: ${entry.name}`);
  }
}

if (failures.length > 0) {
  console.error("Pantavion water network runtime lock FAILED.");

  for (const failure of failures) {
    console.error(`- ${failure}`);
  }

  process.exit(1);
}

console.log("Pantavion water network runtime lock PASSED.");
console.log(`Verified ${Object.keys(protectedFiles).length} protected files.`);
console.log("Source truth: 122857 placemarks, 125398 line strings, 528063 points.");
console.log(
  "Private source, functional segment reader, production guardian, server authorization, and segmented browser delivery remain locked.",
);
