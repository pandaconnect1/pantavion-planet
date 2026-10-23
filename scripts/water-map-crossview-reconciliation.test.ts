import assert from "node:assert/strict";
import { compareWaterMapObservations } from "../core/infrastructure/water/water-map-crossview-reconciliation.ts";

const rows = [
  { mapId: "A", assetId: "SV-42", geometryFingerprint: "point:1,2", sourceKey: "EPSG:4326", verifiedPosition: true, approved: true },
  { mapId: "B", assetId: "SV-42", geometryFingerprint: "point:1,3", sourceKey: "EPSG:4326", verifiedPosition: false, approved: false },
  { mapId: "D", assetId: "PIPE-9", geometryFingerprint: "line:1", sourceKey: "LOCAL-DWG", verifiedPosition: false, approved: false },
] as const;

const differences = compareWaterMapObservations(rows);
assert(differences.some((difference) => difference.assetId === "SV-42" && difference.kind === "conflicting_geometry"));
assert(differences.some((difference) => difference.assetId === "SV-42" && difference.kind === "unverified_position"));
assert(differences.some((difference) => difference.assetId === "PIPE-9" && difference.kind === "missing_in_view" && difference.mapIds.includes("A")));
assert(differences.every((difference) => difference.requiresHumanApproval === true));
assert.deepEqual(compareWaterMapObservations([]), []);

const differentCrs = compareWaterMapObservations([
  { mapId: "A", assetId: "SV-CRS", geometryFingerprint: "10,20", sourceKey: "EPSG:4326", verifiedPosition: true, approved: true },
  { mapId: "D", assetId: "SV-CRS", geometryFingerprint: "1000,2000", sourceKey: "LOCAL-DWG", verifiedPosition: true, approved: true },
]);
assert(!differentCrs.some((difference) => difference.kind === "conflicting_geometry"), "different CRS must not produce a false geometry conflict");
assert(differentCrs.some((difference) => difference.kind === "unverified_position"), "different CRS requires georeferencing review");


const duplicate = compareWaterMapObservations([
  { mapId: "A", assetId: "SV-DUP", geometryFingerprint: "p1", sourceKey: "EPSG:4326", verifiedPosition: true, approved: true },
  { mapId: "A", assetId: "SV-DUP", geometryFingerprint: "p1", sourceKey: "EPSG:4326", verifiedPosition: true, approved: true },
]);
assert(duplicate.some((difference) => difference.kind === "duplicate_asset_id" && difference.requiresHumanApproval));

const missingGeometry = compareWaterMapObservations([
  { mapId: "B", assetId: "PIPE-UNKNOWN", geometryFingerprint: "", sourceKey: "EPSG:4326", verifiedPosition: true, approved: true },
]);
assert(missingGeometry.some((difference) => difference.kind === "unverified_position"));

console.log("PASS: read-only A/B/D reconciliation requires human approval");
