import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PANTAVION_AUTHENTIC_WATER_SOURCES,
  PANTAVION_WATER_ENGINEERING_WORKSPACE_TRUTH,
  PANTAVION_WATER_FUTURE_MAP_POLICY,
  getPantavionWaterAuthenticSourceTruth,
} from "../core/infrastructure/water/water-authentic-source-truth.ts";

const truth = getPantavionWaterAuthenticSourceTruth();

assert.equal(truth.id, "pantavion_water_authentic_source_truth_v1");
assert.equal(PANTAVION_AUTHENTIC_WATER_SOURCES.length, 3);

const a = PANTAVION_AUTHENTIC_WATER_SOURCES.find((item) => item.id === "A");
const canonical = PANTAVION_AUTHENTIC_WATER_SOURCES.find(
  (item) => item.id === "B_CANONICAL",
);
const legacy = PANTAVION_AUTHENTIC_WATER_SOURCES.find(
  (item) => item.id === "C_AUTHENTIC",
);

assert.ok(a);
assert.ok(canonical);
assert.ok(legacy);

assert.equal(a?.state, "verified_live");
assert.equal(canonical?.state, "byte_verified_not_ingested");
assert.equal(legacy?.state, "byte_verified_not_ingested");

assert.equal(canonical?.byteSize, 205565159);
assert.equal(
  canonical?.sha256,
  "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
);
assert.equal(canonical?.dwgHeader, "AC1032");

assert.equal(legacy?.byteSize, 85703125);
assert.equal(
  legacy?.sha256,
  "038b9bceda2a660296a9162723f5279e5a2d10eb18d499b087d0e8ffa393b800",
);
assert.equal(legacy?.dwgHeader, "AC1032");

assert.equal(
  PANTAVION_WATER_ENGINEERING_WORKSPACE_TRUTH.isAuthenticSourceMap,
  false,
);
assert.equal(
  PANTAVION_WATER_FUTURE_MAP_POLICY.authenticSourceRequiredBeforeCallingItAMasterMap,
  true,
);
assert.equal(
  PANTAVION_WATER_FUTURE_MAP_POLICY.noDerivedWorkspaceMayBePromotedByNamingAlone,
  true,
);
assert.equal(
  PANTAVION_WATER_FUTURE_MAP_POLICY.dEFAndFutureLettersRemainUnassignedUntilAuthenticSourcesExist,
  true,
);

for (const source of PANTAVION_AUTHENTIC_WATER_SOURCES) {
  assert.equal(source.authenticSourceRequired, true);
  assert.equal(source.immutableOriginalRequired, true);
  assert.equal(source.rawBrowserExposureAllowed, false);
}


const objectTransferRoute = fs.readFileSync(
  new URL("../app/api/internal/water/object-transfer/route.ts", import.meta.url),
  "utf8",
);
const ownerRoute = fs.readFileSync(
  new URL(
    "../app/api/professional/infrastructure/water/maps/map-b-owner/route.ts",
    import.meta.url,
  ),
  "utf8",
);

assert.match(
  objectTransferRoute,
  /pantavion_water_canonical_object_verification_v1/,
  "B/C canonical objects must persist an exact verification marker.",
);
assert.match(
  objectTransferRoute,
  /canonical_object_already_present/,
  "Canonical B/C object keys must remain immutable once present.",
);
assert.match(
  objectTransferRoute,
  /authorization === "library_import"[\s\S]*?\["sign-upload", "head", "status", "verify"\]/,
  "Temporary Library import authorization must be restricted to ingest/verification actions.",
);
assert.doesNotMatch(
  objectTransferRoute,
  /authorization === "library_import"[\s\S]*?\["sign-upload", "sign-download"/,
  "Temporary Library import authorization must never gain raw download capability.",
);

assert.match(
  ownerRoute,
  /callPantavionObjectSigner\("status", sourceKey\)/,
  "Owner route must use verified object status instead of size-only HEAD truth.",
);
assert.match(
  ownerRoute,
  /marker\?\.sha256 === source\.sha256/,
  "Private B/C fallback must bind verification to the expected SHA-256.",
);
assert.match(
  ownerRoute,
  /marker\?\.header === source\.dwgHeader/,
  "Private B/C fallback must bind verification to the expected DWG header.",
);
assert.match(
  ownerRoute,
  /marker\?\.etag === etag/,
  "Private B/C fallback must reject an object changed after exact verification.",
);
assert.doesNotMatch(
  ownerRoute,
  /privateState\.present\s*&&\s*privateState\.sizeMatches/,
  "Private B/C objects must never be trusted from presence and size alone.",
);

console.log("Pantavion Water authentic source truth PASSED.");