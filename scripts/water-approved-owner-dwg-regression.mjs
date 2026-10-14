#!/usr/bin/env node
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  approvedOwnerSourceMatches,
  approvedOwnerSourcePrefix,
  ownerVerifiedMarkerMatches,
} from "./water-approved-owner-source.mjs";
import { loadApprovedOwnerDwg } from "./water-approved-owner-dwg-loader.mjs";

const bytes = Buffer.from("AC1032exact-original-private-dwg", "ascii");
const sha256 = createHash("sha256").update(bytes).digest("hex");
const source = { mapId: "B", byteSize: bytes.byteLength, sha256, dwgHeader: "AC1032" };
const requestId = "water-map-8f8a8523-3bf7-4ebd-9b63-e10c74c2ccee";
const prefix = approvedOwnerSourcePrefix("B", requestId);
const row = {
  request_id: requestId,
  actor_kind: "admin_session",
  storage_bucket: "personal-media",
  storage_path: prefix + "/manifest.json",
  sha256,
  file_size_bytes: bytes.length,
  ingest_state: "uploaded",
  review_state: "approved",
  metadata: {
    ownerSelectedDwgV1: true,
    targetMap: "B",
    fullByteVerification: "verified",
    approvedForGISReview: true,
    canonicalMutationAllowed: false,
  },
};
const marker = {
  marker: "pantavion_water_owner_selected_dwg_verified_v1",
  requestId, targetMap: "B", sha256,
  sizeBytes: bytes.length,
  header: "AC1032",
  approvalRequired: true,
  canonicalMutationAllowed: false,
};
const manifest = {
  ...marker,
  schemaVersion: "founder-selected-dwg-chunked-v1",
  bucket: "personal-media",
  rawMasterPrivate: true,
  geographicAlignmentVerified: false,
  chunkSizeBytes: 33554432,
  chunks: [{ index: 0, path: prefix + "/chunks/000.part", bytes: bytes.length, sha256 }],
};
assert.equal(approvedOwnerSourceMatches(row, source), true);
assert.equal(ownerVerifiedMarkerMatches(marker, row, source), true);
assert.equal(approvedOwnerSourceMatches({ ...row, review_state: "review_required" }, source), false);
assert.equal(approvedOwnerSourceMatches({ ...row, sha256: "0".repeat(64) }, source), false);
assert.equal(approvedOwnerSourceMatches({ ...row, metadata: { ...row.metadata, canonicalMutationAllowed: true } }, source), false);
assert.equal(ownerVerifiedMarkerMatches({ ...marker, header: "AC1027" }, row, source), false);

function makeClient(original = bytes, selectedRow = row) {
  const files = new Map([
    [prefix + "/verified.json", Buffer.from(JSON.stringify(marker))],
    [prefix + "/manifest.json", Buffer.from(JSON.stringify(manifest))],
    [prefix + "/chunks/000.part", original],
  ]);
  const chain = {
    select() { return this; },
    eq() { return this; },
    order() { return this; },
    async limit() { return { data: [selectedRow], error: null }; },
  };
  return {
    from(table) { assert.equal(table, "water_map_ingest_catalog"); return chain; },
    storage: {
      from(bucket) {
        assert.equal(bucket, "personal-media");
        return {
          async download(path) {
            return files.has(path)
              ? { data: new Blob([files.get(path)]), error: null }
              : { data: null, error: { message: "not_found" } };
          },
        };
      },
    },
  };
}

const loaded = await loadApprovedOwnerDwg(makeClient(), source);
assert.ok(loaded);
assert.deepEqual(loaded.buffer, bytes);
assert.equal(loaded.acquisition, "founder_approved_private_exact_dwg");
await assert.rejects(
  () => loadApprovedOwnerDwg(makeClient(Buffer.from("AC1032corrupted")), source),
  /approved_owner_chunk_identity_invalid/,
);
assert.equal(await loadApprovedOwnerDwg(makeClient(bytes, { ...row, review_state: "review_required" }), source), null);
console.log("water-approved-owner-dwg regression PASS");
