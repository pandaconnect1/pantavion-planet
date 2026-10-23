import assert from "node:assert/strict";
import { auditRoadReferences } from "../core/infrastructure/water/road-address-coverage-audit.ts";

const report = auditRoadReferences([
  { source: "official", sourceId: "r1", areaId: "limassol", geometryKey: "g1", streetName: "Main", buildingNumber: "12", licenseVerified: true, positionVerified: true },
  { source: "official", sourceId: "r1", areaId: "limassol", geometryKey: "g1", streetName: "Main", buildingNumber: "12", licenseVerified: true, positionVerified: true },
  { source: "commercial", sourceId: "r2", areaId: "limassol", geometryKey: "g2", streetName: "Other", licenseVerified: false, positionVerified: false },
]);
assert.equal(report.length, 1);
assert.equal(report[0].observedRoads, 1);
assert.equal(report[0].numberedAddresses, 1);
assert.equal(report[0].duplicateRecords, 1);
assert.equal(report[0].blockedUnlicensed, 1);
assert.equal(report[0].coveragePercent, null);
assert.deepEqual(auditRoadReferences([]), []);
console.log("PASS: license-gated road/address inventory does not invent coverage");
