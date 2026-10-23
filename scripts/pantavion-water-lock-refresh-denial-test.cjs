#!/usr/bin/env node
// Regression: an unauthorized lock refresh must fail closed without changing the manifest.
// This test never sets the authority flag and never writes production data.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { readFileSync } = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifest = path.join(root, "core/infrastructure/water/water-network-runtime-lock.json");
const script = path.join(root, "scripts/refresh-water-network-runtime-lock.cjs");
const before = readFileSync(manifest);
const env = { ...process.env };
delete env.PANTAVION_WATER_LOCK_REFRESH;
delete env.PANTAVION_WATER_LOCK_REFRESH_REASON;

const result = spawnSync(process.execPath, [script], {
  cwd: root,
  env,
  encoding: "utf8",
  timeout: 10000,
});
assert.equal(result.error, undefined, "refresh command must launch");
assert.notEqual(result.status, 0, "unauthorized refresh must be rejected");
assert.match(result.stderr, /water_lock_refresh_explicit_authority_required/);
assert.deepEqual(readFileSync(manifest), before, "rejected refresh must not mutate lock");
console.log("PASS: unauthorized water lock refresh rejected without manifest mutation");
