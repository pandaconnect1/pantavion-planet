import assert from "node:assert/strict";

import {
  approvedOwnerSourceMatches,
  resolveApprovedOwnerSourceLocation,
} from "../core/water/water-approved-owner-source-location.ts";

const expected = {
  mapId: "B",
  byteSize: 205565159,
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16",
  dwgHeader: "AC1032",
};

const requestId = "water-map-d06d945e-e37d-4749-8d3d-e0d3a92cdd8f";
const prefix = `water-network-private/owner-intake/map-b/${requestId}`;

// Mirrors the founder-approved row recorded in water_map_ingest_catalog.
const row = {
  request_id: requestId,
  actor_kind: "admin_session",
  storage_bucket: "personal-media",
  storage_path: `${prefix}/manifest.json`,
  sha256: expected.sha256,
  file_size_bytes: expected.byteSize,
  ingest_state: "uploaded",
  review_state: "approved",
  metadata: {
    sha256: expected.sha256,
    dwgHeader: "AC1032",
    targetMap: "B",
    totalChunks: 7,
    publishedLive: false,
    chunkSizeBytes: 33554432,
    representation: "founder-selected-dwg-chunked-v1",
    founderDecision: "approve",
    ownerSelectedDwgV1: true,
    expectedChunkSha256: [
      "8dffde2a881a1e8c2d5e044fd83a25463b4ba11926e5ea5c907ff7e8c6e58dca",
      "3257b646d03b99bd0cf6480ce155b792a14725d51064a344852fbb2e5bff774f",
      "3da38eb93e611231722db4955daca2640b9e31d9674c8decaa5f3e1916b365d8",
      "0fae5b74328e6b6022a9db056a511ae45cb49f8110122147d4966f066e4ff301",
      "f582d2b506efef24353d7e555e23a8c2915652cc0722b311e4e432f9533a92b0",
      "dd9456c00952e20db4eac74d36141e618e670e62b41215d4fd3d03c6696a13c6",
      "4294c91fc4b66744185aefad21c35e60982592e3995b06dc7bb23188e5167eb8",
    ],
    approvedForGISReview: true,
    fullByteVerification: "verified",
    canonicalMutationAllowed: false,
  },
};

assert.equal(approvedOwnerSourceMatches(row, expected), true);

const located = resolveApprovedOwnerSourceLocation(row, expected);
assert.ok(located, "approved Map B master must resolve to a real location");
assert.equal(located.bucket, "personal-media");
assert.equal(located.requestId, requestId);
assert.equal(located.prefix, prefix);
assert.equal(located.manifestPath, `${prefix}/manifest.json`);
assert.equal(located.verifiedPath, `${prefix}/verified.json`);
assert.equal(located.totalChunks, 7);
assert.equal(located.chunkPaths.length, 7);
assert.equal(located.chunkPaths[0], `${prefix}/chunks/000.part`);
assert.equal(located.chunkPaths[6], `${prefix}/chunks/006.part`);
assert.equal(located.sizeBytes, expected.byteSize);
assert.equal(located.publishedLive, false);

// The declared chunk sizes must reconstruct the master byte for byte.
assert.equal(
  located.expectedChunkSizes.reduce((sum, size) => sum + size, 0),
  expected.byteSize,
);
assert.equal(located.expectedChunkSizes[6], 4238567);

// Fail closed: every governance and identity field is load bearing.
for (const field of [
  "actor_kind",
  "storage_bucket",
  "storage_path",
  "sha256",
  "ingest_state",
  "review_state",
  "request_id",
]) {
  assert.equal(
    resolveApprovedOwnerSourceLocation({ ...row, [field]: "invalid" }, expected),
    null,
    `tampered ${field} must not resolve`,
  );
}

for (const [key, value] of [
  ["approvedForGISReview", false],
  ["canonicalMutationAllowed", true],
  ["fullByteVerification", "partial"],
  ["ownerSelectedDwgV1", false],
  ["totalChunks", 6],
  ["dwgHeader", "AC1027"],
  ["representation", "something-else"],
]) {
  assert.equal(
    resolveApprovedOwnerSourceLocation(
      { ...row, metadata: { ...row.metadata, [key]: value } },
      expected,
    ),
    null,
    `tampered metadata.${key} must not resolve`,
  );
}

// A short or malformed chunk hash list must not resolve.
assert.equal(
  resolveApprovedOwnerSourceLocation(
    {
      ...row,
      metadata: {
        ...row.metadata,
        expectedChunkSha256: row.metadata.expectedChunkSha256.slice(0, 6),
      },
    },
    expected,
  ),
  null,
);

assert.equal(resolveApprovedOwnerSourceLocation(null, expected), null);

console.log("water approved owner source location: PASS");
