#!/usr/bin/env node
"use strict";
// Fail-closed, read-only evidence gate. Does not query or mutate production.
const fs = require("node:fs");
const assert = require("node:assert/strict");

function evaluate(snapshot) {
  const failures = [];
  const n = (key) => {
    const value = snapshot[key];
    if (!Number.isSafeInteger(value) || value < 0) {
      failures.push(`missing or invalid nonnegative integer: ${key}`);
      return null;
    }
    return value;
  };
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return { ready: false, failures: ["snapshot must be an object"] };
  }
  const edges = n("edges");
  const nodes = n("nodes");
  const unresolved = n("unresolved_edges");
  const missing = n("edges_missing_endpoint");
  const invalid = n("invalid_geometries");
  const duplicate = n("duplicate_asset_ids");
  if (edges === 0) failures.push("no edges");
  if (nodes === 0) failures.push("no nodes");
  if (unresolved !== null && unresolved > 0) failures.push(`${unresolved} unresolved edges`);
  if (missing !== null && missing > 0) failures.push(`${missing} edges with missing endpoint`);
  if (invalid !== null && invalid > 0) failures.push(`${invalid} invalid geometries`);
  if (duplicate !== null && duplicate > 0) failures.push(`${duplicate} duplicate asset IDs`);
  if (edges !== null && unresolved !== null && unresolved > edges) failures.push("unresolved exceeds total edges");
  if (edges !== null && missing !== null && missing > edges) failures.push("missing endpoints exceeds total edges");
  if (snapshot.engineer_approved !== true) failures.push("engineering approval absent");
  if (snapshot.field_verified !== true) failures.push("field verification absent");
  if (typeof snapshot.source_revision !== "string" || !/^[a-f0-9]{64}$/i.test(snapshot.source_revision)) {
    failures.push("verified SHA-256 source revision absent");
  }
  return { ready: failures.length === 0, failures };
}

function selfTest() {
  const valid = { edges: 2, nodes: 3, unresolved_edges: 0, edges_missing_endpoint: 0,
    invalid_geometries: 0, duplicate_asset_ids: 0, engineer_approved: true,
    field_verified: true, source_revision: "a".repeat(64) };
  assert.equal(evaluate(valid).ready, true);
  assert.equal(evaluate({ ...valid, nodes: 0 }).ready, false);
  assert.equal(evaluate({ ...valid, unresolved_edges: 1 }).ready, false);
  assert.equal(evaluate({ ...valid, edges_missing_endpoint: 2 }).ready, false);
  assert.equal(evaluate({ ...valid, field_verified: false }).ready, false);
  assert.equal(evaluate({ ...valid, engineer_approved: false }).ready, false);
  assert.equal(evaluate({ ...valid, source_revision: "" }).ready, false);
  assert.equal(evaluate({ ...valid, invalid_geometries: 1 }).ready, false);
  assert.equal(evaluate({ ...valid, duplicate_asset_ids: 1 }).ready, false);
  assert.equal(evaluate({ ...valid, edges: 1, unresolved_edges: 2 }).ready, false);
  assert.equal(evaluate(null).ready, false);
  console.log("PASS: topology readiness safety gate self-tests");
}

if (require.main === module) {
  if (process.argv[2] === "--self-test") {
    selfTest();
  } else if (process.argv[2] === "--snapshot" && process.argv[3]) {
    try {
      const report = evaluate(JSON.parse(fs.readFileSync(process.argv[3], "utf8")));
      console.log(JSON.stringify(report, null, 2));
      if (!report.ready) process.exitCode = 1;
    } catch (error) {
      console.error("FAIL CLOSED:", error.message);
      process.exitCode = 1;
    }
  } else {
    console.error("Usage: node scripts/water-topology-readiness-gate.cjs --self-test | --snapshot <read-only-evidence.json>");
    process.exitCode = 2;
  }
}
module.exports = { evaluate };
