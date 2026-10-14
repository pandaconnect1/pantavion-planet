import assert from "node:assert/strict";
import {
  approvedOwnerSourceMatches, approvedOwnerSourcePrefix, ownerVerifiedMarkerMatches,
} from "./water-approved-owner-source.mjs";

const source = { mapId: "B", byteSize: 205565159,
  sha256: "6d05c02b350ed21ba8bb03632a3aa47f138fd8d7b5ff85c540ecd8b33c016f16" };
const requestId = "water-map-d06d945e-e37d-4749-8d3d-e0d3a92cdd8f";
const prefix = approvedOwnerSourcePrefix("B", requestId);
assert.ok(prefix?.includes("/owner-intake/map-b/"));
const row = {
  request_id: requestId, actor_kind: "admin_session", storage_bucket: "personal-media",
  storage_path: prefix + "/manifest.json",
  sha256: source.sha256, file_size_bytes: source.byteSize,
  ingest_state: "uploaded", review_state: "approved",
  metadata: { ownerSelectedDwgV1: true, targetMap: "B",
    fullByteVerification: "verified", approvedForGISReview: true,
    canonicalMutationAllowed: false },
};
const marker = {
  marker: "pantavion_water_owner_selected_dwg_verified_v1",
  requestId, targetMap: "B", sha256: source.sha256,
  sizeBytes: source.byteSize, header: "AC1032",
  approvalRequired: true, canonicalMutationAllowed: false,
};
assert.equal(approvedOwnerSourceMatches(row, source), true);
assert.equal(ownerVerifiedMarkerMatches(marker, row, source), true);
for (const field of ["review_state", "ingest_state", "sha256", "actor_kind", "storage_path"]) {
  assert.equal(approvedOwnerSourceMatches({ ...row, [field]: "invalid" }, source), false);
}
assert.equal(approvedOwnerSourceMatches({ ...row,
  metadata: { ...row.metadata, approvedForGISReview: false } }, source), false);
assert.equal(approvedOwnerSourceMatches({ ...row,
  metadata: { ...row.metadata, canonicalMutationAllowed: true } }, source), false);
assert.equal(ownerVerifiedMarkerMatches({ ...marker, sha256: "wrong" }, row, source), false);
assert.equal(ownerVerifiedMarkerMatches({ ...marker, header: "AC1027" }, row, source), false);
assert.equal(approvedOwnerSourcePrefix("A", requestId), null);
assert.equal(approvedOwnerSourcePrefix("B", "../escape"), null);
console.log("owner approved DWG identity & governance regression: PASS");
