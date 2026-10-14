import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  OWNER_DWG_CHUNK_BYTES, OWNER_DWG_MAX_BYTES,
  ownerDwgExpectedPieceBytes, ownerDwgFilename, ownerDwgHeader,
  ownerDwgMap, ownerDwgPieceCount, ownerDwgManifestPath,
  ownerDwgPiecePath, validOwnerDwgRequestId, validateOwnerDwgSelection,
} from "../core/water/water-owner-dwg-intake.ts";

const req = "water-map-8f8a8523-3bf7-4ebd-9b63-e10c74c2ccee";
assert.equal(validOwnerDwgRequestId(req), true);
assert.equal(validOwnerDwgRequestId("water-map-../../secret"), false);
assert.equal(ownerDwgFilename("Δίκτυο 2025 (1).dwg"), "Δίκτυο 2025 (1).dwg");
assert.equal(ownerDwgFilename("GEORGE_MAP_MASTER_B_C_FINAL (1).dwg"), "GEORGE_MAP_MASTER_B_C_FINAL (1).dwg");
assert.equal(ownerDwgFilename("../secret.dwg"), null);
assert.equal(ownerDwgFilename("network.kmz"), null);
assert.equal(ownerDwgMap("A"), null);
assert.equal(ownerDwgMap("B"), "B");
assert.equal(ownerDwgHeader("AC1032"), "AC1032");
assert.equal(ownerDwgHeader("malicious"), null);
assert.equal(ownerDwgPieceCount(205565159), 7);
assert.equal(ownerDwgPieceCount(85703125), 3);
assert.equal(OWNER_DWG_CHUNK_BYTES, 32 * 1024 * 1024);
assert.equal(ownerDwgExpectedPieceBytes(205565159, 6), 4238567);
assert.equal(ownerDwgExpectedPieceBytes(85703125, 2), 85703125 - 2 * OWNER_DWG_CHUNK_BYTES);

assert.equal(ownerDwgExpectedPieceBytes(85703125, 3), null);
assert.equal(OWNER_DWG_MAX_BYTES, 512 * 1024 * 1024);

const selected = validateOwnerDwgSelection({
  targetMap: "B", fileName: "Anything from USB (2).dwg", fileSize: 123456789, header: "AC1032",
});
assert.deepEqual(selected, {
  targetMap: "B", fileName: "Anything from USB (2).dwg", fileSize: 123456789, header: "AC1032",
});
assert.equal(validateOwnerDwgSelection({
  targetMap: "A", fileName: "x.dwg", fileSize: 123, header: "AC1032",
}), null);
assert.equal(validateOwnerDwgSelection({
  targetMap: "C", fileName: "x.dwg", fileSize: 512 * 1024 * 1024 + 1, header: "AC1032",
}), null);
const source = ownerDwgManifestPath("C", req);
const piece = ownerDwgPiecePath("C", req, 2);
assert.match(source, /owner-intake\/map-c\/water-map-/);
assert.match(piece, /owner-intake\/map-c\/water-map-.*\/chunks\/002\.part$/);

const route = readFileSync(new URL("../app/api/professional/infrastructure/water/authentic-source-vault/owner-selected/route.ts", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/professional/infrastructure/water/authentic-source-vault/page.tsx", import.meta.url), "utf8");
assert.match(route, /hasWaterAdminAuthorization\(request\)/);
assert.match(route, /isAllowedWaterVaultOrigin/);
assert.match(route, /hasPantavionFounderSession/);
assert.match(route, /owner_dwg_original_piece_hash_mismatch/);
assert.match(route, /owner_dwg_verify_before_approve/);
assert.match(route, /owner_dwg_verification_evidence_missing/);
assert.match(route, /canonicalMutationAllowed: false/);
assert.match(route, /geographicAlignmentVerified: false/);
assert.match(page, /OwnerSelectedDwgUploader targetMap="B"/);
assert.match(page, /OwnerSelectedDwgUploader targetMap="C"/);
console.log("PASS: founder-chosen B/C DWG byte-staging, integrity and approval regression");
