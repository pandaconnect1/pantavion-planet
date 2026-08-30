import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

import {
  fingerprintPantavionRecoveryRecordIds,
  materializeVerifiedPantavionRecoveryPartition,
  verifyPantavionRecoveryBatchPayload,
} from "../core/recovery/pantavion-recovery-source-reader.ts";

const root = process.cwd();
const indexPath = path.join(root, "data/recovery/runtime-fabric-v1/source-batch-index.json");
const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
const verifiedBatches = new Map();

for (const entry of index.batches) {
  const payload = fs.readFileSync(path.join(root, entry.relativePath));
  const verified = verifyPantavionRecoveryBatchPayload({ entry, payload });
  verifiedBatches.set(entry.file, verified);
}

assert.equal(verifiedBatches.size, 55);

const allRecords = [];
for (let ordinal = 1; ordinal <= index.partitionPlan.partitionCount; ordinal += 1) {
  const partition = materializeVerifiedPantavionRecoveryPartition({
    index,
    partitionOrdinal: ordinal,
    verifiedBatches,
  });
  assert.equal(partition.ordinal, ordinal);
  assert.equal(partition.recordCount, partition.endOrdinal - partition.startOrdinal + 1);
  assert.equal(partition.authority.analysis, true);
  assert.equal(partition.authority.planning, true);
  assert.equal(partition.authority.codeMutation, false);
  assert.equal(partition.authority.productionWrite, false);
  assert.equal(partition.authority.merge, false);
  assert.equal(partition.authority.deployment, false);
  assert.equal(partition.authority.publicExposure, false);
  assert.equal(partition.authority.release, false);
  allRecords.push(...partition.records);
}

assert.equal(allRecords.length, 82_413);
const ids = allRecords.map((record) => record.id);
assert.equal(new Set(ids).size, 82_413);
assert.equal(fingerprintPantavionRecoveryRecordIds(allRecords), index.corpus.orderedIdFingerprint);

const tamperedEntry = index.batches[0];
const tamperedPayload = Buffer.from(fs.readFileSync(path.join(root, tamperedEntry.relativePath)));
tamperedPayload[0] = tamperedPayload[0] === 0x7b ? 0x5b : 0x7b;
assert.throws(
  () => verifyPantavionRecoveryBatchPayload({ entry: tamperedEntry, payload: tamperedPayload }),
  /recovery_batch_sha256_mismatch/,
);

console.log("Pantavion Recovery Source Reader contract: PASS");
console.log("Cryptographically verified source batches: 55");
console.log("Reconstructed durable partitions: 165");
console.log("Reconstructed unique records: 82413");
console.log("Tampered source rejection: PASS");
